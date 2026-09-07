# Ravora Appointment Manager

A private, mobile-friendly schedule and payment tracker for Ravora studio staff.
It is built with Next.js, TypeScript, Tailwind CSS, and Supabase.

## How it works

1. Staff sign in with an email/password account created by the studio owner.
2. The dashboard opens on today's date in India and loads that day's bookings.
3. Staff move between dates or add, edit, and delete appointments.
4. Every appointment records the client, service, optional notes and phone,
   variable start/end time, booking amount, and pending amount.
5. Before saving, the server checks every existing booking on that date. If the
   time intersects another booking, it reports the exact overlap and requires
   an explicit **Book anyway** confirmation.
6. Supabase stores the data. Row-level security prevents anonymous access.

## Project structure

```text
src/
  actions/       Authenticated login and appointment mutations
  app/           Next.js routes, layouts, and global theme
  components/    Schedule, form, navigation, and brand UI
  lib/           Supabase clients, validation, overlap and format helpers
  types/         Appointment and generated-style database types
supabase/
  migrations/    Versioned database schema and security policies
tests/e2e/       Playwright staff workflow smoke test
public/images/   Ravora brand assets
```

## Local setup

Requirements: Node.js 22 or newer, npm, and a Supabase account.

1. Install dependencies with `npm install`.
2. Create a project at [supabase.com](https://supabase.com), then open its SQL
   Editor and run both migration files in order:
   - `supabase/migrations/20260907190000_create_appointments.sql`
   - `supabase/migrations/20260908133000_add_appointment_completed.sql`
   - `supabase/migrations/20260908140000_add_payment_modes.sql`
   - `supabase/migrations/20260908150000_remove_appointment_user_binding.sql`
3. In Supabase, open **Project settings → API**. Copy `.env.example` to
   `.env.local` and enter the project URL and publishable key:

   ```bash
   cp .env.example .env.local
   ```

4. In **Authentication → Providers → Email**:
   - Keep email/password enabled
   - Enable **Sign ups**
   - Turn **Confirm email** OFF so new staff can sign in immediately after signup
5. In **Authentication → URL Configuration**, set **Site URL** to
   `http://localhost:3000` and add `http://localhost:3000/**` as a redirect URL.
6. Run `npm run dev`, open [localhost:3000](http://localhost:3000), and sign in
   or sign up at `/signup`.

## Database and security

Amounts are stored as integer paise to avoid floating-point rounding errors.
Times are stored as UTC timestamps but entered and displayed in
`Asia/Kolkata`. The migration enforces non-negative amounts, same-day valid
time ranges, audit fields, and authenticated-only CRUD policies.

All staff share one studio schedule and have equal access to every
appointment, regardless of who created it.

## Commands

```bash
npm run dev          # local development
npm run lint         # ESLint
npm run typecheck    # TypeScript without output
npm test             # validation and overlap unit tests
npm run test:e2e     # Playwright smoke test
npm run build        # production build
```

The end-to-end test needs `E2E_STAFF_EMAIL` and `E2E_STAFF_PASSWORD` in
`.env.local`. It creates two appointments on the next day, including a
10-minute overlap, so use a dedicated test project.

## Deploy to Vercel

1. Push this repository to GitHub.
2. Import it at [vercel.com/new](https://vercel.com/new). Vercel detects
   Next.js automatically.
3. Add `NEXT_PUBLIC_SUPABASE_URL` and
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` as environment variables.
4. Deploy, then add the production URL under Supabase
   **Authentication → URL Configuration → Site URL**. Add preview URLs as
   redirect URLs if preview deployments will be used.
5. Verify login, booking creation, overlap confirmation, refresh persistence,
   editing, and deletion.

Netlify can also run the app with its Next.js adapter, but Vercel is the
recommended target for this App Router project.
