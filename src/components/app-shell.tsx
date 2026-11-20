import Link from "next/link";
import { and, count, eq } from "drizzle-orm";
import { Bell, LogOut } from "lucide-react";
import type { ReactNode } from "react";
import { db, schema } from "@/db";
import type { User } from "@/db/schema";
import { logoutAction } from "@/actions/auth";
import { BottomNav, SideNav, type NavItem } from "./nav-links";
import { AppSetupSheet, LiveUpdates } from "./pwa";
import { Credit, Logo } from "./logo";
import { CENTRE } from "@/lib/constants";
import { properName } from "@/lib/format";

export async function AppShell({ user, children }: { user: User; children: ReactNode }) {
  const isAdmin = user.role === "admin";
  const [{ n: unread }] = await db
    .select({ n: count() })
    .from(schema.notifications)
    .where(and(eq(schema.notifications.userId, user.id), eq(schema.notifications.isRead, false)));

  let openTickets = 0;
  if (isAdmin) {
    const [{ n }] = await db.select({ n: count() }).from(schema.tickets).where(eq(schema.tickets.status, "open"));
    openTickets = n;
  }

  const notifHref = isAdmin ? "/admin/notifications" : "/notifications";
  const items: NavItem[] = isAdmin
    ? [
        { href: "/admin", label: "Overview", icon: "LayoutDashboard", exact: true },
        { href: "/admin/tickets", label: "Queries", icon: "Inbox", badge: openTickets },
        { href: "/admin/schedule", label: "Schedule", icon: "CalendarDays" },
        { href: "/admin/notices", label: "Notices", icon: "Megaphone" },
        { href: "/admin/students", label: "Students", icon: "Users" },
        { href: "/admin/faqs", label: "FAQs", icon: "CircleHelp" },
      ]
    : [
        { href: "/dashboard", label: "Home", icon: "Home" },
        { href: "/tickets", label: "Help Desk", icon: "LifeBuoy" },
        { href: "/schedule", label: "Classes", icon: "CalendarDays" },
        { href: "/notices", label: "Notices", icon: "Megaphone" },
        { href: "/profile", label: "Profile", icon: "User" },
      ];
  const sideItems: NavItem[] = isAdmin
    ? [...items, { href: notifHref, label: "Notifications", icon: "Bell", badge: unread }, { href: "/profile", label: "My account", icon: "User" }]
    : [...items.slice(0, 2), { href: "/faqs", label: "FAQs", icon: "CircleHelp" }, ...items.slice(2, 4), { href: notifHref, label: "Notifications", icon: "Bell", badge: unread }, items[4]];

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[256px_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-border bg-surface p-4 lg:flex">
        <Link href={isAdmin ? "/admin" : "/dashboard"} className="mb-6 flex items-center gap-3 px-2">
          <Logo />
          <div className="leading-tight">
            <p className="font-bold">{CENTRE.shortName}</p>
            <p className="text-xs text-muted">{isAdmin ? "Coordinator desk" : "IGNOU Study Centre"}</p>
          </div>
        </Link>
        <SideNav items={sideItems} />
        <div className="mt-auto border-t border-border pt-4">
          <p className="truncate px-2 text-sm font-semibold">{properName(user.name)}</p>
          <p className="truncate px-2 text-xs text-muted">{isAdmin ? user.email : `${user.enrollmentNo} · ${user.programme}`}</p>
          <form action={logoutAction} className="mt-2">
            <button className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-sm font-medium text-muted hover:bg-surface-2 hover:text-text">
              <LogOut className="size-[18px]" aria-hidden /> Sign out
            </button>
          </form>
          <Link href="/about" className="mt-3 block px-2 text-xs font-medium text-muted hover:text-text">About this app</Link>
          <Credit className="mt-1 px-2 text-[11px]" />
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-surface/95 px-4 backdrop-blur lg:hidden">
          <Logo className="size-8" />
          <p className="flex-1 font-bold">{CENTRE.shortName}</p>
          <Link href={notifHref} aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`} className="relative rounded-full p-2 text-muted hover:text-text">
            <Bell className="size-5" />
            {unread > 0 && (
              <span className="absolute top-0.5 right-0.5 min-w-4 rounded-full bg-accent px-1 text-center text-[10px] font-bold leading-4 text-white">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </Link>
          {isAdmin && (
            <form action={logoutAction}>
              <button aria-label="Sign out" className="rounded-full p-2 text-muted hover:text-text">
                <LogOut className="size-5" />
              </button>
            </form>
          )}
        </header>
        <main className="mx-auto w-full max-w-5xl px-4 pt-5 pb-28 sm:px-6 lg:px-8 lg:pt-8 lg:pb-12">
          {children}
          <p className="mt-12 text-center text-xs lg:hidden"><Link href="/about" className="font-medium text-primary">About this app</Link></p>
          <Credit className="mt-1 text-center lg:hidden" />
        </main>
      </div>
      <BottomNav items={items} />
      <LiveUpdates unread={unread} />
      <AppSetupSheet />
    </div>
  );
}
