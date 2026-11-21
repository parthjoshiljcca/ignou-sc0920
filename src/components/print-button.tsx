"use client";

import { Printer } from "lucide-react";
import { btnClass } from "./ui";

export function PrintButton() {
  return (
    <button onClick={() => window.print()} className={btnClass("primary")}>
      <Printer className="size-4" aria-hidden /> Print / Save as PDF
    </button>
  );
}
