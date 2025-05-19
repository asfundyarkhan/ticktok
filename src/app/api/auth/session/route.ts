// API route for creating a session with Firebase Auth
import { NextRequest, NextResponse } from 'next/server';
import { createSessionCookie } from '@/lib/firebase/firebase-admin.server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    // Get the ID token from the request body
    const { idToken } = await request.json();
    
    if (!idToken) {
      return NextResponse.json({ error: 'No token provided' }, { status: 400 });
    }
    
    // Set session expiration to 5 days
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days in milliseconds
    
    // Create a session cookie with the ID token
    const sessionCookie = await createSessionCookie(idToken, expiresIn);
    
    // Set the cookie
    cookies().set({
      name: 'firebase_auth',
      value: sessionCookie,
      maxAge: expiresIn / 1000, // Convert to seconds
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax'
    });
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 401 });
  }
}
