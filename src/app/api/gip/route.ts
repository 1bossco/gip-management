// ============================================================
// src/app/api/gip/route.ts
// Server-side proxy to Google Apps Script.
// Browser calls /api/gip — this server calls GAS privately.
// Eliminates ALL CORS and permission issues.
// ============================================================

import { NextRequest, NextResponse } from "next/server";

const GAS_URL    = process.env.NEXT_PUBLIC_GAS_URL!;
const API_SECRET = process.env.NEXT_PUBLIC_API_SECRET ?? "";

export async function GET(request: NextRequest) {
  try {
    // Forward all query params from the browser to GAS
    const incoming = request.nextUrl.searchParams;
    const gasUrl   = new URL(GAS_URL);

    incoming.forEach((value, key) => {
      gasUrl.searchParams.set(key, value);
    });

    // Always inject the secret server-side
    if (API_SECRET) gasUrl.searchParams.set("apiSecret", API_SECRET);

    const gasRes = await fetch(gasUrl.toString(), {
      method: "GET",
      cache:  "no-store",
    });

    const text = await gasRes.text();

    // Try to parse as JSON, return as-is if it fails
    try {
      const json = JSON.parse(text);
      return NextResponse.json(json);
    } catch {
      return new NextResponse(text, {
        status: gasRes.status,
        headers: { "Content-Type": "text/plain" },
      });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Proxy error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const incoming = request.nextUrl.searchParams;
    const gasUrl   = new URL(GAS_URL);

    incoming.forEach((value, key) => {
      gasUrl.searchParams.set(key, value);
    });

    if (API_SECRET) gasUrl.searchParams.set("apiSecret", API_SECRET);

    const gasRes = await fetch(gasUrl.toString(), {
      method: "GET", // GAS only handles GET reliably
      cache:  "no-store",
    });

    const text = await gasRes.text();

    try {
      const json = JSON.parse(text);
      return NextResponse.json(json);
    } catch {
      return new NextResponse(text, {
        status: gasRes.status,
        headers: { "Content-Type": "text/plain" },
      });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Proxy error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}