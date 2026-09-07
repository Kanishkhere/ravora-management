import { BrandMark } from "@/components/brand-mark";
import { SignupForm } from "@/components/signup-form";
import { UserPlus } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign up",
  description: "Create a Ravora staff account.",
};

export default function SignupPage() {
  return (
    <main className="paper-texture grid min-h-[100dvh] lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden bg-charcoal p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden="true"
          className="absolute -right-32 -top-40 size-[34rem] rounded-full border border-gold/20"
        />
        <div
          aria-hidden="true"
          className="absolute -right-16 -top-24 size-[24rem] rounded-full border border-gold/25"
        />
        <p className="relative text-xs font-bold uppercase tracking-[0.3em] text-[#d8bd8a]">
          Ravora Beauty Studio and Academy
        </p>
        <div className="relative max-w-xl">
          <p className="font-display text-6xl font-semibold leading-[0.96]">
            Join the studio schedule.
          </p>
          <p className="mt-6 max-w-md text-sm leading-7 text-white/60">
            Create a staff account to manage appointments, payments, and the
            day’s bookings.
          </p>
        </div>
        <p className="relative text-xs text-white/40">
          For authorized staff only
        </p>
      </section>

      <section className="flex min-h-[100dvh] items-center justify-center px-4 py-8 sm:px-10 sm:py-10">
        <div className="w-full max-w-md">
          <BrandMark priority />
          <div className="mt-8 rounded-3xl border border-line bg-paper p-5 shadow-[0_24px_70px_rgb(70_55_30/9%)] sm:mt-12 sm:p-8">
            <div className="flex size-11 items-center justify-center rounded-full bg-gold/10 text-gold-deep">
              <UserPlus aria-hidden="true" className="size-5" />
            </div>
            <h1 className="mt-5 font-display text-3xl font-semibold sm:text-4xl">
              Create account
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted">
              Sign up with your work email and password.
            </p>

            <SignupForm />
          </div>
        </div>
      </section>
    </main>
  );
}
