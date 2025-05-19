// API route for verifying a session token
import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/firebase/firebase-admin.server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Get the session cookie
    const sessionCookie = request.cookies.get('firebase_auth')?.value;
    
    if (!sessionCookie) {
      return NextResponse.json({ 
        isAuthenticated: false,
        error: 'No session cookie found'
      }, { status: 401 });
    }
    
    // Verify the session cookie
    const decodedClaims = await verifySessionToken(sessionCookie);
    
    return NextResponse.json({ 
      isAuthenticated: true,
      uid: decodedClaims.uid,
      email: decodedClaims.email
    }, { status: 200 });
    
  } catch (error) {    console.error('Session verification error:', error);
    
    // Create a response and clear the invalid cookie
    const response = NextResponse.json({ 
      isAuthenticated: false,
      error: 'Invalid session'
    }, { status: 401 });
    
    response.cookies.delete('firebase_auth');
    return response;
  }
}
