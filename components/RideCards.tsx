"use client";

import { useState } from "react";

export type RideCardProps = {
  id?: string;
  time: string;
  destination: string;
  leavingFrom: string;
  seatsFilled: number;
  seatsTotal: number;
  isJoined?: boolean;
  onJoin?: (rideId: string) => void;
  onLeave?: (rideId: string) => void;
};

export default function RideCard({
  id,
  time,
  destination,
  leavingFrom,
  seatsFilled,
  seatsTotal,
  isJoined: isJoinedProp = false,
  onJoin,
  onLeave,
}: RideCardProps) {
  const [localJoined, setLocalJoined] = useState(false);
  const [loading, setLoading] = useState(false);
  const isJoined = id ? isJoinedProp : localJoined;

  const handleJoin = () => {
    if (id && onJoin) {
      setLoading(true);
      onJoin(id);
      setLoading(false);
    } else {
      setLocalJoined(true);
    }
  };

  const handleLeave = () => {
    if (id && onLeave) {
      setLoading(true);
      onLeave(id);
      setLoading(false);
    } else {
      setLocalJoined(false);
    }
  };

  if (isJoined) {
    return (
      <div className="glass-card p-5 flex flex-col gap-2">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-3xl font-bold tracking-tight mb-1">{time}</h3>
            <p className="text-lg font-medium opacity-90">{destination}</p>
            <p className="text-sm opacity-70 mt-1">Leaving from: {leavingFrom}</p>
          </div>
        </div>
        <p className="text-sm opacity-70 mt-2">You have joined this ride</p>
        <button
          type="button"
          onClick={handleLeave}
          disabled={loading}
          className="px-5 py-2 rounded-full bg-white/20 hover:bg-white/30 transition font-medium text-sm w-fit disabled:opacity-70"
        >
          Leave Ride
        </button>
      </div>
    );
  }

  return (
    <div className="glass-card p-5 flex flex-col gap-2">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-3xl font-bold tracking-tight mb-1">{time}</h3>
          <p className="text-lg font-medium opacity-90">{destination}</p>
          <p className="text-sm opacity-70 mt-1">Leaving from: {leavingFrom}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {Array.from({ length: Math.min(seatsFilled, 3) }).map((_, i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-xs"
              >
                {i === 0 ? "🚗" : "👤"}
              </div>
            ))}
          </div>
          <span className="text-sm font-medium opacity-80">
            {seatsFilled}/{seatsTotal} Seats
          </span>
        </div>
        <button
          type="button"
          onClick={handleJoin}
          disabled={loading || seatsFilled >= seatsTotal}
          className="px-5 py-2 rounded-full bg-white/20 hover:bg-white/30 transition font-medium text-sm disabled:opacity-50"
        >
          Join Ride
        </button>
      </div>
    </div>
  );
}
