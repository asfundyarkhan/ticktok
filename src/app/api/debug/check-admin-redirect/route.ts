import { NextRequest, NextResponse } from "next/server";

/**
 * API route to check admin role redirection.
 * This helps diagnose issues with admin redirection in production.
 * 
 * @param request The Next.js API request
 * @returns A JSON response with debugging information
 */
export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin') || request.headers.get('host') || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  // Get environment information
  const isProduction = process.env.NODE_ENV === 'production';
  const isVercel = Boolean(process.env.VERCEL);
  const vercelEnv = process.env.VERCEL_ENV || 'unknown';
  
  // Get the current URL path to help with debugging
  const url = new URL(request.url);
  const path = url.pathname;
  
  // Check for admin-related cookie (doesn't access actual content)
  const hasCookie = Boolean(request.cookies.get('firebase_auth')?.value);

  return NextResponse.json({
    debug: {
      environment: process.env.NODE_ENV || 'unknown',
      isProduction,
      isVercel,
      vercelEnv,
      host: origin,
      userAgent,
      path,
      timestamp: new Date().toISOString(),
      hasCookie
    },
    message: 'This endpoint helps diagnose admin redirection issues. If you can see this, your API routes are working.'
  }, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    }
  });
}
