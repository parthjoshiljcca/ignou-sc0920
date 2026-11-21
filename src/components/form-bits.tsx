"use client";

import { createContext, useContext, useTransition, type ComponentProps, type Ref } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { Alert, btnClass } from "./ui";

export function SubmitButton({
  children,
  pendingText,
  variant = "primary",
  className,
}: {
  children: ReactNode;
  pendingText?: string;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  className?: string;
}) {
  const { pending: formPending } = useFormStatus();
  const actionPending = useContext(ActionPending);
  const pending = formPending || actionPending;
  return (
    <button type="submit" disabled={pending} className={btnClass(variant, className)}>
      {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {pending ? pendingText ?? "Please wait…" : children}
    </button>
  );
}

export function FormMessage({ state }: { state?: { error?: string; ok?: string } }) {
  if (state?.error) return <Alert tone="error">{state.error}</Alert>;
  if (state?.ok) return <Alert tone="success">{state.ok}</Alert>;
  return null;
}

export function ConfirmSubmit({ children, message, className }: { children: ReactNode; message: string; className?: string }) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}

const ActionPending = createContext(false);

/**
 * A <form> for server actions that keeps what the user typed when the action returns an error.
 * (React's built-in `<form action>` clears uncontrolled fields after every submit, success or not.)
 * Callers that want a reset on success do it themselves (e.g. ref.current.reset() when state.ok).
 */
export function ActionForm({
  action, onSubmit, ref, children, ...props
}: Omit<ComponentProps<"form">, "action"> & { action: (fd: FormData) => void; ref?: Ref<HTMLFormElement> }) {
  const [pending, start] = useTransition();
  const submit: NonNullable<ComponentProps<"form">["onSubmit"]> = (e) => {
    onSubmit?.(e);
    if (e.defaultPrevented) return;
    e.preventDefault();
    const fd = new FormData(e.currentTarget, (e.nativeEvent as SubmitEvent).submitter);
    start(() => action(fd));
  };
  return (
    <form ref={ref} {...props} onSubmit={submit} aria-busy={pending || undefined}>
      <ActionPending.Provider value={pending}>{children}</ActionPending.Provider>
    </form>
  );
}
