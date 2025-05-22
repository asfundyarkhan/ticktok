// Middleware to protect authenticated routes
import { NextRequest, NextResponse } from 'next/server';

// Paths that require authentication
const protectedPaths = [
  '/dashboard',
  '/profile',
  '/wallet',
  '/checkout',
  '/admin',
  '/store/manage', // Protected store management paths
];

// Paths that are for non-authenticated users only (like login page)
const authOnlyPaths = [
  '/login',
  '/register',
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
];

// Public store paths that don't require auth
const publicStorePaths = [
  '/store',
  '/products',
  '/categories',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if path requires authentication
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));
  const isAuthOnlyPath = authOnlyPaths.some(path => pathname === path);
  const isPublicStorePath = publicStorePaths.some(path => pathname.startsWith(path));
  
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
      // Redirect to dashboard and let client-side AuthRedirect handle the role-based redirection
      // This ensures that the full authentication context is available
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  } else if (!isPublicStorePath && !isAuthOnlyPath) {
    // No session and not accessing public or auth pages, redirect to login
    const url = new URL('/login', request.url);
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
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
    '/store/manage/:path*',
    
    // Auth-only paths
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/login',
    '/register',

    // Public store paths
    '/store/:path*',
    '/products/:path*',
    '/categories/:path*',
  ],
};
