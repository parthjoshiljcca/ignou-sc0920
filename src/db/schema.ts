import {
  pgTable,
  pgEnum,
  serial,
  integer,
  text,
  varchar,
  timestamp,
  boolean,
  index,
  uniqueIndex,
  date,
  real,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["student", "admin"]);
export const ticketStatusEnum = pgEnum("ticket_status", ["open", "in_progress", "resolved", "closed"]);
export const ticketPriorityEnum = pgEnum("ticket_priority", ["low", "normal", "high"]);
export const sessionModeEnum = pgEnum("session_mode", ["offline", "online"]);

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    role: roleEnum("role").notNull().default("student"),
    name: varchar("name", { length: 120 }).notNull(),
    email: varchar("email", { length: 200 }).notNull(),
    phone: varchar("phone", { length: 20 }),
    enrollmentNo: varchar("enrollment_no", { length: 20 }),
    programme: varchar("programme", { length: 40 }),
    passwordHash: text("password_hash").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    mustChangePassword: boolean("must_change_password").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("users_email_uq").on(t.email),
    uniqueIndex("users_enrollment_uq").on(t.enrollmentNo),
  ],
);

/** Official admission roster imported from the IGNOU admission export. Only onboarding fields are stored. */
export const roster = pgTable(
  "roster",
  {
    enrollmentNo: varchar("enrollment_no", { length: 20 }).primaryKey(),
    name: varchar("name", { length: 120 }), // re-registration exports carry no name; student fills it on first login
    programme: varchar("programme", { length: 40 }).notNull(),
    email: varchar("email", { length: 200 }),
    mobile: varchar("mobile", { length: 20 }),
    admissionYear: integer("admission_year"),
    address: text("address"),
    importedAt: timestamp("imported_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("roster_programme_idx").on(t.programme)],
);

export const tickets = pgTable(
  "tickets",
  {
    id: serial("id").primaryKey(),
    studentId: integer("student_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    category: varchar("category", { length: 40 }).notNull(),
    subject: varchar("subject", { length: 160 }).notNull(),
    status: ticketStatusEnum("status").notNull().default("open"),
    priority: ticketPriorityEnum("priority").notNull().default("normal"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("tickets_student_idx").on(t.studentId), index("tickets_status_idx").on(t.status)],
);

export const ticketMessages = pgTable(
  "ticket_messages",
  {
    id: serial("id").primaryKey(),
    ticketId: integer("ticket_id")
      .notNull()
      .references(() => tickets.id, { onDelete: "cascade" }),
    authorId: integer("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("ticket_messages_ticket_idx").on(t.ticketId)],
);

export const counsellingSessions = pgTable(
  "counselling_sessions",
  {
    id: serial("id").primaryKey(),
    programme: varchar("programme", { length: 40 }).notNull(),
    courseCode: varchar("course_code", { length: 20 }).notNull(),
    title: varchar("title", { length: 160 }),
    counsellor: varchar("counsellor", { length: 120 }),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    mode: sessionModeEnum("mode").notNull().default("offline"),
    venue: varchar("venue", { length: 200 }),
    meetingLink: text("meeting_link"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("sessions_starts_idx").on(t.startsAt)],
);

export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 160 }).notNull(),
  body: text("body").notNull(),
  link: text("link"),
  audience: varchar("audience", { length: 40 }).notNull().default("ALL"),
  pinned: boolean("pinned").notNull().default(false),
  authorId: integer("author_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const notifications = pgTable(
  "notifications",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 160 }).notNull(),
    body: text("body").notNull(),
    url: text("url"),
    isRead: boolean("is_read").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("notifications_user_idx").on(t.userId, t.isRead)],
);

export const faqs = pgTable(
  "faqs",
  {
    id: serial("id").primaryKey(),
    category: varchar("category", { length: 60 }).notNull(),
    question: text("question").notNull(),
    answer: text("answer").notNull(),
    link: text("link"),
    sortOrder: integer("sort_order").notNull().default(0),
    isPublished: boolean("is_published").notNull().default(true),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("faqs_category_idx").on(t.category, t.sortOrder)],
);

export const assignmentStatusEnum = pgEnum("assignment_status", [
  "received",
  "processed",
  "under_evaluation",
  "evaluated",
  "award_list_generated",
  "sent_to_hq",
]);

/**
 * One row per student per course per assignment session. Marks are deliberately NOT stored:
 * the import never reads the marks column.
 */
export const assignmentSubmissions = pgTable(
  "assignment_submissions",
  {
    id: serial("id").primaryKey(),
    session: varchar("session", { length: 60 }).notNull(),
    enrollmentNo: varchar("enrollment_no", { length: 20 }).notNull(),
    programme: varchar("programme", { length: 40 }),
    courseCode: varchar("course_code", { length: 20 }).notNull(),
    submittedOn: date("submitted_on").notNull(),
    status: assignmentStatusEnum("status").notNull().default("received"),
    statusUpdatedAt: timestamp("status_updated_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("asg_session_student_course_uq").on(t.session, t.enrollmentNo, t.courseCode),
    index("asg_enrollment_idx").on(t.enrollmentNo),
    index("asg_session_idx").on(t.session, t.status),
  ],
);

/** One acknowledgement receipt per student per assignment session. */
export const assignmentReceipts = pgTable(
  "assignment_receipts",
  {
    id: serial("id").primaryKey(),
    session: varchar("session", { length: 60 }).notNull(),
    enrollmentNo: varchar("enrollment_no", { length: 20 }).notNull(),
    receiptNo: varchar("receipt_no", { length: 40 }).notNull(),
    verifyCode: varchar("verify_code", { length: 24 }).notNull(),
    /** Name as written on the study centre's assignment sheet — used only when the student isn't on the student list. */
    studentName: varchar("student_name", { length: 120 }),
    /** Position of the student in the uploaded sheet, so the Excel export keeps the centre's order. */
    fileOrder: integer("file_order"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("asg_receipt_session_student_uq").on(t.session, t.enrollmentNo),
    uniqueIndex("asg_receipt_no_uq").on(t.receiptNo),
    uniqueIndex("asg_receipt_verify_uq").on(t.verifyCode),
  ],
);

/** Assignment terms (Term-End Exams). Only "June YYYY" / "December YYYY". */
export const assignmentTerms = pgTable(
  "assignment_terms",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 40 }).notNull(),
    sortKey: integer("sort_key").notNull(), // year * 100 + month, for ordering
    accepting: boolean("accepting").notNull().default(true), // open for new submissions
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("assignment_terms_name_uq").on(t.name)],
);

export const submissionRequestStatusEnum = pgEnum("submission_request_status", ["pending", "approved", "rejected", "cancelled"]);

/** A student's own submission from the app, entered with the coordinator's PIN, awaiting approval. */
export const assignmentRequests = pgTable(
  "assignment_requests",
  {
    id: serial("id").primaryKey(),
    term: varchar("term", { length: 40 }).notNull(),
    enrollmentNo: varchar("enrollment_no", { length: 20 }).notNull(),
    userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
    courses: text("courses").array().notNull(),
    submittedOn: date("submitted_on").notNull(),
    status: submissionRequestStatusEnum("status").notNull().default("pending"),
    note: text("note"),
    decidedBy: integer("decided_by").references(() => users.id, { onDelete: "set null" }),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("asg_req_status_idx").on(t.status, t.createdAt), index("asg_req_enrol_idx").on(t.enrollmentNo)],
);

/** Small key/value settings managed by the coordinator (e.g. submission switch and PIN). */
export const appSettings = pgTable("app_settings", {
  key: varchar("key", { length: 60 }).primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Wrong submission-PIN attempts, to slow down guessing. */
export const pinFailures = pgTable(
  "pin_failures",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("pin_failures_user_idx").on(t.userId, t.at)],
);

/** Courses of each programme (from IGNOU programme pages and the centre's own files) — used for suggestions. */
export const programmeCourses = pgTable(
  "programme_courses",
  {
    id: serial("id").primaryKey(),
    programme: varchar("programme", { length: 40 }).notNull(),
    courseCode: varchar("course_code", { length: 20 }).notNull(),
    title: text("title"),
    credits: real("credits"),
    term: varchar("term", { length: 20 }),
    source: varchar("source", { length: 30 }).notNull(),
  },
  (t) => [uniqueIndex("programme_courses_uq").on(t.programme, t.courseCode), index("programme_courses_code_idx").on(t.courseCode)],
);

export const pushSubscriptions = pgTable(
  "push_subscriptions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    endpoint: text("endpoint").notNull(),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("push_endpoint_uq").on(t.endpoint)],
);

export type AssignmentSubmission = typeof assignmentSubmissions.$inferSelect;
export type AssignmentReceipt = typeof assignmentReceipts.$inferSelect;
export type AssignmentTerm = typeof assignmentTerms.$inferSelect;
export type AssignmentRequest = typeof assignmentRequests.$inferSelect;
export type Faq = typeof faqs.$inferSelect;
export type RosterEntry = typeof roster.$inferSelect;
export type User = typeof users.$inferSelect;
export type Ticket = typeof tickets.$inferSelect;
export type CounsellingSession = typeof counsellingSessions.$inferSelect;
export type Announcement = typeof announcements.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
