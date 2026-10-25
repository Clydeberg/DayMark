# Daymark Calendar

A focused private calendar for managing tasks, events, meetings, and deadlines. Users can switch between Month, Week, Day, and Agenda views, filter visible items by type, and drag their items to reschedule them.

## Features

- Month, Week, Day, and Agenda views
- Date click with two actions: create a new item or view that date's schedule
- Account registration and credential sign-in
- Create/edit form with title, description, type, status, priority, fixed self-assignment, and dates
- Item details, deletion, drag-and-drop, and resize rescheduling
- Type filter
- Visible-range-only database queries
- UTC timestamp storage and local-time display
- Credential authentication with hashed passwords
- Server-side validation and authorization
- Responsive desktop and mobile layout

## Technology

- Next.js, React, TypeScript, and Tailwind CSS
- FullCalendar and React Hook Form
- Auth.js / NextAuth and Zod
- Prisma and PostgreSQL

No separate backend, global state library, component framework, or real-time service is used.

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

   Prisma is installed locally with the project. A global installation is not required.

2. Copy `.env.example` to `.env` and provide:

   ```env
   DATABASE_URL="postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="replace-with-a-long-random-string"
   ```

   The URL can come from Neon, Supabase Postgres, Prisma Postgres, or local PostgreSQL. Use one provider.

3. Create the database tables:

   ```bash
   npm run db:migrate -- --name init
   ```

4. Add the demo users:

   ```bash
   npm run db:seed
   ```

5. Start the app:

   ```bash
   npm run dev
   ```

Open `http://localhost:3000`. The seeded demo login is `demo@example.com` / `Demo123!`. Change or remove this account outside a demonstration.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start local development |
| `npm run build` | Create and type-check a production build |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Regenerate Prisma Client |
| `npm run db:migrate -- --name <name>` | Create/apply a migration |
| `npm run db:deploy` | Apply committed migrations in production |
| `npm run db:seed` | Create demo users |

## Main folders

```text
app/
  api/auth/             Auth.js handler
  api/register/         Account registration endpoint
  api/items/            Range query and CRUD endpoints
  calendar/             Protected calendar page
  login/                Login page
  register/             Account registration page
components/
  auth/                 Login and registration forms
  calendar/             Calendar and date interactions
  items/                Shared create/edit form
  ui/                   Small reusable modal
lib/
  auth.ts               Authentication configuration
  db.ts                 Lazy Prisma client
  dates.ts              UTC/local date helpers
  session.ts            Current-user helper
  validations/          Zod request schemas
prisma/
  schema.prisma         PostgreSQL models
  seed.ts               Demo users
types/                  Shared application types
```

## API and authorization

`GET /api/items` requires ISO `start` and `end` values. FullCalendar supplies its current visible range, so the API does not fetch a user's complete history.

```text
GET    /api/items?start=<UTC>&end=<UTC>&type=<optional>
POST   /api/items
GET    /api/items/:id
PATCH  /api/items/:id
DELETE /api/items/:id
POST   /api/register
```

The server gets both the owner and assignee from the authenticated session; it never trusts either identity from the browser. A user can only list, view, edit, reschedule, and delete items they own. Matching display names do not grant access because authorization uses the authenticated user ID.

## Time handling

The browser form converts local time to UTC ISO strings. PostgreSQL stores item and audit dates as `timestamptz`. Returned UTC values are displayed in the viewer's local time zone.

## Deployment

1. Push this directory to a public GitHub repository.
2. Import it into Vercel.
3. Add `DATABASE_URL`, `NEXTAUTH_URL`, and `NEXTAUTH_SECRET` in Vercel.
4. Set `NEXTAUTH_URL` to the deployed HTTPS URL.
5. Run `npm run db:deploy` against the hosted database.
6. Deploy. `postinstall` generates Prisma Client automatically.

## Deliberate limitations

Recurring events, notifications, time tracking, epics, milestones, and real-time collaboration are intentionally outside this small project's scope.
