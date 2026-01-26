/**
 * Next.js Middleware for Authentication
 * 
 * This middleware protects routes by checking for valid authentication sessions.
 * It redirects unauthenticated users to the login page.
 * 
 * Protected routes:
 * - /app/* - Main application routes
 * - /api/chat/* - Chat API endpoints
 * 
 * Public routes:
 * - / - Landing page
 * - /login - Login page
 * - /signup - Signup page
 * - /api/auth/* - Auth endpoints (must be public for auth to work)
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware handler with authentication checks
 */
export default function middleware(req: NextRequest) {
  // For now, make authentication optional to allow testing
  // Remove this when ready to enforce authentication
  const REQUIRE_AUTH = process.env.REQUIRE_AUTH === "true";
  
  if (!REQUIRE_AUTH) {
    return NextResponse.next();
  }

  // Get session from cookies
  const sessionToken = req.cookies.get("mint-auth-session-token")?.value;
  const hasSession = !!sessionToken;

  // Define protected routes
  const isProtectedRoute = 
    req.nextUrl.pathname.startsWith("/app") ||
    req.nextUrl.pathname.startsWith("/api/chat");

  // Define public auth routes (must remain accessible)
  const isAuthRoute = req.nextUrl.pathname.startsWith("/api/auth");

  // If accessing protected route without session, redirect to login
  if (isProtectedRoute && !hasSession && !isAuthRoute) {
    const loginUrl = new URL("/login", req.url);
    // Store the original URL for redirect after login
    loginUrl.searchParams.set("redirect", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If accessing login/signup page while already authenticated, redirect to app
  if ((req.nextUrl.pathname.startsWith("/login") || 
       req.nextUrl.pathname.startsWith("/signup")) && hasSession) {
    return NextResponse.redirect(new URL("/app", req.url));
  }

  // Allow request to proceed
  return NextResponse.next();
}

/**
 * Configure which routes the middleware should run on
 */
export const config = {
  // Match all routes except for static files, images, and API routes that don't need auth
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder (public assets)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
