# Architecture

How every piece of Last Mile Splitter fits together.

---

## High-level flow

```
┌─────────────┐      ┌──────────────┐      ┌───────────────┐
│   Browser    │─────▶│  Next.js 16  │─────▶│   Supabase    │
│   (PWA)      │◀─────│  App Router  │◀─────│  (Postgres +  │
│              │      │              │      │   Realtime)   │
└──────┬──────┘      └──────┬───────┘      └───────────────┘
       │                     │
       │ Push           ┌────▼─────┐
       │ Notification   │ Gemini AI│
       ◀────────────────│ web-push │
                        └──────────┘
```

## Frontend (Next.js 16 PWA)

The app uses the **App Router** with a mix of server and client components.

### Pages

| Route | Type | Purpose |
|---|---|---|
| `/` | Server → Client | Home: NavBar + CreateRideAI + RideFeed (tabs) |
| `/signup` | Client | Sign up → email confirmation → check-email screen |
| `/login` | Client | Email/password login + forgot password link |
| `/forgot-password` | Client | Request password reset email |
| `/reset-password` | Client | Set new password (after clicking email link) |

### Key components

| Component | Purpose |
|---|---|
| **`NavBar`** | Auth-aware header. Shows login/signup when signed out, notification bell + user dropdown when signed in. |
| **`CreateRideAI`** | NLP input. Sends text to `/api/api-parse` (Gemini), falls back to regex. Voice dictation via Web Speech API. Ensures profile exists, then inserts ride. Uses toast for feedback. |
| **`RideFeed`** | Fetches open rides with creator names (left join on profiles). Realtime subscription. "All Rides" / "My Rides" tabs. Handles join (two-tap confirm), leave, and cancel. Loading skeletons. 2-hour grace period on expired rides. |
| **`RideCard`** | Displays time, relative time ("in 45 min"), destination, origin, creator name, seat count with avatars. Join confirmation, leave button, cancel button (creator only). Skeleton variant for loading. |
| **`NotificationBell`** | Bell icon with unread badge. Dropdown with notification list and time-ago. Realtime subscription on `notifications` table. "Enable push" button to subscribe to Web Push. Triggers push send on new Realtime INSERT. |
| **`Toast`** | Global toast system via React context. Success/error/info types, auto-dismiss after 4s. |
| **`ServiceWorker`** | Registers `/sw.js`. `InstallPrompt` shows native install on Android or manual instructions on iOS, dismissible for 24h. |

### Error handling

- **`global-error.tsx`** — Catches unhandled errors anywhere in the app. Shows a styled error page with "Try again" button. Uses inline styles (no Tailwind) since the root layout may have crashed.
- **Toast system** — All user-facing errors in components go through `useToast()` for consistent feedback.
- **Fallback query** — If the profile join fails in `fetchRides`, it retries without the join so rides still appear.

## Backend

### Auth flow

```
Signup
  → signUp({ email, password, options: { emailRedirectTo: /auth/callback } })
  → "Check your email" screen
  → User clicks link → /auth/callback?code=...
  → exchangeCodeForSession(code)
  → upsert profiles row
  → redirect to /

Forgot password
  → resetPasswordForEmail(email, { redirectTo: /reset-password })
  → "Check your email" screen
  → User clicks link → /auth/callback?code=...&next=/reset-password
  → exchangeCodeForSession(code)
  → redirect to /reset-password
  → updateUser({ password })
  → redirect to /
```

The **proxy** (`proxy.ts`) runs on every request:
- Refreshes expired JWT tokens via `supabase.auth.getUser()`
- Syncs cookies between request and response
- Catches auth error params on `/` and redirects to `/login?error=...`

### API routes

| Route | Method | Purpose |
|---|---|---|
| `/api/api-parse` | POST | AI parse: Gemini `generateObject()` with Zod schema → structured ride JSON |
| `/api/push/subscribe` | POST | Save browser push subscription to DB |
| `/api/push/subscribe` | DELETE | Remove a push subscription |
| `/api/push/send` | POST | Look up user's push subscriptions, send via `web-push`, auto-clean expired |

### AI parse endpoint

- Model: `gemini-1.5-flash` (Google Generative AI via Vercel AI SDK)
- Schema extracts: `origin`, `destination`, `departure_time` (HH:mm), `total_seats`
- System prompt handles implicit seat counts ("looking for 2 people" = 3 total)
- Falls back to regex in the client if the API fails

### Realtime

Supabase Realtime is enabled for two tables:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.rides;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
```

- **`RideFeed`** subscribes to `rides` changes → refetches ride list
- **`NotificationBell`** subscribes to `notifications` INSERT → refetches + triggers push send

### Push notifications

```
Someone joins ride
  → DB trigger creates notification row
  → Supabase Realtime fires INSERT
  → NotificationBell receives it
    → Updates bell badge (in-app)
    → POSTs to /api/push/send
  → Server looks up push_subscriptions for the creator
  → web-push sends native push
  → Service worker shows OS notification
```

## PWA

- **Manifest** — `display: standalone`, dark theme, SVG icons
- **Service Worker** — Network-first caching, precaches `/`, `/login`, `/signup`. Handles `push` events (shows native notification) and `notificationclick` (focuses/opens app).
- **Install prompt** — `beforeinstallprompt` on Android/Chrome, manual Share instructions on iOS. Dismissible for 24h via localStorage.

## Session management

- **Browser client** — `createBrowserClient` from `@supabase/ssr`. Used for Realtime, auth, client-side queries.
- **Server client** — `createServerClient` with `await cookies()`. Used in Server Components and Route Handlers.
- **Proxy client** — Reads from `request.cookies`, writes to both `request.cookies` and `response.cookies`.
