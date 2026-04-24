/**
 * API Response Types
 */
export interface ApiSuccess<T = any> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: any;
    field?: string;
  };
}

export type ApiResponse<T = any> = ApiSuccess<T> | ApiError;

/**
 * API Error Class
 */
export class ApiErrorClass extends Error {
  public statusCode: number;
  public code?: string;
  public details?: any;
  public field?: string;

  constructor(message: string, statusCode: number = 500, code?: string, details?: any, field?: string) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.field = field;
  }
}

/**
 * Handle API fetch with error handling
 */
export async function fetchApi<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: {
          message: data?.message || data?.error || 'Request failed',
          code: data?.code,
          details: data?.details,
          field: data?.field,
        },
      };
    }

    return {
      success: true,
      data: data?.data || data,
      message: data?.message,
    };
  } catch (error: any) {
    return {
      success: false,
      error: {
        message: error?.message || 'Network error occurred',
      },
    };
  }
}

/**
 * Fetch with loading and error states
 */
export async function fetchWithLoading<T = any>(
  url: string,
  setState: (state: { loading: boolean; error: string | null; data: T | null }) => void,
  options: RequestInit = {}
): Promise<T | null> {
  setState({ loading: true, error: null, data: null });

  try {
    const response = await fetchApi<T>(url, options);

    if (!response.success) {
      setState({
        loading: false,
        error: response.error.message,
        data: null,
      });
      return null;
    }

    setState({
      loading: false,
      error: null,
      data: response.data,
    });

    return response.data;
  } catch (error: any) {
    setState({
      loading: false,
      error: error?.message || 'An unexpected error occurred',
      data: null,
    });
    return null;
  }
}

/**
 * Mutate data with loading and error states
 */
export async function mutateData<T = any>(
  method: 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  url: string,
  body?: any,
  setState?: (state: { loading: boolean; error: string | null; success: boolean }) => void
): Promise<ApiResponse<T>> {
  if (setState) {
    setState({ loading: true, error: null, success: false });
  }

  try {
    const response = await fetchApi<T>(url, {
      method,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.success) {
      if (setState) {
        setState({ loading: false, error: response.error.message, success: false });
      }
      return response;
    }

    if (setState) {
      setState({ loading: false, error: null, success: true });
    }

    return response;
  } catch (error: any) {
    const errorResponse: ApiError = {
      success: false,
      error: {
        message: error?.message || 'Mutation failed',
      },
    };

    if (setState) {
      setState({ loading: false, error: error.message, success: false });
    }

    return errorResponse;
  }
}

/**
 * Extract field error from API error response
 */
export function getFieldError(error: string | null, fieldName: string): string | undefined {
  if (!error) return undefined;
  
  try {
    const parsed = JSON.parse(error);
    return parsed?.fieldErrors?.[fieldName]?.[0] || parsed?.message;
  } catch {
    return error.includes(fieldName) ? error : undefined;
  }
}

export default {
  fetchApi,
  fetchWithLoading,
  mutateData,
  getFieldError,
};
