import { NextRequest, NextResponse } from "next/server";
import { sessionFromRequest } from "@/lib/auth";

// Allow mobile app requests (CORS)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

/**
 * Mobile session validation — checks Bearer token.
 */
export async function GET(req: NextRequest) {
  const session = sessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ authenticated: false, session: null });
  }
  return NextResponse.json({ authenticated: true, session });
}
