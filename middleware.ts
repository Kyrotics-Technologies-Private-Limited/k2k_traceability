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

  // Customer routes - require token
  if (pathname.startsWith('/customer')) {
    const token = url.searchParams.get("token") || req.cookies.get("token")?.value;

    if (token) {
      // verify via API route instead of directly in middleware
      const verifyUrl = `${req.nextUrl.origin}/api/verify-token?token=${token}`;
      const res = await fetch(verifyUrl);
      if (res.ok) {
        // ✅ valid token → set cookie for session
        const response = NextResponse.next();
        response.cookies.set("token", token, { httpOnly: true });
        return response;
      }
    }

    // ❌ no valid token → redirect to login page
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/customer/:path*"], // Protect admin and customer pages
};
