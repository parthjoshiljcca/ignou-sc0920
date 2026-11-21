/** Assignment progress steps (safe to import in client and server code). */
export const ASSIGNMENT_STATUSES = [
  { key: "received", label: "Received", detail: "Your assignment has been received at the study centre." },
  { key: "processed", label: "Processed", detail: "Checked in and sent for evaluation." },
  { key: "under_evaluation", label: "Under Evaluation", detail: "Your assignment is being evaluated by the counsellor." },
  { key: "evaluated", label: "Evaluated", detail: "Evaluation is complete." },
  { key: "award_list_generated", label: "Award List Generated", detail: "The award list has been prepared at the study centre." },
  { key: "sent_to_hq", label: "Sent To Headquarters", detail: "Sent to IGNOU. Marks will appear in your grade card on the IGNOU website once IGNOU updates it." },
] as const;

export type AssignmentStatus = (typeof ASSIGNMENT_STATUSES)[number]["key"];

export const statusIndex = (s: string) => ASSIGNMENT_STATUSES.findIndex((x) => x.key === s);
export const statusLabel = (s: string) => ASSIGNMENT_STATUSES.find((x) => x.key === s)?.label ?? s;
export const statusDetail = (s: string) => ASSIGNMENT_STATUSES.find((x) => x.key === s)?.detail ?? "";

/** The least-progressed status among several courses (what the student should see as "overall"). */
export function overallStatus(statuses: string[]) {
  return statuses.reduce((min, s) => (statusIndex(s) < statusIndex(min) ? s : min), statuses[0] ?? "received");
}
