import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export function requireAuth(req: NextRequest) {
  const token = req.cookies.get("ttm_token")?.value;

  if (!token || !verifyToken(token)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  return null;
}
