const TZ = "Asia/Kolkata";

export function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-IN", { timeZone: TZ, day: "numeric", month: "short", year: "numeric" });
}

export function fmtDay(d: Date | string) {
  return new Date(d).toLocaleDateString("en-IN", { timeZone: TZ, weekday: "short", day: "numeric", month: "short" });
}

export function fmtTime(d: Date | string) {
  return new Date(d).toLocaleTimeString("en-IN", { timeZone: TZ, hour: "numeric", minute: "2-digit" });
}

export function fmtDateTime(d: Date | string) {
  return `${fmtDate(d)}, ${fmtTime(d)}`;
}

export function timeAgo(d: Date | string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
  return fmtDate(d);
}

/** Convert an <input type="datetime-local"> value (entered in IST) to a Date. */
export function istInputToDate(v: string) {
  return new Date(`${v}:00+05:30`);
}

/** Convert a Date to an IST value suitable for <input type="datetime-local">. */
export function dateToIstInput(d: Date | string) {
  const shifted = new Date(new Date(d).getTime() + 5.5 * 3600 * 1000);
  return shifted.toISOString().slice(0, 16);
}

/** Start of today in IST, as a UTC Date. */
export function istStartOfToday() {
  const now = new Date(Date.now() + 5.5 * 3600 * 1000);
  const ymd = now.toISOString().slice(0, 10);
  return new Date(`${ymd}T00:00:00+05:30`);
}

/** "PATEL VRUSHTI NATVARBHAI" → "Patel Vrushti Natvarbhai" */
export function properName(name: string) {
  return name.toLowerCase().replace(/(^|[\s.'-])([a-z])/g, (_, p, c) => p + c.toUpperCase());
}
