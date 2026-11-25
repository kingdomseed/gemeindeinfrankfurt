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

type LiveUser = { userId: string; displayName: string };

function LiveSync(props: {
  trainingId: string;
  currentUser: LiveUser | null;
  children: ReactNode;
}) {
  const { trainingId, currentUser } = props;
  const userId = currentUser?.userId ?? null;
  const displayName = currentUser?.displayName ?? null;
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
    const ac = new AbortController();
    const { signal } = ac;
    const supabase = createClient();
    const { schedule: scheduleRefresh, cancel: cancelRefresh } = createRefreshScheduler(
      () => router.refresh(),
      250,
    );
    let activeChannel: ReturnType<typeof supabase.channel> | null = null;

    async function connect() {
      const { data } = await supabase.auth.getSession();
      if (data.session?.access_token && !signal.aborted) {
        await supabase.realtime.setAuth(data.session.access_token);
      }
      if (signal.aborted) return;

      const filter = `training_id=eq.${trainingId}`;
      let channel = supabase.channel(
        `coordination:${trainingId}`,
        userId ? { config: { presence: { key: userId } } } : undefined,
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
        if (!userId || !displayName) return;
        void channel.track({
          userId,
          name: displayName,
          path: locationRef.current.path,
          section: locationRef.current.section,
          editing: editingIdsRef.current.size > 0,
        });
      };
      trackRef.current = pushPresence;

      if (userId) {
        channel = channel.on("presence", { event: "sync" }, () => {
          if (!signal.aborted) setRawPresence(channel.presenceState());
        });
      }

      activeChannel = channel;
      channel.subscribe((status) => {
        if (!signal.aborted && isSubscribed(status)) pushPresence();
      });
    }

    void connect();

    return () => {
      ac.abort();
      trackRef.current = null;
      cancelRefresh();
      if (activeChannel) {
        if (userId) void activeChannel.untrack();
        void supabase.removeChannel(activeChannel);
      }
    };
  }, [router, trainingId, userId, displayName]);

  useEffect(() => {
    locationRef.current = { path: currentPath, section: currentSection };
    trackRef.current?.();
  }, [currentPath, currentSection]);

  const peersOnPage = useMemo(
    () => (userId ? peersOnPath(rawPresence, userId, currentPath) : []),
    [rawPresence, userId, currentPath],
  );
  const value = useMemo(() => ({ peersOnPage, setEditing }), [peersOnPage, setEditing]);

  return <LiveContext value={value}>{props.children}</LiveContext>;
}

// Keeps open coordinator screens fresh via debounced Realtime DB subscriptions
// and broadcasts ephemeral Presence (who is viewing/editing each page) without locks.
export function LiveWorkspace(props: {
  trainingId: string | null;
  currentUser: LiveUser | null;
  children: ReactNode;
}) {
  if (!props.trainingId) return props.children;
  return (
    <LiveSync trainingId={props.trainingId} currentUser={props.currentUser}>
      {props.children}
    </LiveSync>
  );
}
