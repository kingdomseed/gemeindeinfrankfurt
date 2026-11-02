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
    return <p className="rounded bg-neutral-100 p-3 dark:bg-neutral-800">{props.messages[state.status]}</p>;
  }
  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!window.confirm(props.confirm)) e.preventDefault();
      }}
    >
      <button type="submit" disabled={pending} className="text-red-700 underline disabled:opacity-50">
        {props.label}
      </button>
    </form>
  );
}
