import { NextResponse } from "next/server";

function buildHealthPayload() {
  return {
    status: "ok",
    service: "kartfreedom-race-league",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV ?? "development",
  };
}

export async function GET() {
  return NextResponse.json(buildHealthPayload(), {
    status: 200,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
