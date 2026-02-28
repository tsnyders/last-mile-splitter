# Last Mile Splitter

Split last-mile rides from transit stations. Post a ride in one sentence, join in one tap.

> **Weekend Dev Challenge** — a PWA built with Next.js 16, Supabase, and Gemini AI.

---

## What it does

Commuters arriving at a train or bus station often need to cover the "last mile" to their workplace — usually by ride-hail, at full price, alone. **Last Mile Splitter** lets them:

1. **Post a ride** in natural language — *"Rosebank to Bedfordview at 08:15, need 2 seats"*
2. **Browse a live feed** of open rides updated in real time
3. **Join in one tap** — seat counts update instantly for everyone

An AI endpoint (Google Gemini) parses the free-text input into structured ride data. If the AI is unavailable, a regex fallback handles common patterns. A mic button lets users dictate instead of type.

The app is a **Progressive Web App** — installable to the home screen on both Android and iOS with no app store required.

## Tech stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com) + glassmorphism |
| Auth & DB | [Supabase](https://supabase.com) (Auth, Postgres, Realtime) |
| AI | [Vercel AI SDK](https://sdk.vercel.ai) + [Google Gemini](https://ai.google.dev) |
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
cp .env.example .env.local
# Fill in your Supabase and Gemini keys (see docs/SETUP.md)

# 4. Database
# Run the SQL migrations in order in the Supabase SQL Editor:
#   supabase/migrations/001_initial_schema.sql
#   supabase/migrations/002_ride_seats_trigger.sql
#   supabase/migrations/003_auto_create_profile.sql

# 5. Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
last-mile-splitter/
├── app/
│   ├── layout.tsx              # Root layout (PWA meta, service worker)
│   ├── page.tsx                # Home — NavBar + CreateRideAI + RideFeed
│   ├── globals.css             # Tailwind + glassmorphism utilities
│   ├── (auth)/                 # Auth route group
│   │   ├── layout.tsx          # "Back to home" wrapper
│   │   ├── login/page.tsx      # Email + password login
│   │   └── signup/page.tsx     # Sign up + email confirmation flow
│   ├── api/api-parse/route.ts  # AI parse endpoint (Gemini)
│   └── auth/callback/route.ts  # Email confirmation callback
├── components/
│   ├── CreateRideAI.tsx        # NLP input + voice + Supabase insert
│   ├── NavBar.tsx              # Auth-aware header with user menu
│   ├── RideCards.tsx           # Single ride card (join / leave)
│   ├── RideFeed.tsx            # Live feed with Realtime subscription
│   └── ServiceWorker.tsx       # SW registration + PWA install prompt
├── lib/
│   ├── supabase/
│   │   ├── client.ts           # Browser Supabase client
│   │   ├── server.ts           # Server Supabase client (cookies)
│   │   ├── proxy.ts            # Session refresh for proxy.ts
│   │   └── database.types.ts   # TypeScript types + rideToCardProps
│   ├── supabase.ts             # Re-export of browser client
│   └── utils.ts                # cn() class helper
├── supabase/migrations/        # SQL migrations (run in order)
├── public/
│   ├── manifest.json           # PWA manifest
│   ├── sw.js                   # Service worker
│   └── icons/                  # App icons (SVG)
├── proxy.ts                    # Next.js 16 proxy (session refresh)
└── types/speech.d.ts           # Web Speech API type declarations
```

## Documentation

- **[docs/SETUP.md](docs/SETUP.md)** — Environment variables, Supabase config, Gemini API key
- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** — How the pieces fit together
- **[docs/DATABASE.md](docs/DATABASE.md)** — Schema, RLS policies, triggers, Realtime

## Environment variables

| Variable | Where | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `.env.local` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `.env.local` | Supabase anonymous/publishable key |
| `GOOGLE_GENERATIVE_AI_API_KEY` | `.env.local` | Google Gemini API key (server-side only) |


## License

MIT
