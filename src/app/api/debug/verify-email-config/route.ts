import { NextResponse } from "next/server";
import { checkEmailVerificationConfig } from "@/utils/emailVerificationTest";

// This is a diagnostic endpoint that can only be used in development mode
export async function GET() {
  // Only allow in development environment
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "This endpoint is only available in development mode" },
      { status: 403 }
    );
  }

  try {
    const configCheck = checkEmailVerificationConfig();

    return NextResponse.json({
      success: true,
      emailVerificationConfig: configCheck,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV || "not set",
        hasAuthDomain: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      },
    });
  } catch (error) {
    console.error("Error checking email verification config:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
