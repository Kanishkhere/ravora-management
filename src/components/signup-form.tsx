"use client";

import { signup, type AuthResult } from "@/actions/auth";
import Link from "next/link";
import { useActionState } from "react";
import { AuthSubmit } from "./auth-submit";

async function submitSignup(
  _previousState: AuthResult,
  formData: FormData,
): Promise<AuthResult> {
  return signup(formData);
}

export function SignupForm() {
  const [state, formAction] = useActionState(submitSignup, {});

  return (
    <form action={formAction} className="mt-7 space-y-5">
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
          autoComplete="new-password"
          minLength={6}
          required
        />
      </label>
      <label>
        <span className="field-label">Confirm password</span>
        <input
          className="field"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          minLength={6}
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
      <AuthSubmit idleLabel="Create account" pendingLabel="Creating account…" />
      <p className="text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-bold text-gold-deep hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
