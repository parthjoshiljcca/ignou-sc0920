/** Course-code helpers shared by the server and the browser. */

/** Families IGNOU writes with two digits (ECO-07, MCO-01, IBO-01, FEG-02 …); all others use three (BCS-011, MMPC-001). */
const TWO_DIGIT = new Set(["ECO", "FEG", "FST", "IBO", "MCO", "PCO", "FHD", "FED", "FFM"]);

/** "MMPC-001", "mmpc1", "MMPC 01" → "MMPC1" — the same key for every way of writing a code. */
export function courseKey(raw: string) {
  const m = raw.toUpperCase().replace(/\s+/g, "").match(/^([A-Z]{2,8})-?0*(\d{1,4})([A-Z]{0,2})$/);
  return m ? `${m[1]}${Number(m[2])}${m[3]}` : null;
}

export function knownCourseMap(codes: Iterable<string>) {
  const map = new Map<string, string>();
  for (const c of codes) {
    const k = courseKey(c);
    if (k && !map.has(k)) map.set(k, c);
  }
  return map;
}

/** Canonical IGNOU spelling: the known code if we have it, otherwise LETTERS-001 style. */
export function canonicalCourse(raw: string, known?: Map<string, string>) {
  const k = courseKey(raw);
  if (!k) return null;
  const hit = known?.get(k);
  if (hit) return hit;
  const [, fam, num, suf] = k.match(/^([A-Z]+)(\d+)([A-Z]*)$/)!;
  return `${fam}-${num.padStart(TWO_DIGIT.has(fam) ? 2 : 3, "0")}${suf}`;
}
