"use client";

import { login } from "@/actions/auth";
import Link from "next/link";
import { useActionState } from "react";
import { AuthSubmit } from "./auth-submit";

type LoginFormProps = {
  initialError?: string;
  initialMessage?: string;
  nextPath?: string;
};

export function LoginForm({
  initialError,
  initialMessage,
  nextPath,
}: LoginFormProps) {
  const [state, formAction] = useActionState(login, {
    error: initialError,
    message: initialMessage,
  });

  return (
    <form action={formAction} className="mt-7 space-y-5">
      {nextPath && <input type="hidden" name="next" value={nextPath} />}
      <label>
        <span className="field-label">Email address</span>
        <input
          className="field"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@ravora.com"
          required
          autoFocus
        />
      </label>
      <label>
        <span className="field-label">Password</span>
        <input
          className="field"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </label>
      {state.error && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-danger"
        >
          {state.error}
        </p>
      )}
      {state.message && (
        <p
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
        >
          {state.message}
        </p>
      )}
      <AuthSubmit idleLabel="Sign in" pendingLabel="Signing in…" />
      <p className="text-center text-sm text-muted">
        Need an account?{" "}
        <Link href="/signup" className="font-bold text-gold-deep hover:underline">
          Sign up
        </Link>
      </p>
    </form>
  );
}
