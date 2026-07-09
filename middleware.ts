import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const pathname = url.pathname;

  // Admin routes - require email/password auth (no token)
  if (pathname.startsWith('/admin')) {
    // Check if user has admin session (you might want to implement session checking here)
    // For now, we'll let the admin page handle authentication
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"], // Protect admin pages
};
