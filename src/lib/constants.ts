export const CENTRE = {
  code: "0920",
  name: "IGNOU Study Centre 0920",
  shortName: "SC 0920",
};

export const TICKET_CATEGORIES = [
  "Admission / Re-registration",
  "Assignments",
  "Study Material",
  "Exam Form / Hall Ticket",
  "Result / Grade Card",
  "Counselling Classes",
  "Practicals / Lab",
  "Fee / Refund",
  "Degree / Certificate",
  "ID Card",
  "Other",
] as const;

export const STATUS_LABEL: Record<string, string> = {
  open: "Open",
  in_progress: "In progress",
  resolved: "Resolved",
  closed: "Closed",
};

export const PRIORITY_LABEL: Record<string, string> = { low: "Low", normal: "Normal", high: "High" };
