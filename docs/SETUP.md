# Setup Guide

Step-by-step instructions to get Last Mile Splitter running locally.

---

## Prerequisites

- **Node.js** 18+ and **npm**
- A **Supabase** account ([supabase.com](https://supabase.com))
- A **Google AI Studio** account for Gemini ([aistudio.google.com](https://aistudio.google.com))

## 1. Clone and install

```bash
git clone https://github.com/your-username/last-mile-splitter.git
cd last-mile-splitter
npm install
```

## 2. Create a Supabase project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and create a new project.
2. Note your **Project URL** and **anon key** from **Settings > API**.

## 3. Run database migrations

Open the **SQL Editor** in your Supabase dashboard and run these three files **in order**:

1. `supabase/migrations/001_initial_schema.sql` — Creates `profiles`, `rides`, `ride_participants` tables with RLS policies and enables Realtime.
2. `supabase/migrations/002_ride_seats_trigger.sql` — Adds a trigger that auto-updates `rides.available_seats` when participants join or leave.
3. `supabase/migrations/003_auto_create_profile.sql` — Adds a trigger that auto-creates a `profiles` row when a new user signs up.

## 4. Configure Supabase Auth

In your Supabase dashboard:

1. Go to **Authentication > URL Configuration**.
2. Set **Site URL** to `http://localhost:3000`.
3. Add these to **Redirect URLs**:
   - `http://localhost:3000/auth/callback`
   - `https://your-production-domain.vercel.app/auth/callback` (add later when deploying)

## 5. Get a Gemini API key

1. Go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey).
2. Create an API key.
3. The free tier supports `gemini-2.5-flash` with generous rate limits.

## 6. Environment variables

Create `.env.local` in the project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Google Gemini (server-side only — no NEXT_PUBLIC_ prefix)
GOOGLE_GENERATIVE_AI_API_KEY=your-gemini-api-key
```

| Variable | Public? | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key (safe for browser) |
| `GOOGLE_GENERATIVE_AI_API_KEY` | No | Gemini key — only used in the API route on the server |

## 7. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## 8. Deploy to Vercel

```bash
# Push to GitHub, then:
npm i -g vercel
vercel
```

Or click the "Deploy with Vercel" button in the README.

In the Vercel project settings, add the three environment variables above. Then add your production callback URL to Supabase's redirect allow list.

## Troubleshooting

### "Email link is invalid or has expired"

The email confirmation link expired (default 1 hour). Sign up again. Make sure `http://localhost:3000/auth/callback` is in your Supabase redirect URLs.

### Foreign key error on rides insert

Your user doesn't have a `profiles` row. Run migration `003_auto_create_profile.sql` to fix this for all future signups. Existing users: the app auto-creates the profile on the next ride post.

### Gemini quota exceeded

The free tier has rate limits. The app falls back to regex parsing automatically. If the regex can't parse your input, use the format: `"Origin to Destination at HH:MM, N seats"`.

### Service worker caching stale pages

Hard refresh (`Ctrl+Shift+R`) or clear site data in DevTools > Application > Storage.
