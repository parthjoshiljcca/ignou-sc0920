import { Fragment } from "react";

const URL_RE = /(https?:\/\/[^\s)]+|www\.[^\s)]+\.[a-z]{2,}[^\s)]*|[\w.+-]+@[\w-]+\.[\w.]+)/gi;

/** Render text with URLs and email addresses as links. */
export function Linkify({ text }: { text: string }) {
  const parts = text.split(URL_RE);
  return (
    <>
      {parts.map((p, i) => {
        if (i % 2 === 0) return <Fragment key={i}>{p}</Fragment>;
        const clean = p.replace(/[.,;:]+$/, "");
        const trail = p.slice(clean.length);
        const href = clean.includes("@") && !clean.startsWith("http") ? `mailto:${clean}` : clean.startsWith("http") ? clean : `https://${clean}`;
        return (
          <Fragment key={i}>
            <a href={href} target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline-offset-2 hover:underline break-all">
              {clean}
            </a>
            {trail}
          </Fragment>
        );
      })}
    </>
  );
}
