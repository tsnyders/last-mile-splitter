"use client";

import { useState, useRef } from "react";
import { Mic, MicOff, Send, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";
import { useToast } from "@/components/Toast";

type ParsedRide = {
  origin: string;
  destination: string;
  departure_time: string;
  total_seats: number;
};

function regexParse(text: string): ParsedRide | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const toMatch = trimmed.match(
    /(.+?)\s+(?:to|-|→)\s+(.+?)(?:\s+at\s+|\s+@\s+|\s+)(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i
  );

  let origin = "";
  let destination = "";
  let timeStr = "";

  if (toMatch) {
    origin = toMatch[1].trim();
    destination = toMatch[2].trim();
    timeStr = (toMatch[3] || "").trim();
  } else {
    const toIdx = trimmed.toLowerCase().indexOf(" to ");
    if (toIdx < 0) return null;
    origin = trimmed.slice(0, toIdx).trim();
    const rest = trimmed.slice(toIdx + 4).trim();
    const atMatch = rest.match(/^(.+?)\s+(?:at|@)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i);
    if (atMatch) {
      destination = atMatch[1].trim();
      timeStr = atMatch[2].trim();
    } else {
      destination = rest.replace(/,.*$/, "").trim();
    }
  }

  if (!origin || !destination) return null;

  const date = new Date();
  if (timeStr) {
    const t = timeStr.replace(/\s/g, "").toLowerCase();
    const pm = t.endsWith("pm");
    const am = t.endsWith("am");
    const num = t.replace(/(am|pm)$/, "");
    const [h, m] = num.includes(":") ? num.split(":") : [num, "0"];
    let hour = parseInt(h, 10);
    if (pm && hour < 12) hour += 12;
    if (am && hour === 12) hour = 0;
    date.setHours(hour, parseInt(m, 10) || 0, 0, 0);
  }

  const seatsMatch = trimmed.match(/(\d+)\s*(?:people|seats?)/i);
  const total_seats = seatsMatch
    ? Math.min(8, Math.max(1, parseInt(seatsMatch[1], 10)))
    : 4;

  return { origin, destination, departure_time: date.toISOString(), total_seats };
}

async function aiParse(prompt: string): Promise<ParsedRide> {
  const res = await fetch("/api/api-parse", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  if (!res.ok) throw new Error("AI parse request failed");
  return res.json();
}

export default function CreateRideAI() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { toast } = useToast();

  const toggleVoice = () => {
    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast("Voice input is not supported in this browser.", "error");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-ZA";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setPrompt((prev) => (prev ? prev + " " + transcript : transcript));
      setListening(false);
    };

    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!prompt.trim()) {
      toast("Type or speak a ride description first.", "error");
      return;
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast("Please sign in to post a ride.", "error");
      return;
    }

    setLoading(true);
    try {
      let parsed: ParsedRide;
      try {
        parsed = await aiParse(prompt);
      } catch {
        const fallback = regexParse(prompt);
        if (!fallback) {
          throw new Error(
            'Could not understand. Try: "Rosebank to Bedfordview at 08:15, need 2 seats"'
          );
        }
        parsed = fallback;
      }

      await supabase.from("profiles").upsert(
        { id: user.id, full_name: user.user_metadata?.full_name ?? null },
        { onConflict: "id" }
      );

      const insert: Database["public"]["Tables"]["rides"]["Insert"] = {
        creator_id: user.id,
        origin: parsed.origin,
        destination: parsed.destination,
        departure_time: parsed.departure_time,
        total_seats: parsed.total_seats,
        available_seats: Math.max(0, parsed.total_seats - 1),
        status: "open",
      };

      const { error: insertError } = await supabase.from("rides").insert(insert);
      if (insertError) throw insertError;

      setPrompt("");
      toast("Ride posted!", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to create ride", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="w-full mb-10">
      <form onSubmit={handleSubmit} className="glass-card p-5 flex flex-col gap-4">
        <textarea
          rows={2}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder='e.g., "Arriving at Rosebank at 8:15 AM, heading to Bedfordview, looking for 2 people to split"'
          className="w-full bg-transparent resize-none text-lg focus:outline-none placeholder:text-foreground/50 placeholder:font-light"
          disabled={loading}
        />
        <div className="flex justify-between items-center pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={toggleVoice}
            className={`p-2 rounded-full transition ${
              listening
                ? "bg-red-500/20 text-red-400 animate-pulse"
                : "hover:bg-white/10"
            }`}
            aria-label={listening ? "Stop recording" : "Start voice input"}
          >
            {listening ? <MicOff size={20} /> : <Mic size={20} className="opacity-75" />}
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 rounded-full bg-foreground text-white dark:text-gray-900 font-medium hover:opacity-90 transition flex items-center gap-2 disabled:opacity-70"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
            <span>{loading ? "Posting…" : "Post Ride"}</span>
          </button>
        </div>
      </form>
    </section>
  );
}
