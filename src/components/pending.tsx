"use client";

import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { useLinkStatus } from "next/link";

/** Small animated spinner that inherits the current text colour. */
export function Spinner({ className = "size-4" }: { className?: string }) {
  return (
    <Loader2
      aria-hidden="true"
      className={`${className} animate-spin motion-reduce:animate-none`}
    />
  );
}

/**
 * Invisible marker. While rendered, globals.css shows the top progress bar
 * and dims the page content (see `data-pending-dim`).
 */
export function NavMarker({ active }: { active: boolean }) {
  return active ? <span data-nav-pending="" hidden /> : null;
}

/**
 * Use inside a <Link>: shows a spinner instead of its children (an icon)
 * while navigating. Takes the icon as an element so server components can use it.
 */
export function LinkIcon({
  children,
  className = "size-4",
}: {
  children: ReactNode;
  className?: string;
}) {
  const { pending } = useLinkStatus();

  return (
    <>
      <NavMarker active={pending} />
      {pending ? <Spinner className={className} /> : children}
    </>
  );
}

/** Use inside a <Link> that has no icon: shows a spinner while navigating. */
export function LinkSpinner({ className = "size-4" }: { className?: string }) {
  const { pending } = useLinkStatus();

  return (
    <>
      <NavMarker active={pending} />
      {pending && <Spinner className={className} />}
    </>
  );
}
