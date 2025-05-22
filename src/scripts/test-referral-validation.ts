// Referral Code Validation Test Script
// Run this script to check if the referral code validation is working correctly

import { UserService } from '../services/userService';

async function testReferralCodeValidation() {
  console.log('Starting referral code validation test...');
  
  try {
    // 1. Get all existing referral codes
    const allCodes = await UserService.getAllReferralCodes();
    console.log(`Found ${allCodes.length} referral codes in the system:`);
    allCodes.forEach(code => {
      console.log(`- User: ${code.email} (${code.role}), Code: ${code.referralCode}`);
    });
    
    // 2. Test validation for each code
    console.log('\nTesting validation for each code:');
    for (const code of allCodes) {
      const result = await UserService.validateReferralCode(code.referralCode);
      console.log(`Code: ${code.referralCode}, Valid: ${result.isValid}, Admin: ${result.adminUid || 'N/A'}`);
      
      // Extra check to ensure code belongs to admin
      if (result.isValid && code.role !== 'admin' && code.role !== 'superadmin') {
        console.warn(`WARNING: Valid code ${code.referralCode} belongs to non-admin user ${code.email} with role ${code.role}`);
      }
      
      if (!result.isValid && (code.role === 'admin' || code.role === 'superadmin')) {
        console.warn(`WARNING: Admin code ${code.referralCode} failed validation for user ${code.email}`);
      }
    }
    
    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('Error during test:', error);
  }
}

// Use this directly in a Node.js script or expose as an API endpoint
export { testReferralCodeValidation };
