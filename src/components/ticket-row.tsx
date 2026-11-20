import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { StatusBadge, PriorityBadge } from "./ui";
import { timeAgo } from "@/lib/format";

export function TicketRow({
  href, id, subject, category, status, priority, updatedAt, who,
}: {
  href: string; id: number; subject: string; category: string; status: string; priority?: string; updatedAt: Date; who?: string;
}) {
  return (
    <Link href={href} className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-surface-2">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={status} />
          {priority && <PriorityBadge priority={priority} />}
          <span className="text-xs text-muted">#{id} · {category}</span>
        </div>
        <p className="mt-1 truncate font-semibold">{subject}</p>
        <p className="text-xs text-muted">{who ? `${who} · ` : ""}Updated {timeAgo(updatedAt)}</p>
      </div>
      <ChevronRight className="size-5 shrink-0 text-muted" aria-hidden />
    </Link>
  );
}
