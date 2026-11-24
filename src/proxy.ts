import { type NextRequest, NextResponse } from "next/server";

import { generateId } from "@/lib/id";

/**
 * Proxy (formerly "Middleware" before Next.js 16). Runs before every matched request.
 *
 * Keep this file FAST and side-effect free. It is for:
 *   - request correlation (request IDs)
 *   - redirects/rewrites based on the request
 *   - *optimistic* auth checks (e.g. "is there a session cookie?")
 *
 * It is NOT an authorization layer. Always re-check permissions next to the
 * data, in the data-access layer or Server Action. See docs/security.md.
 */
const REQUEST_ID_HEADER = "x-request-id";

export function proxy(request: NextRequest) {
  const requestId = request.headers.get(REQUEST_ID_HEADER) ?? generateId();

  // Forward the ID to the app (readable via `headers()`) ...
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(REQUEST_ID_HEADER, requestId);

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  // ... and echo it back to the client for support/debugging.
  response.headers.set(REQUEST_ID_HEADER, requestId);
  return response;
}

export const config = {
  matcher: [
    // Skip Next.js internals, static files and metadata assets.
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)",
  ],
};
