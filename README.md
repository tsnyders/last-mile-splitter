# Last Mile Splitter

Split last-mile rides from transit stations. Post a ride in one sentence, join in one tap.

> **Weekend Dev Challenge** — a PWA built with Next.js 16, Supabase, and Gemini AI.

---

## What it does

Commuters arriving at a train or bus station often need to cover the "last mile" to their workplace — usually by ride-hail, at full price, alone. **Last Mile Splitter** lets them:

1. **Post a ride** in natural language — *"Rosebank to Bedfordview at 08:15, need 2 seats"*
2. **Browse a live feed** of open rides updated in real time
3. **Join in one tap** (with confirmation) — seat counts update instantly for everyone
4. **Get notified** when someone joins your ride — in-app bell + native push notifications

An AI endpoint (Google Gemini) parses free-text input into structured ride data. If the AI is unavailable, a regex fallback handles common patterns. A mic button lets users voice-dictate instead of type.

The app is a **Progressive Web App** — installable to the home screen on both Android and iOS with no app store required.

## Features

- **AI-powered ride posting** — natural language → structured data via Gemini 1.5 Flash
- **Voice input** — Web Speech API dictation (en-ZA locale)
- **Real-time feed** — Supabase Realtime `postgres_changes` subscription
- **All Rides / My Rides tabs** — filter to your own rides
- **Join with confirmation** — two-tap join to prevent accidental joins
- **Cancel your ride** — creators can cancel with one tap
- **Creator name + relative time** — "Posted by Jane" and "in 45 min"
- **In-app notifications** — bell with unread badge, Realtime-powered
- **Native push notifications** — Web Push API via VAPID keys
- **PWA install prompt** — native on Android, manual instructions on iOS
- **Forgot password** — email-based password reset flow
- **Loading skeletons** — pulsing glass cards during data fetch
- **Toast system** — success/error/info toasts with auto-dismiss
- **Global error boundary** — graceful crash recovery
- **Glassmorphism UI** — frosted glass cards, gradient backgrounds, dark mode

## Tech stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com) + glassmorphism |
| Auth & DB | [Supabase](https://supabase.com) (Auth, Postgres, Realtime) |
| AI | [Vercel AI SDK](https://sdk.vercel.ai) + [Google Gemini](https://ai.google.dev) |
| Push | [web-push](https://github.com/web-push-libs/web-push) + VAPID |
| PWA | Web App Manifest + Service Worker |
| Voice | Web Speech API |
| Deploy | [Vercel](https://vercel.com) |

## Quick start

```bash
# 1. Clone
git clone https://github.com/your-username/last-mile-splitter.git
cd last-mile-splitter

# 2. Install
npm install

# 3. Environment
cp .env.local
# Fill in your keys (see docs/SETUP.md)

# 4. Database — run in the Supabase SQL Editor in order:
#   supabase/migrations/001_initial_schema.sql
#   supabase/migrations/002_ride_seats_trigger.sql
#   supabase/migrations/003_auto_create_profile.sql
#   supabase/migrations/004_notifications_and_auto_full.sql
#   supabase/migrations/005_push_subscriptions.sql

# 5. Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
last-mile-splitter/
├── app/
│   ├── layout.tsx                  # Root layout (PWA meta, ToastProvider, SW)
│   ├── page.tsx                    # Home — NavBar + CreateRideAI + RideFeed
│   ├── global-error.tsx            # Global error boundary
│   ├── globals.css                 # Tailwind + glassmorphism + animations
│   ├── (auth)/                     # Auth route group
│   │   ├── layout.tsx              # "Back to home" wrapper
│   │   ├── login/page.tsx          # Login + forgot password link
│   │   ├── signup/page.tsx         # Sign up + email confirmation
│   │   ├── forgot-password/page.tsx # Request password reset
│   │   └── reset-password/page.tsx  # Set new password
│   ├── api/
│   │   ├── api-parse/route.ts      # AI parse endpoint (Gemini)
│   │   └── push/
│   │       ├── subscribe/route.ts  # Save/delete push subscriptions
│   │       └── send/route.ts       # Send push via web-push
│   └── auth/callback/route.ts      # Email confirm + password reset callback
├── components/
│   ├── CreateRideAI.tsx            # NLP input + voice + Supabase insert
│   ├── NavBar.tsx                  # Auth-aware header + notification bell
│   ├── NotificationBell.tsx        # In-app notifications + push subscribe
│   ├── RideCards.tsx               # Ride card + skeleton loader
│   ├── RideFeed.tsx                # Live feed + tabs + join/leave/cancel
│   ├── ServiceWorker.tsx           # SW registration + PWA install prompt
│   └── Toast.tsx                   # Toast notification system (provider + hook)
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Browser Supabase client
│   │   ├── server.ts               # Server Supabase client (cookies)
│   │   ├── proxy.ts                # Session refresh for proxy.ts
│   │   └── database.types.ts       # TS types + rideToCardProps + relativeTime
│   ├── supabase.ts                 # Re-export of browser client
│   └── utils.ts                    # cn() class helper
├── supabase/migrations/            # 5 SQL migrations (run in order)
├── public/
│   ├── manifest.json               # PWA manifest
│   ├── sw.js                       # Service worker (cache + push)
│   └── icons/                      # App icons (SVG)
├── types/
│   ├── speech.d.ts                 # Web Speech API declarations
│   └── web-push.d.ts              # web-push module declaration
├── proxy.ts                        # Next.js 16 proxy (session refresh)
└── docs/                           # Documentation
    ├── ARCHITECTURE.md
    ├── SETUP.md
    └── DATABASE.md
```

## Documentation

- **[docs/SETUP.md](docs/SETUP.md)** — Environment variables, Supabase config, VAPID keys
- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** — How every piece fits together
- **[docs/DATABASE.md](docs/DATABASE.md)** — Schema, RLS policies, triggers, Realtime

## Environment variables

| Variable | Public? | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous/publishable key |
| `GOOGLE_GENERATIVE_AI_API_KEY` | No | Google Gemini API key |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Yes | VAPID public key for push notifications |
| `VAPID_PRIVATE_KEY` | No | VAPID private key (server-side only) |
