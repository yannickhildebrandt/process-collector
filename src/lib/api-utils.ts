import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function getAuthSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}

export function unauthorized() {
  return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
}

export function forbidden(message = "Not authorized") {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function badRequest(error: string) {
  return NextResponse.json({ error }, { status: 400 });
}

export function notFound(resource = "Resource") {
  return NextResponse.json({ error: `${resource} not found` }, { status: 404 });
}

export function conflict(error: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ error, ...extra }, { status: 409 });
}
