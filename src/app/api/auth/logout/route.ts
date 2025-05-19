// API route for logging out and clearing the session cookie
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({ success: true }, { status: 200 });
    
    // Clear all potential auth cookies
    const cookiesToClear = ['firebase_auth', 'session', 'auth_token', '__session'];
    
    cookiesToClear.forEach(cookieName => {
      response.cookies.set(cookieName, '', { 
        expires: new Date(0),
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
    });
    
    // Also clear any localStorage items via client-side script
    response.headers.set('Set-Cookie', 'firebase_auth=deleted; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT');
    
    return response;
  } catch (error) {
    console.error('Error logging out:', error);
    return NextResponse.json({ error: 'Failed to logout' }, { status: 500 });
  }
}