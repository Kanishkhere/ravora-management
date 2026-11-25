import { getTeamMembers } from "@/actions/team";
import { AppNav } from "@/components/app-nav";
import { BrandMark } from "@/components/brand-mark";
import { LogoutButton } from "@/components/logout-button";
import { TeamManager } from "@/components/team-manager";
import type { TeamMember } from "@/types/team";
import { TriangleAlert, Users } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Team",
};

export default async function TeamPage() {
  let members: TeamMember[] = [];
  let loadError = "";

  try {
    members = await getTeamMembers();
  } catch {
    loadError = "The team couldn’t be loaded. Please refresh and try again.";
  }

  return (
    <div className="paper-texture min-h-screen">
      <header className="border-b border-line/80 bg-paper/75 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
          <BrandMark priority className="min-w-0" />
          <LogoutButton />
        </div>
      </header>
      <AppNav />

      <main
        data-pending-dim
        className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8 lg:py-12"
      >
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-gold-deep">
            <Users aria-hidden="true" className="size-4 shrink-0" />
            Team
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
            Your team
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
            Add the people who do appointments and set each person’s default
            incentive. Use 0% for anyone who doesn’t earn incentive. You can
            still change the percentage on a single appointment without touching
            the default.
          </p>
        </div>

        <section className="mt-8" aria-labelledby="team-heading">
          <h2 id="team-heading" className="sr-only">
            Team members
          </h2>

          {loadError ? (
            <div
              role="alert"
              className="rounded-2xl border border-red-200 bg-red-50 p-6 text-danger"
            >
              <TriangleAlert aria-hidden="true" className="size-5" />
              <p className="mt-3 font-bold">Team unavailable</p>
              <p className="mt-1 text-sm">{loadError}</p>
            </div>
          ) : (
            <TeamManager members={members} />
          )}
        </section>
      </main>
    </div>
  );
}
