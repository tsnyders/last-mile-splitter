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

/**
 * Map a DB Ride to props for RideCard (time string, seats filled = total - available).
 */
export function rideToCardProps(ride: Ride): {
  id: string;
  time: string;
  destination: string;
  leavingFrom: string;
  seatsFilled: number;
  seatsTotal: number;
  status: RideStatus;
} {
  const d = new Date(ride.departure_time);
  const time = d.toLocaleTimeString("en-ZA", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return {
    id: ride.id,
    time,
    destination: ride.destination,
    leavingFrom: ride.origin,
    seatsFilled: ride.total_seats - ride.available_seats,
    seatsTotal: ride.total_seats,
    status: ride.status,
  };
}
