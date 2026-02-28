"use client";

import { useState } from "react";
import { Clock, XCircle } from "lucide-react";

export type RideCardProps = {
  id?: string;
  time: string;
  relativeTime?: string;
  destination: string;
  leavingFrom: string;
  seatsFilled: number;
  seatsTotal: number;
  creatorName?: string;
  creatorId?: string;
  currentUserId?: string | null;
  isJoined?: boolean;
  onJoin?: (rideId: string) => void;
  onLeave?: (rideId: string) => void;
  onCancel?: (rideId: string) => void;
};

export function RideCardSkeleton() {
  return (
    <div className="glass-card p-5 flex flex-col gap-3 animate-pulse">
      <div className="h-8 w-28 rounded-lg bg-white/10" />
      <div className="h-5 w-48 rounded-lg bg-white/10" />
      <div className="h-4 w-36 rounded-lg bg-white/10" />
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            <div className="w-8 h-8 rounded-full bg-white/10" />
            <div className="w-8 h-8 rounded-full bg-white/10" />
          </div>
          <div className="h-4 w-16 rounded bg-white/10" />
        </div>
        <div className="h-9 w-24 rounded-full bg-white/10" />
      </div>
    </div>
  );
}

export default function RideCard({
  id,
  time,
  relativeTime,
  destination,
  leavingFrom,
  seatsFilled,
  seatsTotal,
  creatorName,
  creatorId,
  currentUserId,
  isJoined: isJoinedProp = false,
  onJoin,
  onLeave,
  onCancel,
}: RideCardProps) {
  const [localJoined, setLocalJoined] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmJoin, setConfirmJoin] = useState(false);
  const isJoined = id ? isJoinedProp : localJoined;
  const isCreator = currentUserId && creatorId && currentUserId === creatorId;

  const handleJoin = async () => {
    if (!confirmJoin) {
      setConfirmJoin(true);
      return;
    }
    setLoading(true);
    if (id && onJoin) {
      await onJoin(id);
    } else {
      setLocalJoined(true);
    }
    setLoading(false);
    setConfirmJoin(false);
  };

  const handleLeave = async () => {
    setLoading(true);
    if (id && onLeave) {
      await onLeave(id);
    } else {
      setLocalJoined(false);
    }
    setLoading(false);
  };

  const handleCancel = async () => {
    if (!id || !onCancel) return;
    setLoading(true);
    await onCancel(id);
    setLoading(false);
  };

  return (
    <div className="glass-card p-5 flex flex-col gap-2">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-3xl font-bold tracking-tight">{time}</h3>
            {relativeTime && relativeTime !== "departed" && (
              <span className="flex items-center gap-1 text-xs font-medium opacity-60 mt-1">
                <Clock size={12} /> {relativeTime}
              </span>
            )}
            {relativeTime === "departed" && (
              <span className="text-xs font-medium text-red-400 mt-1">Departed</span>
            )}
          </div>
          <p className="text-lg font-medium opacity-90 mt-1">{destination}</p>
          <p className="text-sm opacity-70 mt-1">Leaving from: {leavingFrom}</p>
          {creatorName && (
            <p className="text-xs opacity-50 mt-1">
              Posted by {isCreator ? "you" : creatorName}
            </p>
          )}
        </div>
      </div>

      {isJoined && (
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
          <p className="text-sm text-green-400 font-medium">You joined this ride</p>
          <button
            type="button"
            onClick={handleLeave}
            disabled={loading}
            className="px-5 py-2 rounded-full bg-white/20 hover:bg-white/30 transition font-medium text-sm disabled:opacity-70"
          >
            Leave
          </button>
        </div>
      )}

      {!isJoined && (
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

          <div className="flex items-center gap-2">
            {isCreator && onCancel && (
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="p-2 rounded-full hover:bg-red-500/20 transition text-red-400 disabled:opacity-50"
                title="Cancel ride"
              >
                <XCircle size={20} />
              </button>
            )}
            {!isCreator && (
              <button
                type="button"
                onClick={handleJoin}
                disabled={loading || seatsFilled >= seatsTotal}
                className={`px-5 py-2 rounded-full font-medium text-sm transition disabled:opacity-50 ${
                  confirmJoin
                    ? "bg-green-500/30 hover:bg-green-500/40 text-green-300"
                    : "bg-white/20 hover:bg-white/30"
                }`}
              >
                {confirmJoin ? "Confirm?" : "Join Ride"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
