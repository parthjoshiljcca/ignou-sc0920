# IGNOU Study Centre 0920 — Student App

**Design & Developed by: Parth D. Joshi**

Web app + installable mobile app (PWA) for onboarding students of IGNOU Study Centre 0920.

**Students** sign in the first time with their **enrolment number** and their **registered mobile number**
as the password (both taken from the centre's admission roster). They must then set their own password
before using the app. After that they can:
- raise queries as tickets and chat with the coordinator until resolved
- see the counselling schedule for their programme
- read notices, get in-app + push notifications
- browse searchable FAQs (based on IGNOU's official FAQ document) — matching FAQs are also suggested
  while they write a new query
- install the app to their phone's home screen

**Coordinator (admin)** can:
- answer queries, set status / priority (students are notified)
- add / edit / delete counselling classes (optionally notify affected students)
- publish notices to everyone or one programme, pin them, push-notify
- add / edit / hide FAQs (39 defaults from IGNOU's official FAQs; "Restore missing IGNOU FAQs" re-adds any deleted)
- upload the IGNOU admission export (.xlsx) to refresh the roster, track who has activated,
  reset a student's password (back to their mobile number), deactivate accounts

## Stack
Next.js 15 (App Router, server actions) · Tailwind CSS v4 · Neon Postgres + Drizzle ORM ·
JWT session cookie (jose) · Web Push (VAPID) · service worker with offline fallback.

## Setup

```bash
npm install
cp .env.example .env.local          # then fill in the values
npm run vapid                       # paste the two keys into .env.local
npm run db:push                     # create tables in Neon
npm run db:seed                     # coordinator account from ADMIN_* vars + default FAQs
npm run roster:import -- path/to/admission-export.xlsx   # or upload from Admin → Students
npm run dev
```

### Roster privacy
The admission export contains Aadhaar, bank, DOB, category and other personal data. The importer reads
**only** enrolment no., name, programme, year of admission, mobile, email and address; everything else
(including course codes) is discarded. `.xlsx/.csv` files are git-ignored — never commit them.

## Deploy (Vercel)
1. Import this repo in Vercel.
2. Add the env vars from `.env.example` (DATABASE_URL, AUTH_SECRET, VAPID keys, VAPID_SUBJECT).
3. Deploy. Push notifications require HTTPS, which Vercel provides.

On iPhone, push works only after the student adds the app to the Home Screen (iOS 16.4+).
