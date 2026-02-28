/**
 * TypeScript types matching your Supabase schema.
 * Run the SQL in supabase/migrations/001_initial_schema.sql in the Supabase SQL Editor first.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type RideStatus = "open" | "full" | "completed" | "canceled";

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Ride {
  id: string;
  creator_id: string;
  origin: string;
  destination: string;
  departure_time: string;
  total_seats: number;
  available_seats: number;
  status: RideStatus;
  created_at: string;
}

export interface RideParticipant {
  ride_id: string;
  user_id: string;
  joined_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  ride_id: string;
  type: string;
  message: string;
  read: boolean;
  created_at: string;
}

/** Ride row joined with the creator's profile name */
export interface RideWithCreator extends Ride {
  profiles: { full_name: string | null } | null;
}

/** Supabase schema map for typed client usage */
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at"> & { created_at?: string };
        Update: Partial<Omit<Profile, "id">>;
      };
      rides: {
        Row: Ride;
        Insert: Omit<Ride, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
          status?: RideStatus;
        };
        Update: Partial<Omit<Ride, "id">>;
      };
      ride_participants: {
        Row: RideParticipant;
        Insert: RideParticipant | { joined_at?: string };
        Update: Partial<Omit<RideParticipant, "ride_id" | "user_id">>;
      };
    };
  };
}

/** Format a departure time as a relative string like "in 45 min" */
export function relativeTime(departure: string): string {
  const diff = new Date(departure).getTime() - Date.now();
  if (diff < 0) return "departed";
  const mins = Math.round(diff / 60_000);
  if (mins < 1) return "now";
  if (mins < 60) return `in ${mins} min`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `in ${hrs}h ${rem}m` : `in ${hrs}h`;
}

/**
 * Map a DB Ride (optionally with joined profiles) to RideCard props.
 */
export function rideToCardProps(ride: Ride | RideWithCreator): {
  id: string;
  time: string;
  relativeTime: string;
  destination: string;
  leavingFrom: string;
  seatsFilled: number;
  seatsTotal: number;
  status: RideStatus;
  creatorId: string;
  creatorName: string;
} {
  const d = new Date(ride.departure_time);
  const time = d.toLocaleTimeString("en-ZA", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  const creator = "profiles" in ride && ride.profiles
    ? ride.profiles.full_name || "Anonymous"
    : "Anonymous";
  return {
    id: ride.id,
    time,
    relativeTime: relativeTime(ride.departure_time),
    destination: ride.destination,
    leavingFrom: ride.origin,
    seatsFilled: ride.total_seats - ride.available_seats,
    seatsTotal: ride.total_seats,
    status: ride.status,
    creatorId: ride.creator_id,
    creatorName: creator,
  };
}
