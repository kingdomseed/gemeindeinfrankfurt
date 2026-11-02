"use client";

import { useActionState } from "react";

type State = { status: string };

export function CancelButton(props: {
  action: (prev: State) => Promise<State>;
  label: string;
  confirm: string;
  messages: Record<string, string>;
}) {
  const [state, formAction, pending] = useActionState(props.action, { status: "idle" });
  if (props.messages[state.status]) {
    return <p role="status" className="rounded-lg bg-surface p-4">{props.messages[state.status]}</p>;
  }
  return (
    <form
      className="border-t border-line pt-6"
      action={formAction}
      onSubmit={(e) => {
        if (!window.confirm(props.confirm)) e.preventDefault();
      }}
    >
      <button type="submit" disabled={pending} className="min-h-11 font-semibold text-danger underline disabled:opacity-50">
        {props.label}
      </button>
    </form>
  );
}
