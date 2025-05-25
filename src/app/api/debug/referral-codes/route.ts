import { NextResponse } from 'next/server';
import { UserService } from '@/services/userService';

// This API is only for development/debugging purposes
// It should be disabled or protected in production
export async function GET() {
  try {
    const codes = await UserService.getAllReferralCodes();
    return NextResponse.json({ success: true, codes });
  } catch (error) {
    console.error('Error fetching referral codes:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch referral codes' },
      { status: 500 }
    );
  }
}
