"use client";

import { useId, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { Plus, X } from "lucide-react";
import { canonicalCourse, courseKey, knownCourseMap } from "@/lib/course-codes";

const words = (s: string) => s.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
const shortTerm = (t?: string) => (t ? t.replace(/^Semester\s*/i, "Sem ").replace(/^Year\s*/i, "Year ") : "");

/**
 * Pick course codes. Type a code or words from a course title to get live suggestions
 * (↑/↓ + Enter, or tap), or tap a chip grouped by semester. "mmpc1" becomes "MMPC-001".
 * Submits as a hidden "courses" field.
 */
export function CoursePicker({ suggestions, allCodes = [], titles = {}, terms = {}, already = [], name = "courses" }: {
  suggestions: string[]; allCodes?: string[]; titles?: Record<string, string>; terms?: Record<string, string>;
  already?: string[]; name?: string;
}) {
  const [picked, setPicked] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [err, setErr] = useState("");
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  // The student's programme first, then every other known course.
  const pool = useMemo(() => [...new Set([...suggestions, ...allCodes])], [suggestions, allCodes]);
  const known = useMemo(() => knownCourseMap(pool), [pool]);
  const own = useMemo(() => new Set(suggestions), [suggestions]);

  const matches = useMemo(() => {
    const raw = text.trim();
    if (!raw) return [];
    const q = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
    const qk = courseKey(raw);
    const qw = words(raw);
    const exact: string[] = [], starts: string[] = [], inCode: string[] = [], inTitle: string[] = [], done: string[] = [];
    for (const c of pool) {
      if (picked.includes(c)) continue;
      const flat = c.replace(/[^A-Z0-9]/g, "");
      const t = titles[c]?.toLowerCase() ?? "";
      let bucket: string[] | null = null;
      if (qk && courseKey(c) === qk) bucket = exact;
      else if (flat.startsWith(q)) bucket = starts;
      else if (q.length >= 2 && flat.includes(q)) bucket = inCode;
      else if (raw.length >= 3 && t && qw.every((w) => t.includes(w))) bucket = inTitle;
      if (!bucket) continue;
      (already.includes(c) ? done : bucket).push(c);
    }
    const byOwn = (a: string, b: string) => Number(own.has(b)) - Number(own.has(a));
    return [...exact, ...starts.sort(byOwn), ...inCode.sort(byOwn), ...inTitle.sort(byOwn), ...done].slice(0, 8);
  }, [text, pool, picked, already, titles, own]);
  const showList = open && matches.length > 0;

  const add = (raw: string) => {
    // "MCS 211" is one course; "MCS-211, MCS-212" or "MCS211 MCS212" are several.
    const parts = raw.split(/[,;]+/).map((p) => p.trim()).filter(Boolean)
      .flatMap((p) => (courseKey(p) ? [p] : p.split(/\s+/).filter(Boolean)));
    const next = [...picked];
    for (const p of parts) {
      const c = canonicalCourse(p, known);
      if (!c) { setErr(`“${p}” is not a course code — write like MCS-211, or type words from the course name`); return; }
      if (already.includes(c)) { setErr(`${c} is already submitted for this term`); return; }
      if (!next.includes(c)) next.push(c);
    }
    setErr(""); setPicked(next); setText(""); setHi(0);
  };
  const choose = (c: string) => {
    if (already.includes(c)) { setErr(`${c} is already submitted for this term`); return; }
    setPicked((p) => (p.includes(c) ? p : [...p, c]));
    setErr(""); setText(""); setHi(0); setOpen(false);
    inputRef.current?.focus();
  };
  const toggle = (c: string) => setPicked((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]));

  // Chips grouped by semester (programme courses), then "Other courses seen at the centre".
  const groups = useMemo(() => {
    const g = new Map<string, string[]>();
    for (const c of suggestions) {
      const k = terms[c] ?? "Other courses";
      (g.get(k) ?? g.set(k, []).get(k)!).push(c);
    }
    return [...g.entries()].sort(([a], [b]) => (a === "Other courses" ? 1 : b === "Other courses" ? -1 : a.localeCompare(b, undefined, { numeric: true })));
  }, [suggestions, terms]);

  return (
    <div className="space-y-3">
      <input type="hidden" name={name} value={picked.join(",")} />
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => { setText(e.target.value); setOpen(true); setHi(0); setErr(""); }}
            onFocus={(e) => {
              setOpen(true);
              const el = e.currentTarget;
              setTimeout(() => el.scrollIntoView({ block: "center", behavior: "smooth" }), 250);
            }}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown" && matches.length) { e.preventDefault(); setOpen(true); setHi((h) => (h + 1) % matches.length); }
              else if (e.key === "ArrowUp" && matches.length) { e.preventDefault(); setHi((h) => (h - 1 + matches.length) % matches.length); }
              else if (e.key === "Escape") setOpen(false);
              else if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                if (showList && matches[hi]) choose(matches[hi]);
                else if (text.trim()) add(text);
              }
            }}
            placeholder="Course code or name, e.g. MCS-211 or algorithms"
            className="input"
            aria-label="Course code"
            role="combobox"
            aria-expanded={showList}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={showList ? `${listId}-${hi}` : undefined}
            autoComplete="off"
            spellCheck={false}
          />
          {showList && (
            <ul id={listId} role="listbox" className="absolute top-full right-0 left-0 z-50 mt-1 max-h-72 overflow-y-auto rounded-xl border border-border bg-surface p-1 shadow-xl">
              {matches.map((c, i) => {
                const done = already.includes(c);
                return (
                  <li
                    key={c} id={`${listId}-${i}`} role="option" aria-selected={i === hi} aria-disabled={done}
                    onMouseDown={(e) => { e.preventDefault(); choose(c); }}
                    onMouseEnter={() => setHi(i)}
                    className={clsx("flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2", i === hi && "bg-primary-soft", done && "cursor-not-allowed opacity-50")}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">{c}</span>
                      {titles[c] && <span className="block truncate text-xs text-muted">{titles[c]}</span>}
                    </span>
                    <span className="shrink-0 text-[11px] font-medium text-muted">
                      {done ? "already submitted" : own.has(c) ? shortTerm(terms[c]) || "your programme" : ""}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <button
          type="button"
          onClick={() => { if (!text.trim()) return; if (showList && matches[hi]) choose(matches[hi]); else add(text); }}
          className="inline-flex shrink-0 items-center gap-1 rounded-[10px] border border-border bg-surface px-3 text-sm font-semibold hover:bg-surface-2"
        >
          <Plus className="size-4" aria-hidden /> Add
        </button>
      </div>
      {err && <p className="text-sm font-medium text-danger">{err}</p>}

      {picked.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-semibold text-muted">Selected ({picked.length})</p>
          <div className="flex flex-wrap gap-2">
            {picked.map((c) => (
              <button key={c} type="button" onClick={() => toggle(c)} title={titles[c]} className="inline-flex items-center gap-1 rounded-full bg-primary-fill px-3 py-1.5 text-sm font-semibold text-on-primary">
                {c} <X className="size-3.5" aria-label={`Remove ${c}`} />
              </button>
            ))}
          </div>
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="space-y-2.5">
          <p className="text-xs font-semibold text-muted">Or tap to add — courses of this programme</p>
          <div className="max-h-72 space-y-2.5 overflow-y-auto pr-1">
            {groups.map(([term, codes]) => (
              <div key={term}>
                <p className="mb-1 text-[11px] font-semibold tracking-wide text-muted uppercase">{term}</p>
                <div className="flex flex-wrap gap-2">
                  {codes.map((c) => {
                    const done = already.includes(c), on = picked.includes(c);
                    return (
                      <button
                        key={c} type="button" disabled={done} onClick={() => toggle(c)} title={titles[c] ?? (done ? "Already submitted for this term" : undefined)}
                        className={clsx(
                          "rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors",
                          done ? "cursor-not-allowed border-border text-muted line-through opacity-60" : on ? "border-primary bg-primary-soft text-primary" : "border-border bg-surface hover:bg-surface-2",
                        )}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
