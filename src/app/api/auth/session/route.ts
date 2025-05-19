// API route for creating a session with Firebase Auth
import { NextRequest, NextResponse } from 'next/server';
import { createSessionCookie } from '@/lib/firebase/firebase-admin.server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  const isProduction = process.env.NODE_ENV === 'production';
  const isVercel = Boolean(process.env.VERCEL);
  const vercelEnv = process.env.VERCEL_ENV || 'unknown';
  
  console.log(`Processing auth session request (env: ${isProduction ? 'production' : 'development'}, Vercel: ${isVercel ? vercelEnv : 'no'})`);
  
  try {
    // Get the ID token from the request body
    const { idToken } = await request.json().catch(error => {
      console.error('Failed to parse request JSON:', error);
      throw new Error('Invalid request format');
    });
    
    if (!idToken) {
      console.warn('Session creation attempt with no token provided');
      return NextResponse.json({ 
        error: 'No token provided',
        message: 'Authentication token is required'
      }, { status: 400 });
    }
    
    // Validate token format (basic check before sending to Firebase)
    if (typeof idToken !== 'string' || idToken.length < 100) {
      console.warn('Session creation attempt with invalid token format');
      return NextResponse.json({ 
        error: 'Invalid token format',
        message: 'The provided authentication token appears to be invalid'
      }, { status: 400 });
    }
    
    // Set session expiration to 5 days
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days in milliseconds
    
    console.log('Creating Firebase session cookie');
    
    // Create a session cookie with the ID token
    const sessionCookie = await createSessionCookie(idToken, expiresIn);
    
    // Additional check to ensure we have a valid session cookie
    if (!sessionCookie) {
      console.error('Failed to create session cookie: returned empty value');
      return NextResponse.json({ 
        error: 'Session creation failed',
        message: 'Could not create a valid session with the provided token'
      }, { status: 500 });
    }
    
    // Set the cookie
    console.log('Setting session cookie');
    cookies().set({
      name: 'firebase_auth',
      value: sessionCookie,
      maxAge: expiresIn / 1000, // Convert to seconds
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax'
    });
    
    console.log('Session cookie set successfully');
    return NextResponse.json({ success: true }, { status: 200 });  } catch (error: unknown) {
    // Enhanced error logging for better debugging
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode = error instanceof Error && 'code' in (error as {code?: string}) ? 
      (error as {code: string}).code : 'unknown';
    
    console.error('Error creating session:', {
      message: errorMessage,
      code: errorCode,
      stack: error instanceof Error ? error.stack : 'No stack trace available',
      environment: process.env.NODE_ENV || 'unknown',
      vercel: Boolean(process.env.VERCEL),
      vercelEnv: process.env.VERCEL_ENV || 'unknown'
    });
      // Return appropriate error based on error type and code
    if (errorMessage.includes('auth/invalid-id-token') || 
        errorMessage.includes('ID token') || 
        errorCode === 'auth/invalid-id-token') {
      return NextResponse.json({ 
        error: 'Invalid authentication token',
        message: 'The provided authentication token is invalid or expired',
        code: errorCode
      }, { status: 401 });
    }
    
    if (errorMessage.includes('auth/id-token-expired') || errorCode === 'auth/id-token-expired') {
      return NextResponse.json({ 
        error: 'Token expired',
        message: 'Your authentication session has expired, please sign in again',
        code: errorCode
      }, { status: 401 });
    }
    
    if (errorMessage.includes('network') || 
        errorMessage.includes('connection') || 
        errorCode === 'auth/network-request-failed') {
      return NextResponse.json({ 
        error: 'Service unavailable',
        message: 'Authentication service is currently unavailable',
        code: errorCode
      }, { status: 503 });
    }
    
    // Check for Firebase Admin initialization issues that might occur in production
    if (errorMessage.includes('app/no-app') || 
        errorMessage.includes('failed to initialize') ||
        errorMessage.includes('not been initialized')) {
      console.error('Critical: Firebase Admin initialization issue detected');
      
      return NextResponse.json({ 
        error: 'Configuration error',
        message: 'The authentication service is improperly configured',
        code: 'server/misconfiguration'
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      error: 'Authentication failed',
      message: 'Failed to create session',
      code: errorCode
    }, { status: 401 });
  }
}
