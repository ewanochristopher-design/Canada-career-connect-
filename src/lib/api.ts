import type { WorkPermitSupport } from '../types.ts';

const TOKEN_KEY = 'ccc_auth_token';

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // Ignore storage errors in restricted contexts
  }
}

export async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };

  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error || `Request failed (${res.status})`);
    }
    return data as T;
  }

  if (!res.ok) {
    throw new Error(`Request failed (${res.status})`);
  }
  return (await res.text()) as unknown as T;
}

export function formatJobSalary(
  minCad: number,
  maxCad: number,
  unit: 'hour' | 'year',
  currency: 'CAD' | 'KES',
  cadToKesRate: number
): string {
  if (currency === 'KES') {
    const minKes = Math.round(minCad * cadToKesRate).toLocaleString();
    const maxKes = Math.round(maxCad * cadToKesRate).toLocaleString();
    return `KES ${minKes} – ${maxKes}/${unit === 'hour' ? 'hr' : 'yr'}`;
  }
  if (unit === 'year') {
    return `CAD $${minCad.toLocaleString()} – $${maxCad.toLocaleString()}/yr`;
  }
  return `CAD $${minCad} – $${maxCad}/hr`;
}

export function getWorkPermitBadge(support: WorkPermitSupport): {
  label: string;
  className: string;
} {
  switch (support) {
    case 'lmia_verified':
      return {
        label: 'LMIA / Work Permit Verified',
        className: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      };
    case 'employer_supported_case_by_case':
      return {
        label: 'Case-by-Case Sponsorship',
        className: 'bg-amber-50 text-amber-800 border-amber-200',
      };
    case 'no_sponsorship_verified':
    default:
      return {
        label: 'No Sponsorship (Canadian Permit Req.)',
        className: 'bg-slate-100 text-slate-700 border-slate-200',
      };
  }
}

export const CANADIAN_PROVINCES = [
  'Ontario',
  'Alberta',
  'British Columbia',
  'Manitoba',
  'Saskatchewan',
  'Nova Scotia',
  'New Brunswick',
  'Quebec',
  'Prince Edward Island',
  'Newfoundland and Labrador',
] as const;
