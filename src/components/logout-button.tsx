"use client";

import { LogOut } from "lucide-react";
import { useFormStatus } from "react-dom";

import { logout } from "@/actions/auth";

import { Spinner } from "./pending";

function LogoutSubmit() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className="button-secondary size-11 p-0 sm:w-auto sm:px-4"
      aria-label="Log out"
      disabled={pending}
    >
      {pending ? (
        <Spinner />
      ) : (
        <LogOut aria-hidden="true" className="size-4" />
      )}
      <span className="hidden sm:inline">
        {pending ? "Logging out…" : "Log out"}
      </span>
    </button>
  );
}

export function LogoutButton() {
  return (
    <form action={logout}>
      <LogoutSubmit />
    </form>
  );
}
