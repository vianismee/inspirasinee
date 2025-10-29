export interface EnvironmentCheck {
  NEXT_PUBLIC_SUPABASE_URL: {
    exists: boolean;
    value: string;
    length: number;
    validFormat: boolean;
  };
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: {
    exists: boolean;
    value: string;
    length: number;
    validFormat: boolean;
  };
  NEXT_PUBLIC_APP_ENV: {
    exists: boolean;
    value: string;
    length: number;
  };
}

export interface EnvironmentValidationResult {
  timestamp: string;
  environment: {
    node_env: string;
    app_env: string;
    is_production: boolean;
    is_development: boolean;
  };
  variables: EnvironmentCheck;
  summary: {
    allRequiredVarsSet: boolean;
    supabaseConfigured: boolean;
    environmentDetected: boolean;
  };
  issues: string[];
}

export function validateEnvironment(): EnvironmentValidationResult {
  const result: EnvironmentValidationResult = {
    timestamp: new Date().toISOString(),
    environment: {
      node_env: typeof window !== 'undefined' ? 'client' : 'server',
      app_env: process.env.NEXT_PUBLIC_APP_ENV || 'unknown',
      is_production: process.env.NEXT_PUBLIC_APP_ENV === 'production',
      is_development: process.env.NEXT_PUBLIC_APP_ENV === 'development'
    },
    variables: {
      NEXT_PUBLIC_SUPABASE_URL: {
        exists: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        value: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT_SET',
        length: process.env.NEXT_PUBLIC_SUPABASE_URL?.length || 0,
        validFormat: false
      },
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: {
        exists: !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
        value: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ? 'SET' : 'NOT_SET',
        length: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.length || 0,
        validFormat: false
      },
      NEXT_PUBLIC_APP_ENV: {
        exists: !!process.env.NEXT_PUBLIC_APP_ENV,
        value: process.env.NEXT_PUBLIC_APP_ENV || 'NOT_SET',
        length: process.env.NEXT_PUBLIC_APP_ENV?.length || 0
      }
    },
    summary: {
      allRequiredVarsSet: false,
      supabaseConfigured: false,
      environmentDetected: false
    },
    issues: []
  };

  // Validate Supabase URL format
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
      result.variables.NEXT_PUBLIC_SUPABASE_URL.validFormat =
        url.protocol === 'https:' &&
        url.hostname.includes('supabase');
    } catch {
      result.variables.NEXT_PUBLIC_SUPABASE_URL.validFormat = false;
      result.issues.push('NEXT_PUBLIC_SUPABASE_URL is not a valid URL');
    }
  } else {
    result.issues.push('NEXT_PUBLIC_SUPABASE_URL is not set');
  }

  // Validate Supabase publishable key format (basic JWT check)
  if (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    try {
      const parts = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.split('.');
      result.variables.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.validFormat = parts.length === 3;
      if (!result.variables.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.validFormat) {
        result.issues.push('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY does not appear to be a valid JWT token');
      }
    } catch {
      result.variables.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.validFormat = false;
      result.issues.push('Error parsing NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
    }
  } else {
    result.issues.push('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is not set');
  }

  // Check if environment is properly detected
  if (!process.env.NEXT_PUBLIC_APP_ENV) {
    result.issues.push('NEXT_PUBLIC_APP_ENV is not set');
  }

  // Calculate summary
  result.summary.allRequiredVarsSet =
    result.variables.NEXT_PUBLIC_SUPABASE_URL.exists &&
    result.variables.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.exists &&
    result.variables.NEXT_PUBLIC_APP_ENV.exists;

  result.summary.supabaseConfigured =
    result.variables.NEXT_PUBLIC_SUPABASE_URL.exists &&
    result.variables.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.exists &&
    result.variables.NEXT_PUBLIC_SUPABASE_URL.validFormat &&
    result.variables.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.validFormat;

  result.summary.environmentDetected = !!process.env.NEXT_PUBLIC_APP_ENV;

  return result;
}

export function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

export function getDeviceInfo() {
  if (typeof window === 'undefined') {
    return { platform: 'server', userAgent: 'N/A' };
  }

  return {
    platform: navigator.platform,
    userAgent: navigator.userAgent,
    language: navigator.language,
    cookieEnabled: navigator.cookieEnabled,
    onLine: navigator.onLine
  };
}