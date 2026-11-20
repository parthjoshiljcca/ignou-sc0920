"use client";

import { ErrorScreen } from "@/components/error-screen";

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#f6f7fb" }}>
        <ErrorScreen error={error} kind="global" />
      </body>
    </html>
  );
}
