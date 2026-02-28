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

Open the **SQL Editor** in your Supabase dashboard and run these files **in order**:

1. `supabase/migrations/001_initial_schema.sql` — Creates `profiles`, `rides`, `ride_participants` tables with RLS policies and enables Realtime on rides.
2. `supabase/migrations/002_ride_seats_trigger.sql` — Trigger that auto-updates `rides.available_seats` when participants join or leave. Also auto-sets status to `'full'` when seats hit 0.
3. `supabase/migrations/003_auto_create_profile.sql` — Trigger that auto-creates a `profiles` row when a new user signs up.
4. `supabase/migrations/004_notifications_and_auto_full.sql` — Creates `notifications` table with RLS, enables Realtime on notifications, adds trigger to notify ride creator when someone joins.
5. `supabase/migrations/005_push_subscriptions.sql` — Creates `push_subscriptions` table for Web Push.

## 4. Configure Supabase Auth

In your Supabase dashboard:

1. Go to **Authentication > URL Configuration**.
2. Set **Site URL** to `http://localhost:3000`.
3. Add these to **Redirect URLs**:
   - `http://localhost:3000/auth/callback`
   - `https://your-production-domain.vercel.app/auth/callback` (when deploying)

## 5. Get a Gemini API key

1. Go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey).
2. Create an API key.
3. The free tier supports `gemini-1.5-flash`.

## 6. Generate VAPID keys (for push notifications)

```bash
npx web-push generate-vapid-keys --json
```

This outputs a `publicKey` and `privateKey`. You'll need both.

## 7. Environment variables

Create `.env.local` in the project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Google Gemini (server-side only)
GOOGLE_GENERATIVE_AI_API_KEY=your-gemini-api-key

# Push Notifications (VAPID)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
```

| Variable | Public? | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key (safe for browser) |
| `GOOGLE_GENERATIVE_AI_API_KEY` | No | Gemini key — only used in API route |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Yes | VAPID public key for push subscription |
| `VAPID_PRIVATE_KEY` | No | VAPID private key — only used server-side |

## 8. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## 9. Deploy to Vercel

```bash
npm i -g vercel
vercel
```

In Vercel project settings, add all five environment variables. Then add your production callback URL to Supabase's redirect allow list.

## Troubleshooting

### "Email link is invalid or has expired"

The email confirmation link expired (default 1 hour). Sign up again. Make sure `http://localhost:3000/auth/callback` is in your Supabase redirect URLs.

### Foreign key error on rides insert

Your user doesn't have a `profiles` row. Run migration `003_auto_create_profile.sql`. The app also auto-creates the profile on the next ride post as a fallback.

### Gemini quota exceeded

The free tier has rate limits. The app falls back to regex parsing automatically. Use the format: `"Origin to Destination at HH:MM, N seats"`.

### Rides not appearing

Check that your rides have `status = 'open'` and `departure_time` is within the last 2 hours or in the future. The feed filters out older rides.

### Push notifications not working

1. Make sure the VAPID keys are set in `.env.local`.
2. Click the notification bell → "Enable push" to grant browser permission.
3. Push only works on HTTPS (or localhost for development).

### Service worker caching stale pages

Hard refresh (`Ctrl+Shift+R`) or clear site data in DevTools > Application > Storage.
