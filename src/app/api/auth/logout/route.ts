// API route for logging out and clearing the session cookie
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  const isProduction = process.env.NODE_ENV === 'production';
  const isVercel = Boolean(process.env.VERCEL);
  
  console.log(`Processing logout request (env: ${isProduction ? 'production' : 'development'}, Vercel: ${isVercel ? 'yes' : 'no'})`);
  
  try {
    const response = NextResponse.json({ success: true }, { status: 200 });
    
    // Clear all potential auth cookies
    const cookiesToClear = ['firebase_auth', 'session', 'auth_token', '__session'];
    
    cookiesToClear.forEach(cookieName => {
      // Log the cookie clearing
      console.log(`Clearing ${cookieName} cookie`);
      
      response.cookies.set(cookieName, '', { 
        expires: new Date(0),
        path: '/',
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict'
      });
      
      // Also try with Next.js cookies API as a backup method
      try {
        cookies().set({
          name: cookieName,
          value: '',
          expires: new Date(0),
          path: '/',
          httpOnly: true,
          secure: isProduction,
          sameSite: 'strict'
        });
      } catch (cookieError) {
        console.warn(`Could not clear ${cookieName} with cookies() API:`, cookieError);
        // Continue with the response.cookies method which should still work
      }
    });
    
    // Also clear any localStorage items via client-side script
    response.headers.set('Set-Cookie', 'firebase_auth=deleted; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT');
    
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