import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { NextResponse } from "next/server";

const rideSchema = z.object({
  origin: z.string().describe("Where the rider is departing from (station or area name)"),
  destination: z.string().describe("Where the rider is heading to"),
  departure_time: z
    .string()
    .describe("Departure time in HH:mm 24-hour format, e.g. '08:15'"),
  total_seats: z
    .number()
    .int()
    .min(1)
    .max(8)
    .describe("Total seats needed including the poster. Default to 4 if unclear."),
});

export async function POST(request: Request) {
  try {
    const { prompt } = (await request.json()) as { prompt?: string };
    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: "Missing or empty prompt" },
        { status: 400 }
      );
    }

    const { object } = await generateObject({
      model: google("gemini-1.5-flash"),
      schema: rideSchema,
      system: `You extract ride-share details from natural language. The user is at or near a transit station and wants to share a last-mile ride.
Extract the origin, destination, departure time (24-hour HH:mm), and total seats.
If the user says "looking for 2 people" that means total_seats = 3 (2 others + the poster).
If seat count is unclear, default to 4.
If no time is given, use "08:00" as default.
Only return the structured data, nothing else.`,
      prompt: prompt.trim(),
    });

    // Build ISO departure_time: today + extracted time
    const [h, m] = (object.departure_time || "08:00").split(":").map(Number);
    const date = new Date();
    date.setHours(h || 8, m || 0, 0, 0);

    return NextResponse.json({
      origin: object.origin,
      destination: object.destination,
      departure_time: date.toISOString(),
      total_seats: object.total_seats,
    });
  } catch (err) {
    console.error("[api-parse]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "AI parse failed" },
      { status: 500 }
    );
  }
}
