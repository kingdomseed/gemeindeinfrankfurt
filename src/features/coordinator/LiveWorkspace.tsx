"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { usePathname } from "@/i18n/navigation";
import type { CurrentCoordinator } from "@/lib/coordinator";
import { peersOnPath, type PresencePeer } from "@/lib/domain/presence";
import { createClient, isSubscribed } from "@/lib/supabase/browser";

import { normalizeCoordinatorPath, sectionFromPath } from "./sections";

type LiveContextValue = {
  peersOnPage: readonly PresencePeer[];
  setEditing: (id: string, editing: boolean) => void;
};

const LiveContext = createContext<LiveContextValue>({
  peersOnPage: [],
  setEditing: () => undefined,
});

export function useCoordinatorLive(): LiveContextValue {
  return use(LiveContext);
}

const SCOPED_TABLES = [
  "registrations",
  "study_groups",
  "services",
  "training_reports",
  "reimbursements",
  "training_links",
  "outline_orders",
  "localities",
  "training_sites",
  "email_sends",
  "sessions",
] as const;

const GLOBAL_TABLES = [
  "study_group_members",
  "test_slots",
  "attendance",
  "message_hymns",
  "message_verses",
  "coordinators",
  "webcast_logins",
] as const;

function createRefreshScheduler(refresh: () => void, delayMs: number) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return {
    schedule: () => {
      clearTimeout(timer);
      timer = setTimeout(refresh, delayMs);
    },
    cancel: () => clearTimeout(timer),
  };
}

function LiveSync(props: {
  trainingId: string;
  currentUser: CurrentCoordinator | null;
  children: ReactNode;
}) {
  const { trainingId, currentUser } = props;
  const router = useRouter();
  const currentPath = normalizeCoordinatorPath(usePathname());
  const currentSection = sectionFromPath(currentPath);

  const [rawPresence, setRawPresence] = useState<Record<string, readonly unknown[]>>({});
  const editingIdsRef = useRef<Set<string>>(new Set());
  const locationRef = useRef({ path: currentPath, section: currentSection });
  const trackRef = useRef<(() => void) | null>(null);

  const setEditing = useCallback((id: string, editing: boolean) => {
    const ids = editingIdsRef.current;
    const had = ids.has(id);
    if (had === editing) return;
    if (editing) ids.add(id);
    else ids.delete(id);
    trackRef.current?.();
  }, []);

  useEffect(() => {
    const supabase = createClient();
    const { schedule: scheduleRefresh, cancel: cancelRefresh } = createRefreshScheduler(
      () => router.refresh(),
      250,
    );

    const filter = `training_id=eq.${trainingId}`;
    let channel = supabase.channel(
      `coordination:${trainingId}`,
      currentUser ? { config: { presence: { key: currentUser.userId } } } : undefined,
    );

    for (const table of SCOPED_TABLES) {
      channel = channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table, filter },
        scheduleRefresh,
      );
    }
    channel = channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "trainings", filter: `id=eq.${trainingId}` },
      scheduleRefresh,
    );
    for (const table of GLOBAL_TABLES) {
      channel = channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        scheduleRefresh,
      );
    }

    const pushPresence = () => {
      if (!currentUser) return;
      void channel.track({
        userId: currentUser.userId,
        name: currentUser.displayName,
        path: locationRef.current.path,
        section: locationRef.current.section,
        editing: editingIdsRef.current.size > 0,
      });
    };
    trackRef.current = pushPresence;

    if (currentUser) {
      channel = channel.on("presence", { event: "sync" }, () => {
        setRawPresence(channel.presenceState());
      });
    }

    channel.subscribe((status) => {
      if (isSubscribed(status)) pushPresence();
    });

    return () => {
      trackRef.current = null;
      cancelRefresh();
      if (currentUser) void channel.untrack();
      void channel.unsubscribe();
      void supabase.removeChannel(channel);
    };
  }, [router, trainingId, currentUser]);

  useEffect(() => {
    locationRef.current = { path: currentPath, section: currentSection };
    trackRef.current?.();
  }, [currentPath, currentSection]);

  const peersOnPage = useMemo(
    () => (currentUser ? peersOnPath(rawPresence, currentUser.userId, currentPath) : []),
    [rawPresence, currentUser, currentPath],
  );
  const value = useMemo(() => ({ peersOnPage, setEditing }), [peersOnPage, setEditing]);

  return <LiveContext value={value}>{props.children}</LiveContext>;
}

// Keeps open coordinator screens fresh via debounced Realtime DB subscriptions
// and broadcasts ephemeral Presence (who is viewing/editing each page) without locks.
export function LiveWorkspace(props: {
  trainingId: string | null;
  currentUser: CurrentCoordinator | null;
  children: ReactNode;
}) {
  if (!props.trainingId) return props.children;
  return (
    <LiveSync trainingId={props.trainingId} currentUser={props.currentUser}>
      {props.children}
    </LiveSync>
  );
}
