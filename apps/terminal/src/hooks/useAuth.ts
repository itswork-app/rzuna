'use client';

/**
 * useAuth: Public hook for authentication state.
 * Refactored to use AuthProvider context for institutional-grade state sync.
 */
import { useAuthContext } from '@/components/AuthProvider';

export function useAuth() {
  return useAuthContext();
}
