"use client";

import { useState, useCallback } from 'react';

interface FormState<T> {
  data: T;
  loading: boolean;
  error: string | null;
  success: boolean;
}

interface UseFormOptions<T> {
  initialValues: T;
  onSubmit: (values: T) => Promise<void | any>;
  validate?: (values: T) => Partial<Record<keyof T, string>>;
}

export function useForm<T extends Record<string, any>>({
  initialValues,
  onSubmit,
  validate,
}: UseFormOptions<T>) {
  const [state, setState] = useState<FormState<T>>({
    data: initialValues,
    loading: false,
    error: null,
    success: false,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  const updateField = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setState(prev => ({
      ...prev,
      data: {
        ...prev.data,
        [field]: value,
      },
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }
  }, [errors]);

  const touchField = useCallback(<K extends keyof T>(field: K) => {
    setTouched(prev => ({
      ...prev,
      [field]: true,
    }));
  }, []);

  const validateForm = useCallback((): boolean => {
    if (!validate) return true;

    const validationErrors = validate(state.data);
    setErrors(validationErrors);

    // Mark all fields as touched
    const allTouched: Partial<Record<keyof T, boolean>> = {};
    Object.keys(state.data).forEach(key => {
      allTouched[key as keyof T] = true;
    });
    setTouched(allTouched);

    return Object.keys(validationErrors).length === 0;
  }, [validate, state.data]);

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    // Validate before submit
    if (!validateForm()) {
      return;
    }

    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
      success: false,
    }));

    try {
      const result = await onSubmit(state.data);
      setState(prev => ({
        ...prev,
        loading: false,
        success: true,
      }));
      return result;
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err?.message || 'An unexpected error occurred',
      }));
      throw err;
    }
  }, [onSubmit, state.data, validateForm]);

  const reset = useCallback(() => {
    setState({
      data: initialValues,
      loading: false,
      error: null,
      success: false,
    });
    setErrors({});
    setTouched({});
  }, [initialValues]);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    success: state.success,
    errors,
    touched,
    updateField,
    touchField,
    handleSubmit,
    reset,
  };
}

export default useForm;
