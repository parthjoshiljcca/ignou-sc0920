"use client";

import { useState } from "react";
import clsx from "clsx";
import { Plus, X } from "lucide-react";

const norm = (raw: string) => {
  const s = raw.trim().toUpperCase().replace(/\s+/g, "");
  const m = s.match(/^([A-Z]{2,8})-?(\d{1,4}[A-Z]{0,2})$/);
  return m ? `${m[1]}-${m[2]}` : null;
};

/** Pick course codes: tap a suggestion or type one (MCS211 → MCS-211). Submits as a hidden "courses" field. */
export function CoursePicker({ suggestions, already = [], name = "courses" }: { suggestions: string[]; already?: string[]; name?: string }) {
  const [picked, setPicked] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [err, setErr] = useState("");

  const add = (raw: string) => {
    // "MCS 211" is one course; "MCS-211, MCS-212" or "MCS211 MCS212" are several.
    const parts = raw.split(/[,;]+/).map((p) => p.trim()).filter(Boolean)
      .flatMap((p) => (norm(p) ? [p] : p.split(/\s+/).filter(Boolean)));
    const next = [...picked];
    for (const p of parts) {
      const c = norm(p);
      if (!c) { setErr(`“${p}” is not a course code — write like MCS-211`); return; }
      if (already.includes(c)) { setErr(`${c} is already submitted for this term`); return; }
      if (!next.includes(c)) next.push(c);
    }
    setErr(""); setPicked(next); setText("");
  };
  const toggle = (c: string) => setPicked((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]));

  return (
    <div className="space-y-3">
      <input type="hidden" name={name} value={picked.join(",")} />
      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); if (text.trim()) add(text); } }}
          placeholder="Type a course code, e.g. MCS-211"
          className="input uppercase"
          aria-label="Course code"
          autoCapitalize="characters"
        />
        <button type="button" onClick={() => text.trim() && add(text)} className="inline-flex shrink-0 items-center gap-1 rounded-[10px] border border-border bg-surface px-3 text-sm font-semibold hover:bg-surface-2">
          <Plus className="size-4" aria-hidden /> Add
        </button>
      </div>
      {err && <p className="text-sm font-medium text-danger">{err}</p>}

      {picked.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-semibold text-muted">Selected ({picked.length})</p>
          <div className="flex flex-wrap gap-2">
            {picked.map((c) => (
              <button key={c} type="button" onClick={() => toggle(c)} className="inline-flex items-center gap-1 rounded-full bg-primary-fill px-3 py-1.5 text-sm font-semibold text-on-primary">
                {c} <X className="size-3.5" aria-label={`Remove ${c}`} />
              </button>
            ))}
          </div>
        </div>
      )}

      {suggestions.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-semibold text-muted">Tap to add — courses of this programme</p>
          <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto">
            {suggestions.map((c) => {
              const done = already.includes(c), on = picked.includes(c);
              return (
                <button
                  key={c} type="button" disabled={done} onClick={() => toggle(c)}
                  className={clsx(
                    "rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors",
                    done ? "cursor-not-allowed border-border text-muted line-through opacity-60" : on ? "border-primary bg-primary-soft text-primary" : "border-border bg-surface hover:bg-surface-2",
                  )}
                  title={done ? "Already submitted for this term" : undefined}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
