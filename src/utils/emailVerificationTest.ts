// Email Verification Tests
import { sendEmailVerification } from 'firebase/auth';
import { auth } from '../lib/firebase/firebase';

/**
 * Tests the Firebase email verification configuration
 * by attempting to send a verification email to the current user.
 * 
 * @returns Promise that resolves with the result of the test
 */
export async function testEmailVerification() {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      return {
        success: false,
        message: 'No user is currently logged in. Please sign in first.'
      };
    }
    
    if (currentUser.emailVerified) {
      return {
        success: true,
        message: 'User email is already verified.',
        user: {
          uid: currentUser.uid,
          email: currentUser.email,
          emailVerified: currentUser.emailVerified
        }
      };
    }
    
    // Attempt to send a verification email
    await sendEmailVerification(currentUser);
    
    return {
      success: true,
      message: 'Verification email sent successfully.',
      user: {
        uid: currentUser.uid,
        email: currentUser.email,
        emailVerified: currentUser.emailVerified
      }
    };
    
  } catch (error) {
    console.error('Email verification test failed:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      error: error
    };
  }
}

/**
 * Function to check Firebase configuration for email verification
 * 
 * @returns Object containing configuration check results
 */
export function checkEmailVerificationConfig() {
  const config = {
    authDomain: auth.config.authDomain,
    apiKey: auth.app.options.apiKey ? 'Valid' : 'Missing',
    emulator: auth.app.options.emulator !== undefined
  };
  
  // Check domain configuration
  const isCustomDomain = config.authDomain !== auth.app.options.projectId + '.firebaseapp.com';
  
  return {
    success: true,
    config,
    recommendations: {
      customDomain: isCustomDomain ? 
        'You are using a custom domain which is good for verification emails.' :
        'Consider setting up a custom authentication domain for better deliverability.',
      whitelisting: 'Ensure your email service provider whitelists emails from firebase.com',
      spamFilters: 'Ask users to check spam folders if they don\'t receive verification emails'
    }
  };
}

export default { testEmailVerification, checkEmailVerificationConfig };
