import { NextRequest } from "next/server";
import { clearAuthCookie } from "@/lib/auth";
import { ok } from "@/lib/response";

export async function POST(_req: NextRequest) {
  clearAuthCookie();
  return ok({ message: "Logged out" });
}
