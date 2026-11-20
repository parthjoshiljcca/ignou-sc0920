"use client";

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
  const { pending } = useFormStatus();
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
