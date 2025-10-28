import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Check all relevant environment variables
    const envCheck = {
      NEXT_PUBLIC_SUPABASE_URL: {
        exists: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        value: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT_SET',
        length: process.env.NEXT_PUBLIC_SUPABASE_URL?.length || 0
      },
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: {
        exists: !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
        value: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ? 'SET' : 'NOT_SET',
        length: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.length || 0
      },
      SUPABASE_SERVICE_ROLE_KEY: {
        exists: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        value: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT_SET',
        length: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0
      },
      NEXT_PUBLIC_APP_ENV: {
        exists: !!process.env.NEXT_PUBLIC_APP_ENV,
        value: process.env.NEXT_PUBLIC_APP_ENV || 'NOT_SET',
        length: process.env.NEXT_PUBLIC_APP_ENV?.length || 0
      },
      NODE_ENV: {
        exists: !!process.env.NODE_ENV,
        value: process.env.NODE_ENV || 'NOT_SET',
        length: process.env.NODE_ENV?.length || 0
      },
      VERCEL_ENV: {
        exists: !!process.env.VERCEL_ENV,
        value: process.env.VERCEL_ENV || 'NOT_SET',
        length: process.env.VERCEL_ENV?.length || 0
      }
    };

    // Test if the service role key is properly formatted (basic JWT check)
    let serviceKeyFormat = 'UNKNOWN';
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const parts = process.env.SUPABASE_SERVICE_ROLE_KEY.split('.');
        if (parts.length === 3) {
          serviceKeyFormat = 'VALID_JWT_FORMAT';
        } else {
          serviceKeyFormat = 'INVALID_JWT_FORMAT';
        }
      } catch (error) {
        serviceKeyFormat = 'PARSE_ERROR';
      }
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: {
        node_env: process.env.NODE_ENV,
        vercel_env: process.env.VERCEL_ENV,
        app_env: process.env.NEXT_PUBLIC_APP_ENV
      },
      variables: envCheck,
      serviceKeyFormat,
      summary: {
        allRequiredVarsSet:
          envCheck.NEXT_PUBLIC_SUPABASE_URL.exists &&
          envCheck.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.exists &&
          envCheck.SUPABASE_SERVICE_ROLE_KEY.exists &&
          envCheck.NEXT_PUBLIC_APP_ENV.exists,
        serviceKeyAvailable: envCheck.SUPABASE_SERVICE_ROLE_KEY.exists,
        serviceKeyFormatValid: serviceKeyFormat === 'VALID_JWT_FORMAT'
      }
    });

  } catch (error) {
    console.error("Environment check error:", error);
    return NextResponse.json({
      error: "Environment check failed",
      message: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}