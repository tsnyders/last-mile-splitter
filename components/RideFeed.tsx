"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Ride } from "@/lib/supabase/database.types";
import { rideToCardProps } from "@/lib/supabase/database.types";
import RideCard from "@/components/RideCards";

export default function RideFeed() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [joinedRideIds, setJoinedRideIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchRides = useCallback(async () => {
    const { data, error } = await supabase
      .from("rides")
      .select("*")
      .eq("status", "open")
      .order("departure_time", { ascending: true });
    if (!error && data) setRides(data as Ride[]);
  }, [supabase]);

  const fetchMyParticipations = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setJoinedRideIds(new Set());
      return;
    }
    const { data } = await supabase
      .from("ride_participants")
      .select("ride_id")
      .eq("user_id", user.id);
    setJoinedRideIds(new Set((data ?? []).map((r) => r.ride_id)));
  }, [supabase]);

  useEffect(() => {
    fetchRides();
    fetchMyParticipations().finally(() => setLoading(false));
  }, [fetchRides, fetchMyParticipations]);

  useEffect(() => {
    const channel = supabase
      .channel("rides-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rides" },
        () => {
          fetchRides();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchRides]);

  const handleJoin = useCallback(
    async (rideId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase
        .from("ride_participants")
        .insert({ ride_id: rideId, user_id: user.id });
      if (error) return;
      setJoinedRideIds((prev) => new Set(prev).add(rideId));
      fetchRides();
    },
    [supabase, fetchRides]
  );

  const handleLeave = useCallback(
    async (rideId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase
        .from("ride_participants")
        .delete()
        .eq("ride_id", rideId)
        .eq("user_id", user.id);
      setJoinedRideIds((prev) => {
        const next = new Set(prev);
        next.delete(rideId);
        return next;
      });
      fetchRides();
    },
    [supabase, fetchRides]
  );

  if (loading && rides.length === 0) {
    return (
      <div className="w-full py-8 text-center text-sm opacity-70">
        Loading rides…
      </div>
    );
  }

  if (rides.length === 0) {
    return (
      <div className="w-full py-8 text-center text-sm opacity-70">
        No open rides yet. Post one above!
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-4">
      {rides.map((ride) => {
        const props = rideToCardProps(ride);
        return (
          <RideCard
            key={ride.id}
            id={props.id}
            time={props.time}
            destination={props.destination}
            leavingFrom={props.leavingFrom}
            seatsFilled={props.seatsFilled}
            seatsTotal={props.seatsTotal}
            isJoined={joinedRideIds.has(ride.id)}
            onJoin={handleJoin}
            onLeave={handleLeave}
          />
        );
      })}
    </div>
  );
}
