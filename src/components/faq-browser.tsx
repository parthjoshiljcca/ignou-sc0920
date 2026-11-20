"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { ChevronDown, ExternalLink, Search } from "lucide-react";
import { Linkify } from "./linkify";

export type FaqItem = { id: number; category: string; question: string; answer: string; link: string | null };

export function FaqBrowser({ faqs, categories }: { faqs: FaqItem[]; categories: string[] }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null);

  const list = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    return faqs.filter(
      (f) =>
        (!cat || f.category === cat) &&
        words.every((w) => `${f.question} ${f.answer} ${f.category}`.toLowerCase().includes(w)),
    );
  }, [faqs, q, cat]);

  const grouped = useMemo(() => {
    const m = new Map<string, FaqItem[]>();
    for (const f of list) m.set(f.category, [...(m.get(f.category) ?? []), f]);
    return [...m].sort((a, b) => categories.indexOf(a[0]) - categories.indexOf(b[0]));
  }, [list, categories]);

  return (
    <div>
      <div className="relative mb-3">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" aria-hidden />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search e.g. hall ticket, re-registration, refund"
          className="input pl-9"
          aria-label="Search FAQs"
        />
      </div>
      <div className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1">
        {[null, ...categories].map((c) => (
          <button
            key={c ?? "all"}
            onClick={() => setCat(c)}
            aria-pressed={cat === c}
            className={clsx(
              "shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors",
              cat === c ? "border-primary bg-primary text-on-primary" : "border-border bg-surface text-muted hover:text-text",
            )}
          >
            {c ?? "All"}
          </button>
        ))}
      </div>

      {grouped.length === 0 ? (
        <p className="rounded-2xl border border-border bg-surface p-5 text-sm text-muted">
          No matching questions. Try other words, or raise a query and the coordinator will help.
        </p>
      ) : (
        <div className="space-y-6">
          {grouped.map(([category, items]) => (
            <section key={category}>
              <h2 className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">{category}</h2>
              <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
                {items.map((f) => (
                  <details key={f.id} className="group" open={q.length > 2 && list.length <= 3}>
                    <summary className="flex cursor-pointer list-none items-start gap-3 px-4 py-3.5 font-semibold hover:bg-surface-2 [&::-webkit-details-marker]:hidden">
                      <span className="flex-1">{f.question}</span>
                      <ChevronDown className="mt-0.5 size-5 shrink-0 text-muted transition-transform group-open:rotate-180" aria-hidden />
                    </summary>
                    <div className="px-4 pb-4 text-[15px] leading-relaxed text-muted">
                      <p className="prose-msg"><Linkify text={f.answer} /></p>
                      {f.link && !f.answer.includes(f.link) && (
                        <a href={f.link} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
                          Open official page <ExternalLink className="size-4" aria-hidden />
                        </a>
                      )}
                    </div>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
