'use client';

import { useFormState } from 'react-dom';
import type { AuthActionState } from '@/lib/auth/actions';

export const initialAuthState: AuthActionState = {};

export function useAuthFormState(action: (
  state: AuthActionState,
  formData: FormData
) => Promise<AuthActionState>) {
  return useFormState(action, initialAuthState);
}
