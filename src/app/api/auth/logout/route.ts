// API route for logging out and clearing the session cookie
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  const isProduction = process.env.NODE_ENV === 'production';
  const isVercel = Boolean(process.env.VERCEL);
  
  console.log(`Processing logout request (env: ${isProduction ? 'production' : 'development'}, Vercel: ${isVercel ? 'yes' : 'no'})`);
  
  try {
    const response = NextResponse.json({ success: true }, { status: 200 });
    
    // Clear all potential auth cookies
    const cookiesToClear = ['firebase_auth', 'session', 'auth_token', '__session'];
    
    for (const cookieName of cookiesToClear) {
      // Log the cookie clearing
      console.log(`Clearing ${cookieName} cookie`);
      
      // Set expired cookie in response
      response.cookies.set(cookieName, '', { 
        expires: new Date(0),
        path: '/',
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict'
      });
      
      // Also try with Next.js cookies API
      try {
        // The cookies() function returns a promise in newer versions of Next.js
        const cookieStore = await cookies();
        if (cookieStore.has(cookieName)) {
          cookieStore.delete(cookieName);
        }
      } catch (cookieError) {
        console.warn(`Could not clear ${cookieName} with cookies API:`, cookieError);
        // Continue with the response.cookies method which should still work
      }
    }
    
    console.log('Logout completed successfully');
    return response;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    console.error('Error logging out:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : 'No stack trace available',
      environment: process.env.NODE_ENV || 'unknown',
      vercel: Boolean(process.env.VERCEL)
    });
    
    return NextResponse.json({ 
      error: 'Failed to logout',
      message: 'An unexpected error occurred while logging out'
    }, { status: 500 });
  }
}