# Architecture

How the pieces of Last Mile Splitter fit together.

---

## High-level flow

```
┌─────────────┐      ┌──────────────┐      ┌───────────────┐
│   Browser    │─────▶│  Next.js 16  │─────▶│   Supabase    │
│   (PWA)      │◀─────│  App Router  │◀─────│  (Postgres +  │
│              │      │              │      │   Realtime)   │
└─────────────┘      └──────┬───────┘      └───────────────┘
                            │
                     ┌──────▼───────┐
                     │  Gemini AI   │
                     │  (API route) │
                     └──────────────┘
```

## Frontend (Next.js 16 PWA)

The app uses the **App Router** with a mix of server and client components.

### Pages

| Route | Type | Purpose |
|---|---|---|
| `/` | Server → Client | Home page: NavBar + CreateRideAI + RideFeed |
| `/signup` | Client | Email/password registration → email confirmation |
| `/login` | Client | Email/password sign-in |

### Key components

- **`NavBar`** — Reads auth state via `onAuthStateChange`. Shows login/signup links or a user dropdown with sign-out.
- **`CreateRideAI`** — The core AI feature. Sends user text to `/api/api-parse` (Gemini), falls back to regex. Supports voice input via the Web Speech API. Ensures the user has a `profiles` row, then inserts into `rides`.
- **`RideFeed`** — Fetches open rides ordered by departure time. Subscribes to Supabase Realtime `postgres_changes` on the `rides` table for instant updates. Manages join/leave state per user.
- **`RideCard`** — Presentational card with join/leave buttons. Receives callbacks from RideFeed for Supabase-backed actions.
- **`ServiceWorker`** — Registers the SW and renders the PWA install prompt (Android native / iOS manual instructions).

## Backend

### Auth flow

```
Signup → Supabase sends confirmation email
       → User clicks link → /auth/callback
       → exchangeCodeForSession(code)
       → upsert profiles row
       → redirect to /
```

The **proxy** (`proxy.ts` at the project root) runs on every request. It calls `supabase.auth.getUser()` to refresh expired JWT tokens and sync cookies between the request and response.

Auth errors (e.g. expired OTP links) that land on `/` are caught by the proxy and redirected to `/login?error=...`.

### AI parse endpoint

`POST /api/api-parse`

- Receives `{ prompt: string }`
- Uses Vercel AI SDK's `generateObject()` with a Zod schema
- Model: `gemini-2.5-flash` (Google Generative AI)
- Extracts: `origin`, `destination`, `departure_time` (HH:mm), `total_seats`
- Returns structured JSON with an ISO departure time

The system prompt instructs the model to interpret natural ride-share language, handle implicit seat counts ("looking for 2 people" = 3 total), and default missing values.

### Realtime

Supabase Realtime is enabled for the `rides` table via:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.rides;
```

`RideFeed` subscribes to `postgres_changes` with `event: '*'` and refetches the ride list on any change. This means when anyone posts, joins, or leaves a ride, all connected clients see the update instantly.

## PWA

- **Manifest** (`public/manifest.json`) — `display: standalone`, theme color, icons
- **Service Worker** (`public/sw.js`) — Network-first with cache fallback. Precaches `/`, `/login`, `/signup`. Only caches `http(s)` GET requests with `200` status.
- **Install prompt** — Intercepts `beforeinstallprompt` on Android/Chrome. Shows manual Share → Add to Home Screen instructions on iOS. Dismissible for 24 hours.

## Session management

```
Browser ←→ proxy.ts ←→ Supabase Auth (cookies)
```

- **Browser client** (`lib/supabase/client.ts`) — `createBrowserClient` from `@supabase/ssr`. Used for Realtime, auth state, and client-side queries.
- **Server client** (`lib/supabase/server.ts`) — `createServerClient` with `await cookies()`. Used in Server Components, Route Handlers, and Server Actions.
- **Proxy client** (`lib/supabase/proxy.ts`) — Special client that reads from `request.cookies` and writes to both `request.cookies` (for downstream Server Components) and `response.cookies` (for the browser).
