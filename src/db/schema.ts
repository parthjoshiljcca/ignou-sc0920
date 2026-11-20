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
    courses: text("courses").array().notNull().default([]),
    passwordHash: text("password_hash").notNull(),
    isActive: boolean("is_active").notNull().default(true),
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
    name: varchar("name", { length: 120 }).notNull(),
    programme: varchar("programme", { length: 40 }).notNull(),
    email: varchar("email", { length: 200 }),
    mobile: varchar("mobile", { length: 20 }),
    dob: date("dob").notNull(),
    courses: text("courses").array().notNull().default([]),
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

export type RosterEntry = typeof roster.$inferSelect;
export type User = typeof users.$inferSelect;
export type Ticket = typeof tickets.$inferSelect;
export type CounsellingSession = typeof counsellingSessions.$inferSelect;
export type Announcement = typeof announcements.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
