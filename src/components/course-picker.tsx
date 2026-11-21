"use client";

import { useId, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { Plus, X } from "lucide-react";

const norm = (raw: string) => {
  const s = raw.trim().toUpperCase().replace(/\s+/g, "");
  const m = s.match(/^([A-Z]{2,8})-?(\d{1,4}[A-Z]{0,2})$/);
  return m ? `${m[1]}-${m[2]}` : null;
};

const key = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, "");

/**
 * Pick course codes: type to get live suggestions (↑/↓ + Enter, or tap), tap a chip, or type a code
 * (MCS211 → MCS-211). Submits as a hidden "courses" field.
 */
export function CoursePicker({ suggestions, allCodes = [], already = [], name = "courses" }: {
  suggestions: string[]; allCodes?: string[]; already?: string[]; name?: string;
}) {
  const [picked, setPicked] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [err, setErr] = useState("");
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  // Programme's courses first, then every other known course.
  const pool = useMemo(() => [...new Set([...suggestions, ...allCodes])], [suggestions, allCodes]);
  const matches = useMemo(() => {
    const q = key(text);
    if (!q) return [];
    const starts: string[] = [], contains: string[] = [], done: string[] = [];
    for (const c of pool) {
      if (picked.includes(c)) continue;
      const k = key(c);
      if (!k.includes(q)) continue;
      if (already.includes(c)) done.push(c); // shown last, greyed out
      else if (k.startsWith(q)) starts.push(c);
      else contains.push(c);
    }
    return [...starts, ...contains, ...done].slice(0, 8);
  }, [text, pool, picked, already]);
  const showList = open && matches.length > 0;

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
    setErr(""); setPicked(next); setText(""); setHi(0);
  };
  const choose = (c: string) => {
    if (already.includes(c)) { setErr(`${c} is already submitted for this term`); return; }
    setPicked((p) => (p.includes(c) ? p : [...p, c]));
    setErr(""); setText(""); setHi(0); setOpen(false);
    inputRef.current?.focus();
  };
  const toggle = (c: string) => setPicked((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]));

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
              // Bring the box up so the suggestion list has room above the on-screen keyboard and bottom menu.
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
            placeholder="Type a course code, e.g. MCS-211"
            className="input uppercase"
            aria-label="Course code"
            role="combobox"
            aria-expanded={showList}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={showList ? `${listId}-${hi}` : undefined}
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
          />
          {showList && (
            <ul id={listId} role="listbox" className="absolute top-full right-0 left-0 z-50 mt-1 max-h-64 overflow-y-auto rounded-xl border border-border bg-surface p-1 shadow-xl">
              {matches.map((c, i) => {
                const done = already.includes(c);
                const ownProg = suggestions.includes(c);
                return (
                  <li
                    key={c} id={`${listId}-${i}`} role="option" aria-selected={i === hi} aria-disabled={done}
                    onMouseDown={(e) => { e.preventDefault(); choose(c); }}
                    onMouseEnter={() => setHi(i)}
                    className={clsx(
                      "flex cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm",
                      i === hi && "bg-primary-soft",
                      done && "cursor-not-allowed opacity-50",
                    )}
                  >
                    <span className="font-semibold">{c}</span>
                    <span className="text-xs text-muted">{done ? "already submitted" : ownProg ? "your programme" : ""}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <button type="button" onClick={() => text.trim() && (matches[0] && key(matches[0]) === key(text) ? choose(matches[0]) : add(text))} className="inline-flex shrink-0 items-center gap-1 rounded-[10px] border border-border bg-surface px-3 text-sm font-semibold hover:bg-surface-2">
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
