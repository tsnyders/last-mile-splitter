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

## Row Level Security (RLS)

All three tables have RLS enabled.

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

## Triggers

### Seat count sync (migration 002)

When a row is **inserted** into `ride_participants`, the trigger decrements `rides.available_seats` by 1. When a row is **deleted**, it increments by 1. Uses `GREATEST`/`LEAST` to clamp values.

```sql
CREATE TRIGGER ride_participants_update_seats
  AFTER INSERT OR DELETE ON public.ride_participants
  FOR EACH ROW EXECUTE FUNCTION public.update_ride_available_seats();
```

This runs as `SECURITY DEFINER` so it bypasses RLS (participants can't directly update `rides`, but the trigger can).

### Auto-create profile (migration 003)

When a new row is inserted into `auth.users` (i.e. a user signs up), this trigger creates a corresponding `profiles` row using `full_name` from user metadata.

```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

Uses `ON CONFLICT DO NOTHING` so it's safe if the profile already exists.

## Realtime

Enabled for the `rides` table:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.rides;
```

The frontend subscribes with:

```typescript
supabase
  .channel('rides-changes')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'rides' }, callback)
  .subscribe();
```

This fires on INSERT (new ride posted), UPDATE (seats change, status change), and DELETE.

## Entity relationship

```
auth.users
    │
    ▼ 1:1
profiles
    │
    ├──▶ rides (creator_id)          1:N
    │
    └──▶ ride_participants (user_id) N:M
              │
              └──▶ rides (ride_id)
```

## Migrations

Run in the **Supabase SQL Editor** in order:

1. **`001_initial_schema.sql`** — Tables, RLS, policies, Realtime publication
2. **`002_ride_seats_trigger.sql`** — `available_seats` auto-sync trigger
3. **`003_auto_create_profile.sql`** — Auto-create profile on signup trigger
