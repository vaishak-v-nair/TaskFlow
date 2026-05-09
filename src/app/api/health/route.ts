import { NextRequest } from "next/server";
import { ok } from "@/lib/response";

export async function GET(_: NextRequest) {
  return ok({ status: "ok", timestamp: new Date().toISOString() });
}
