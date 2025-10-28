import { toast } from "sonner";
import { PostgrestError, AuthError } from "@supabase/supabase-js";

// Error types for client-side operations
export type ClientError = PostgrestError | AuthError | Error | unknown;

export interface ErrorHandlerOptions {
  showToast?: boolean;
  logToConsole?: boolean;
  customMessage?: string;
  fallbackMessage?: string;
}

/**
 * Main error handler for client-side operations
 */
export const handleClientError = (
  error: ClientError,
  options: ErrorHandlerOptions = {}
) => {
  const {
    showToast = true,
    logToConsole = true,
    customMessage,
    fallbackMessage = "An unexpected error occurred",
  } = options;

  // Log to console if enabled
  if (logToConsole) {
    console.error("Client error:", error);
  }

  // Determine error message
  let errorMessage = fallbackMessage;

  if (customMessage) {
    errorMessage = customMessage;
  } else if (error && typeof error === 'object' && 'message' in error) {
    errorMessage = error.message as string;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  // Show toast notification if enabled
  if (showToast) {
    toast.error(errorMessage);
  }

  return {
    message: errorMessage,
    originalError: error,
  };
};

/**
 * Handle Supabase database errors with specific error types
 */
export const handleDatabaseError = (
  error: PostgrestError | null,
  operation: string
) => {
  if (!error) return null;

  const errorMap: Record<string, string> = {
    'PGRST116': 'Record not found',
    'PGRST301': 'Permission denied',
    '23505': 'Record already exists',
    '23503': 'Referenced record not found',
    '23514': 'Check constraint violation',
    '22001': 'String data right truncation',
    '22004': 'Null value not allowed',
  };

  const errorMessage = errorMap[error.code] || error.message || 'Database operation failed';

  console.error(`Database error during ${operation}:`, error);
  toast.error(`${operation} failed: ${errorMessage}`);

  return {
    message: errorMessage,
    code: error.code,
    details: error.details,
    hint: error.hint,
  };
};

/**
 * Handle authentication errors with specific messaging
 */
export const handleAuthError = (error: AuthError | null, operation: string) => {
  if (!error) return null;

  const authErrorMap: Record<string, string> = {
    'invalid_credentials': 'Invalid email or password',
    'email_not_confirmed': 'Please confirm your email address',
    'weak_password': 'Password is too weak',
    'user_already_exists': 'An account with this email already exists',
    'session_expired': 'Your session has expired, please sign in again',
    'access_denied': 'Access denied',
    'signup_disabled': 'Sign up is currently disabled',
    'email_address_invalid': 'Invalid email address format',
    'password_too_short': 'Password is too short',
  };

  const errorMessage = authErrorMap[error.message.toLowerCase()] || error.message;

  console.error(`Auth error during ${operation}:`, error);
  toast.error(`${operation} failed: ${errorMessage}`);

  return {
    message: errorMessage,
    status: error.status,
  };
};

/**
 * Handle network errors
 */
export const handleNetworkError = (error: unknown, operation: string) => {
  if (error instanceof TypeError && error.message.includes('fetch')) {
    const errorMessage = 'Network connection error. Please check your internet connection.';
    console.error(`Network error during ${operation}:`, error);
    toast.error(errorMessage);
    return { message: errorMessage, type: 'network' };
  }

  return handleClientError(error, {
    customMessage: `${operation} failed due to network issues`,
  });
};

/**
 * Handle loading states with error recovery
 */
export const handleAsyncOperation = async <T>(
  operation: () => Promise<T>,
  options: {
    loadingMessage?: string;
    successMessage?: string;
    errorMessage?: string;
    showSuccessToast?: boolean;
  } = {}
): Promise<{ data?: T; error?: ClientError; success: boolean }> => {
  const {
    loadingMessage,
    successMessage,
    errorMessage,
    showSuccessToast = true,
  } = options;

  try {
    // Show loading toast if provided
    if (loadingMessage) {
      toast.loading(loadingMessage);
    }

    const result = await operation();

    // Show success toast if provided
    if (successMessage && showSuccessToast) {
      toast.success(successMessage);
    }

    return { data: result, success: true };
  } catch (error) {
    handleClientError(error, {
      customMessage: errorMessage,
      showToast: true,
      logToConsole: true,
    });

    return { error, success: false };
  }
};

/**
 * Create a retry mechanism for failed operations
 */
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: ClientError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries) {
        break;
      }

      console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }

  throw lastError!;
};