import { Clock, MapPin, User, Video } from "lucide-react";
import type { CounsellingSession } from "@/db/schema";
import { fmtTime } from "@/lib/format";
import { Pill } from "./ui";

export function SessionCard({ s, actions }: { s: CounsellingSession; actions?: React.ReactNode }) {
  const live = Date.now() >= new Date(s.startsAt).getTime() - 15 * 60 * 1000 && Date.now() <= new Date(s.endsAt).getTime();
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-base font-bold">{s.courseCode}</span>
        <Pill tone="primary">{s.programme === "ALL" ? "All programmes" : s.programme}</Pill>
        {s.mode === "online" ? <Pill tone="accent">Online</Pill> : <Pill>At centre</Pill>}
        {live && <Pill tone="accent">● Now</Pill>}
      </div>
      {s.title && <p className="mt-1 text-sm">{s.title}</p>}
      <div className="mt-3 grid gap-1.5 text-sm text-muted">
        <span className="flex items-center gap-2">
          <Clock className="size-4 shrink-0" aria-hidden /> {fmtTime(s.startsAt)} – {fmtTime(s.endsAt)}
        </span>
        {s.counsellor && (
          <span className="flex items-center gap-2">
            <User className="size-4 shrink-0" aria-hidden /> {s.counsellor}
          </span>
        )}
        {s.mode === "offline" && s.venue && (
          <span className="flex items-center gap-2">
            <MapPin className="size-4 shrink-0" aria-hidden /> {s.venue}
          </span>
        )}
      </div>
      {s.notes && <p className="prose-msg mt-2 text-sm text-muted">{s.notes}</p>}
      {(s.meetingLink || actions) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {s.mode === "online" && s.meetingLink && (
            <a href={s.meetingLink} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center gap-2 rounded-[10px] bg-primary-fill px-3 text-sm font-semibold text-on-primary">
              <Video className="size-4" aria-hidden /> Join class
            </a>
          )}
          {actions}
        </div>
      )}
    </div>
  );
}
