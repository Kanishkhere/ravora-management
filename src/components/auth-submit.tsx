"use client";

import { ArrowRight } from "lucide-react";
import { useFormStatus } from "react-dom";

import { Spinner } from "./pending";

type AuthSubmitProps = {
  idleLabel: string;
  pendingLabel: string;
};

export function AuthSubmit({ idleLabel, pendingLabel }: AuthSubmitProps) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className="button-primary w-full" disabled={pending}>
      {pending && <Spinner />}
      {pending ? pendingLabel : idleLabel}
      {!pending && <ArrowRight aria-hidden="true" className="size-4" />}
    </button>
  );
}
