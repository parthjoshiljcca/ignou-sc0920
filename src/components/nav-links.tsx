"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  Home, LifeBuoy, CalendarDays, Megaphone, Bell, User, LayoutDashboard, Inbox, Users, CircleHelp, ClipboardCheck,
} from "lucide-react";

const ICONS = { Home, LifeBuoy, CalendarDays, Megaphone, Bell, User, LayoutDashboard, Inbox, Users, CircleHelp, ClipboardCheck };
export type NavItem = { href: string; label: string; short?: string; icon: keyof typeof ICONS; badge?: number; exact?: boolean };

function useActive() {
  const path = usePathname();
  return (i: NavItem) => (i.exact ? path === i.href : path === i.href || path.startsWith(i.href + "/"));
}

export function SideNav({ items }: { items: NavItem[] }) {
  const isActive = useActive();
  return (
    <nav className="space-y-1" aria-label="Main">
      {items.map((i) => {
        const Icon = ICONS[i.icon];
        const active = isActive(i);
        return (
          <Link
            key={i.href}
            href={i.href}
            aria-current={active ? "page" : undefined}
            className={clsx(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active ? "bg-primary-soft text-primary" : "text-muted hover:bg-surface-2 hover:text-text",
            )}
          >
            <Icon className="size-[18px]" aria-hidden />
            <span className="flex-1">{i.label}</span>
            {!!i.badge && (
              <span className="rounded-full bg-accent px-1.5 text-[11px] font-bold leading-5 text-white">{i.badge}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export function BottomNav({ items }: { items: NavItem[] }) {
  const isActive = useActive();
  return (
    <nav
      aria-label="Main"
      className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 backdrop-blur lg:hidden"
    >
      <ul className="mx-auto grid max-w-xl" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map((i) => {
          const Icon = ICONS[i.icon];
          const active = isActive(i);
          return (
            <li key={i.href}>
              <Link
                href={i.href}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "relative flex min-h-[60px] min-w-0 flex-col items-center justify-center gap-1 font-semibold",
                  items.length > 5 ? "px-0 text-[10px] tracking-[-0.03em]" : "px-0.5 text-[11px] tracking-tight",
                  active ? "text-primary" : "text-muted",
                )}
              >
                <span className={clsx("grid h-7 w-12 place-items-center rounded-full", active && "bg-primary-soft")}>
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="block w-full truncate text-center">{i.short ?? i.label}</span>
                {!!i.badge && (
                  <span className="absolute top-1.5 left-1/2 ml-3 rounded-full bg-accent px-1.5 text-[10px] font-bold leading-4 text-white">
                    {i.badge}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
