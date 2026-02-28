# Database Schema

Supabase Postgres schema for Last Mile Splitter.

---

## Tables

### `profiles`

Extends Supabase Auth. One row per user.

| Column | Type | Notes |
|---|---|---|
| `id` | `UUID` | PK, FK → `auth.users` |
| `full_name` | `TEXT` | Nullable |
| `avatar_url` | `TEXT` | Nullable |
| `created_at` | `TIMESTAMPTZ` | Default `now()` |

### `rides`

The core table. Subscribed to Realtime.

| Column | Type | Notes |
|---|---|---|
| `id` | `UUID` | PK, auto-generated |
| `creator_id` | `UUID` | FK → `profiles.id`, NOT NULL |
| `origin` | `TEXT` | NOT NULL |
| `destination` | `TEXT` | NOT NULL |
| `departure_time` | `TIMESTAMPTZ` | NOT NULL |
| `total_seats` | `INTEGER` | Default 4 |
| `available_seats` | `INTEGER` | Default 3 (creator takes one) |
| `status` | `TEXT` | `'open'`, `'full'`, `'completed'`, `'canceled'` |
| `created_at` | `TIMESTAMPTZ` | Default `now()` |

### `ride_participants`

Junction table — who joined which ride.

| Column | Type | Notes |
|---|---|---|
| `ride_id` | `UUID` | PK part 1, FK → `rides.id` (CASCADE) |
| `user_id` | `UUID` | PK part 2, FK → `profiles.id` (CASCADE) |
| `joined_at` | `TIMESTAMPTZ` | Default `now()` |

### `notifications`

In-app + push notification records.

| Column | Type | Notes |
|---|---|---|
| `id` | `UUID` | PK, auto-generated |
| `user_id` | `UUID` | FK → `profiles.id` (CASCADE), NOT NULL |
| `ride_id` | `UUID` | FK → `rides.id` (CASCADE), NOT NULL |
| `type` | `TEXT` | Default `'rider_joined'` |
| `message` | `TEXT` | NOT NULL |
| `read` | `BOOLEAN` | Default `false` |
| `created_at` | `TIMESTAMPTZ` | Default `now()` |

### `push_subscriptions`

Web Push subscription storage (one per user per device).

| Column | Type | Notes |
|---|---|---|
| `id` | `UUID` | PK, auto-generated |
| `user_id` | `UUID` | FK → `profiles.id` (CASCADE), NOT NULL |
| `endpoint` | `TEXT` | NOT NULL |
| `keys_p256dh` | `TEXT` | NOT NULL |
| `keys_auth` | `TEXT` | NOT NULL |
| `created_at` | `TIMESTAMPTZ` | Default `now()` |
| | | UNIQUE(`user_id`, `endpoint`) |

## Row Level Security (RLS)

All tables have RLS enabled.

### profiles

| Operation | Policy |
|---|---|
| SELECT | Anyone (`true`) |
| INSERT | Only own profile (`auth.uid() = id`) |
| UPDATE | Only own profile (`auth.uid() = id`) |

### rides

| Operation | Policy |
|---|---|
| SELECT | Anyone (`true`) |
| INSERT | Authenticated, must be creator (`auth.uid() = creator_id`) |
| UPDATE | Only the creator (`auth.uid() = creator_id`) |

### ride_participants

| Operation | Policy |
|---|---|
| SELECT | Anyone (`true`) |
| INSERT | Authenticated, must be self (`auth.uid() = user_id`) |
| DELETE | Only own participation (`auth.uid() = user_id`) |

### notifications

| Operation | Policy |
|---|---|
| SELECT | Only own notifications (`auth.uid() = user_id`) |
| UPDATE | Only own notifications (`auth.uid() = user_id`) |

### push_subscriptions

| Operation | Policy |
|---|---|
| ALL | Only own subscriptions (`auth.uid() = user_id`) |

## Triggers

### Seat count sync + auto-full (migrations 002 + 004)

When a participant **joins** (`INSERT`), the trigger:
- Decrements `rides.available_seats` by 1
- Sets `status = 'full'` if seats hit 0

When a participant **leaves** (`DELETE`), the trigger:
- Increments `rides.available_seats` by 1
- Re-opens the ride if it was `'full'`

Runs as `SECURITY DEFINER` to bypass RLS.

### Auto-create profile (migration 003)

When a new `auth.users` row is inserted, creates a `profiles` row with `full_name` from user metadata. Uses `ON CONFLICT DO NOTHING`.

### Notify ride creator (migration 004)

When a participant **joins** (`INSERT` on `ride_participants`), the trigger:
- Looks up the ride and the joiner's name
- Skips if the joiner is the creator (no self-notification)
- Inserts a `notifications` row for the ride creator

## Realtime

Enabled for two tables:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.rides;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
```

- **Rides** — `RideFeed` subscribes for instant feed updates
- **Notifications** — `NotificationBell` subscribes for instant bell badge updates + push send

## Entity relationship

```
auth.users
    │
    ▼ 1:1
profiles
    │
    ├──▶ rides (creator_id)            1:N
    ├──▶ ride_participants (user_id)   N:M ──▶ rides (ride_id)
    ├──▶ notifications (user_id)       1:N ──▶ rides (ride_id)
    └──▶ push_subscriptions (user_id)  1:N
```

## Migrations

Run in the **Supabase SQL Editor** in order:

1. **`001_initial_schema.sql`** — Tables, RLS, policies, Realtime for rides
2. **`002_ride_seats_trigger.sql`** — Seat sync trigger
3. **`003_auto_create_profile.sql`** — Auto-create profile on signup
4. **`004_notifications_and_auto_full.sql`** — Notifications table, Realtime, notify trigger, auto-full logic
5. **`005_push_subscriptions.sql`** — Push subscription storage
