"use client";

import { CalendarDays, Receipt } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { LinkIcon } from "./pending";

const tabs = [
  { href: "/", label: "Schedule", icon: CalendarDays },
  { href: "/expenses", label: "Expenses", icon: Receipt },
] as const;

export function AppNav() {
  const pathname = usePathname();
  const onExpenses = pathname.startsWith("/expenses");

  return (
    <nav
      aria-label="Main sections"
      className="border-b border-line/80 bg-paper/60"
    >
      <div className="mx-auto flex max-w-6xl gap-1 px-4 sm:px-6 lg:px-8">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = href === "/expenses" ? onExpenses : !onExpenses;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`-mb-px flex h-12 items-center gap-2 border-b-2 px-4 text-sm font-bold transition ${
                active
                  ? "border-gold text-charcoal"
                  : "border-transparent text-muted hover:text-charcoal"
              }`}
            >
              <LinkIcon>
                <Icon aria-hidden="true" className="size-4" />
              </LinkIcon>
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
