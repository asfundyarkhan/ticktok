// Middleware to protect authenticated routes
import { NextRequest, NextResponse } from 'next/server';

// Paths that require authentication
const protectedPaths = [
  '/dashboard',
  '/profile',
  '/wallet',
  '/checkout',
  '/admin',
];

// Paths that are for non-authenticated users only (like login page)
const authOnlyPaths = [
  '/login',
  '/register',
  '/auth/forgot-password',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if path requires authentication
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));
  const isAuthOnlyPath = authOnlyPaths.some(path => pathname === path);
  
  // Get the session cookie
  const sessionCookie = request.cookies.get('firebase_auth')?.value;
    // If no session cookie and trying to access protected path
  if (isProtectedPath && !sessionCookie) {
    const url = new URL('/login', request.url);
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }
  
  // If session cookie exists (user is logged in)
  if (sessionCookie) {
    // If trying to access auth-only pages like login when already logged in
    if (isAuthOnlyPath) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    
    // Note: We're not verifying the token in middleware anymore (leaving that to the API)
    // This is to avoid using Firebase Admin in Edge Runtime
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Protect these paths
    '/dashboard/:path*',
    '/profile/:path*',
    '/wallet/:path*',
    '/checkout/:path*',
    '/admin/:path*',
    
    // Auth-only paths
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/login',
    '/register',
  ],
};
