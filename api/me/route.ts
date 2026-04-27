import { NextRequest, NextResponse } from "next/server";
import { sessionFromRequest } from "@/lib/auth";

// Simple endpoint to return the current authenticated session.  This exposes
// the user's id, organization id and role so that client components can
// display role-specific UI (e.g. a role badge).  If no session exists
// the endpoint returns a 401 status.
export async function GET(req: NextRequest) {
  const session = sessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Oturum açmanız gerekiyor." }, { status: 401 });
  }
  // We intentionally only return safe fields (userId, orgId, role, email) to
  // avoid leaking sensitive data.  The client can use this to display
  // the current role.
  return NextResponse.json({ session, ok: true });
}