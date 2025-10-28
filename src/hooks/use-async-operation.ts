import React, { useState, useCallback, useRef } from "react";
import { handleClientError, ClientError } from "@/utils/client-error-handler";
import { toast } from "sonner";

interface UseAsyncOperationOptions<T = unknown> {
  onSuccess?: (data: T) => void;
  onError?: (error: ClientError) => void;
  successMessage?: string;
  errorMessage?: string;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}

interface AsyncOperationState<T = unknown> {
  loading: boolean;
  data: T | null;
  error: ClientError | null;
  success: boolean;
}

export function useAsyncOperation<T = unknown>(options: UseAsyncOperationOptions<T> = {}) {
  const [state, setState] = useState<AsyncOperationState<T>>({
    loading: false,
    data: null,
    error: null,
    success: false,
  });

  const mountedRef = useRef(true);

  const execute = useCallback(async (
    operation: () => Promise<T>,
    customOptions?: UseAsyncOperationOptions<T>
  ) => {
    const finalOptions = { ...options, ...customOptions };

    // Prevent state updates if component is unmounted
    if (!mountedRef.current) return;

    setState(prev => ({ ...prev, loading: true, error: null, success: false }));

    try {
      const result = await operation();

      if (!mountedRef.current) return;

      setState({
        loading: false,
        data: result,
        error: null,
        success: true,
      });

      // Show success message if provided
      if (finalOptions.successMessage && finalOptions.showSuccessToast !== false) {
        toast.success(finalOptions.successMessage);
      }

      // Call success callback if provided
      if (finalOptions.onSuccess) {
        finalOptions.onSuccess(result);
      }

      return result;
    } catch (error) {
      if (!mountedRef.current) return;

      const errorInfo = handleClientError(error, {
        showToast: finalOptions.showErrorToast !== false,
        customMessage: finalOptions.errorMessage,
      });

      setState({
        loading: false,
        data: null,
        error: errorInfo.originalError,
        success: false,
      });

      // Call error callback if provided
      if (finalOptions.onError) {
        finalOptions.onError(errorInfo.originalError);
      }

      throw error;
    }
  }, [options]);

  const reset = useCallback(() => {
    setState({
      loading: false,
      data: null,
      error: null,
      success: false,
    });
  }, []);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}

// Specific hook for database operations
export function useDatabaseOperation<T = unknown>(options: UseAsyncOperationOptions<T> = {}) {
  return useAsyncOperation<T>({
    errorMessage: "Database operation failed",
    ...options,
  });
}

// Specific hook for authentication operations
export function useAuthOperation<T = unknown>(options: UseAsyncOperationOptions<T> = {}) {
  return useAsyncOperation<T>({
    errorMessage: "Authentication operation failed",
    showErrorToast: true,
    showSuccessToast: true,
    ...options,
  });
}

// Hook for optimistic updates
export function useOptimisticUpdate<T = unknown>(
  updateFunction: () => Promise<T>,
  optimisticData: T,
  options: UseAsyncOperationOptions<T> = {}
) {
  const [optimisticState, setOptimisticState] = useState<{
    isOptimistic: boolean;
    data: T | null;
  }>({
    isOptimistic: false,
    data: null,
  });

  const { execute, reset, ...operationState } = useAsyncOperation({
    errorMessage: "Update failed",
    ...options,
  });

  const executeOptimistic = useCallback(async () => {
    // Set optimistic state immediately
    setOptimisticState({
      isOptimistic: true,
      data: optimisticData,
    });

    try {
      const result = await execute(updateFunction);
      setOptimisticState({
        isOptimistic: false,
        data: null,
      });
      return result;
    } catch (error) {
      // Reset optimistic state on error
      setOptimisticState({
        isOptimistic: false,
        data: null,
      });
      throw error;
    }
  }, [execute, updateFunction, optimisticData]);

  const currentData = optimisticState.isOptimistic
    ? optimisticState.data
    : operationState.data;

  return {
    ...operationState,
    data: currentData,
    isOptimistic: optimisticState.isOptimistic,
    execute: executeOptimistic,
    reset: () => {
      reset();
      setOptimisticState({ isOptimistic: false, data: null });
    },
  };
}