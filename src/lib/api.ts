/**
 * Shared API utilities — response helpers, validation, error handling.
 */
import { NextResponse } from "next/server";

export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

export function err(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export const API = {
  unauthorized: () => err("Unauthorized", 401),
  forbidden: () => err("Forbidden", 403),
  notFound: (resource = "Resource") => err(`${resource} not found`, 404),
  badRequest: (msg = "Bad request") => err(msg, 400),
  tooManyRequests: (resetAt?: number) =>
    NextResponse.json(
      { error: "Too many requests. Please slow down." },
      {
        status: 429,
        headers: resetAt ? { "Retry-After": String(Math.ceil((resetAt - Date.now()) / 1000)) } : {},
      }
    ),
  serviceUnavailable: (msg = "Service unavailable") => err(msg, 503),
  internalError: (msg = "Internal server error") => err(msg, 500),
} as const;

/** Parse + validate JSON body. Returns null on failure. */
export async function parseBody<T>(
  req: Request,
  validator: (body: unknown) => body is T
): Promise<T | null> {
  try {
    const body = await req.json();
    return validator(body) ? body : null;
  } catch {
    return null;
  }
}
