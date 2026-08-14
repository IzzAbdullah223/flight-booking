# Flight Booking — Jadwelny Take-Home

Full-stack flight booking app: Node/Express/Prisma/PostgreSQL backend + Next.js frontend, with Stripe for payments.

## Tech Stack

- **Backend:** Node.js, Express, TypeScript, PostgreSQL
- **ORM:** Prisma, using the driver-adapter approach (`@prisma/adapter-pg`) with the `prisma-client` generator
- **Auth:** Passport (local strategy) + JWT access tokens (15m) with DB-backed refresh token rotation
- **Payments:** Stripe (PaymentIntents + webhooks)
- **Frontend:** Next.js (App Router), TypeScript, Stripe Elements

## Setup

### Backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```
DATABASE_URL=postgresql://user:password@localhost:5432/flightbooking
SECRET_KEY=your-jwt-secret
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
PORT=3000
```

Run migrations and seed data:

```bash
npx prisma migrate deploy
npx tsx prisma/seed.ts
```

Build and start:

```bash
npm run build
npm start
```

Seeded accounts:
- Admin: `admin@jadwelny.test` / `AdminPass123`
- Customer: `user@jadwelny.test` / `UserPass123`

### Stripe Webhook (local dev)

Webhooks need a public URL to reach your local server. Using ngrok:

```bash
ngrok http 3000
```

Register `<ngrok-url>/payments/webhook` as a webhook destination in the Stripe Dashboard (test mode), listening for `payment_intent.succeeded` and `payment_intent.payment_failed`. Copy the destination's signing secret into `STRIPE_WEBHOOK_SECRET`.

### Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

```bash
npm run dev
```

## Architecture Notes

- **Seat concurrency** is handled at the DB level via a conditional `updateMany` (`WHERE availableSeats >= seatCount`) inside the same transaction as booking creation — no application-level locking. A losing request under contention gets a `409 SOLD_OUT` and the transaction rolls back before any `Booking` row is written.
- **Webhook idempotency:** both `payment_intent.succeeded` and `payment_intent.payment_failed` handlers check the current `Payment.status` before mutating, so duplicate webhook deliveries (which Stripe guarantees can happen) are safe no-ops.
- **IDOR protection:** all "own resource" endpoints (bookings, payment intents) scope the query by `userId` directly in the `WHERE` clause rather than fetching and checking ownership after the fact.
- **Cancellation policy:** a configurable cutoff (`CANCELLATION_CUTOFF_HOURS` in `config/policy.ts`, default 24h before departure) blocks self-service cancellation close to departure. Admins can force-cancel past this cutoff. Paid (`CONFIRMED`) bookings trigger a real Stripe refund on cancellation; unpaid (`PENDING`) bookings simply cancel with no refund.
- **Auth:** access tokens are short-lived (15m) JWTs; refresh tokens are opaque random strings stored server-side with rotation and revocation support, so logout and token theft can both invalidate sessions immediately.

## Trade-offs / What Was Cut Due to Time

Given the ~6 hour budget, the following were deprioritized per the task's own "cut if short on time" guidance:

- **Admin dashboard stats endpoint** — not built (explicitly optional in the spec).
- **Docker / docker-compose** — not built (preferred but not mandatory in the spec).
- **Booking confirmation email** — not built (explicitly optional in the spec).
- **Admin fare/inventory CRUD UI** — backend routes exist and are functional (tested via API), but no frontend UI was wired up for them due to time.
- **UI polish** — frontend is intentionally plain/functional (inline styles, no design system), per the spec's explicit note that UI polish is low priority.
- **Frontend test coverage** — not added; backend logic was manually verified end-to-end (auth, search, booking, payment, webhook confirmation, cancellation/refund) rather than covered with automated tests, given the time constraint.

## What Works (Manually Verified End-to-End)

- Register / login / silent token refresh
- Flight search with filters + pagination
- Booking creation with seat concurrency handling
- Stripe payment via PaymentIntents + Stripe Elements
- Webhook-driven booking confirmation (`PENDING` → `CONFIRMED`)
- Booking cancellation with 24h cutoff enforcement and Stripe refunds for paid bookings
- Own-booking history view

## Known Limitation

During manual testing, a small number of Stripe test-mode PaymentIntents were left in an inconsistent state due to repeated manual webhook resends via the Stripe Dashboard while debugging local tunnel setup. This is an artifact of manual testing, not application logic — the webhook handlers themselves only mutate state based on the specific `bookingId` in each event's metadata and are idempotent against duplicate deliveries.