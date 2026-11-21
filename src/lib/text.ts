/** Identity/record fields are stored in CAPITALS (the database also enforces this with triggers). */
export const upper = (v: string | null | undefined) => {
  const s = (v ?? "").trim().replace(/\s+/g, " ");
  return s ? s.toUpperCase() : null;
};

/** Placeholder name given to a student imported without a name, until they enter it on first sign-in. */
export const placeholderName = (enrollmentNo: string) => `STUDENT ${enrollmentNo}`;
export const isPlaceholderName = (name: string | null | undefined) => !!name && /^student \d{9,10}$/i.test(name.trim());
