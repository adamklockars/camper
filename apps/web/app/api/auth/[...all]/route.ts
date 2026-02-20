import { NextRequest, NextResponse } from "next/server";

// Placeholder: Better Auth catch-all route handler.
// In production, this would initialize and export the Better Auth handler:
//
// import { auth } from "@/lib/auth";
// export const { GET, POST } = auth.handler;

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: "Auth not configured yet" },
    { status: 501 }
  );
}

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: "Auth not configured yet" },
    { status: 501 }
  );
}
