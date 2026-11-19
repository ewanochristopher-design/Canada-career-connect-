import React, { useState } from 'react';
import { Building2, KeyRound, Loader2, Shield, UserCheck, X } from 'lucide-react';
import { apiFetch, CANADIAN_PROVINCES, setAuthToken } from '../lib/api.ts';
import type { PublicUser } from '../types.ts';

interface AuthModalProps {
  initialMode: 'login' | 'register';
  onClose: () => void;
  onSuccess: (user: PublicUser, profileStrength: number) => void;
}

interface AuthResponse {
  token: string;
  user: PublicUser;
  profileStrength: number;
}

const DEMO_ACCOUNTS = [
  {
    label: 'Applicant (Amina)',
    email: 'amina.wanjiku@example.com',
    pass: 'DemoPass123!',
  },
  {
    label: 'Employer (MapleCare)',
    email: 'hr@maplehealth.example.ca',
    pass: 'DemoPass123!',
  },
  {
    label: 'Advisor (Grace)',
    email: 'grace.otieno@canadacareerconnect.example',
    pass: 'DemoPass123!',
  },
  {
    label: 'Admin (Daniel)',
    email: 'admin@canadacareerconnect.example',
    pass: 'AdminPass123!',
  },
];

export const AuthModal: React.FC<AuthModalProps> = ({ initialMode, onClose, onSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'reset'>(initialMode);
  const [role, setRole] = useState<'applicant' | 'employer'>('applicant');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('Kenya');
  const [companyName, setCompanyName] = useState('');
  const [companyProvince, setCompanyProvince] = useState('Ontario');
  const [companyCity, setCompanyCity] = useState('Toronto');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);
    try {
      if (mode === 'login') {
        const res = await apiFetch<AuthResponse>('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });
        setAuthToken(res.token);
        onSuccess(res.user, res.profileStrength);
      } else if (mode === 'register') {
        const res = await apiFetch<AuthResponse>('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            fullName,
            email,
            password,
            role,
            phone,
            country: role === 'employer' ? 'Canada' : country,
            companyName: role === 'employer' ? companyName : undefined,
            companyProvince: role === 'employer' ? companyProvince : undefined,
            companyCity: role === 'employer' ? companyCity : undefined,
          }),
        });
        setAuthToken(res.token);
        onSuccess(res.user, res.profileStrength);
      } else {
        const res = await apiFetch<{ ok: boolean; message: string }>('/api/auth/reset-password', {
          method: 'POST',
          body: JSON.stringify({ email, newPassword }),
        });
        setInfo(res.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#071B33]/65 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-display text-xl font-extrabold text-[#071B33]">
              {mode === 'login'
                ? 'Sign In to Your Portal'
                : mode === 'register'
                  ? 'Create Free Account'
                  : 'Reset Password'}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Access job tracking, advisor messages, CV vault, or employer publishing.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError('');
            }}
            className={`flex-1 rounded-lg py-2 transition ${
              mode === 'login' ? 'bg-white text-[#071B33] shadow-sm' : 'text-slate-600'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError('');
            }}
            className={`flex-1 rounded-lg py-2 transition ${
              mode === 'register' ? 'bg-white text-[#071B33] shadow-sm' : 'text-slate-600'
            }`}
          >
            Register Free
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('reset');
              setError('');
            }}
            className={`flex-1 rounded-lg py-2 transition ${
              mode === 'reset' ? 'bg-white text-[#071B33] shadow-sm' : 'text-slate-600'
            }`}
          >
            Reset Password
          </button>
        </div>

        {mode === 'login' && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <Shield className="h-3.5 w-3.5 text-[#D62839]" />
              Quick Demo Role Sign-In (Sample Accounts)
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => {
                    setEmail(acc.email);
                    setPassword(acc.pass);
                  }}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-left text-[11px] font-semibold text-[#071B33] hover:border-[#071B33]"
                >
                  {acc.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-medium text-red-700">
            {error}
          </div>
        )}
        {info && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-medium text-emerald-800">
            {info}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          {mode === 'register' && (
            <>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Account Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('applicant')}
                    className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold ${
                      role === 'applicant'
                        ? 'border-[#071B33] bg-[#071B33] text-white'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    <UserCheck className="h-4 w-4" />
                    Job Applicant
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('employer')}
                    className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold ${
                      role === 'employer'
                        ? 'border-[#071B33] bg-[#071B33] text-white'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    <Building2 className="h-4 w-4" />
                    Canadian Employer
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g., David Kamau"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-[#071B33] focus:outline-none"
                />
              </div>
            </>
          )}

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-[#071B33] focus:outline-none"
            />
          </div>

          {mode !== 'reset' && (
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-[#071B33] focus:outline-none"
              />
            </div>
          )}

          {mode === 'reset' && (
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                New Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 6 characters)"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-[#071B33] focus:outline-none"
              />
            </div>
          )}

          {mode === 'register' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Phone / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+254 7XX XXX XXX"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-[#071B33] focus:outline-none"
                  />
                </div>
                {role === 'applicant' ? (
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Country of Residence
                    </label>
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="Kenya"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-[#071B33] focus:outline-none"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Company Name
                    </label>
                    <input
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Maple Logistics Inc."
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-[#071B33] focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {role === 'employer' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Province
                    </label>
                    <select
                      value={companyProvince}
                      onChange={(e) => setCompanyProvince(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-[#071B33] focus:outline-none"
                    >
                      {CANADIAN_PROVINCES.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">City</label>
                    <input
                      type="text"
                      value={companyCity}
                      onChange={(e) => setCompanyCity(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-[#071B33] focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#D62839] py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#B81F2E] disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <KeyRound className="h-4 w-4" />
            )}
            <span>
              {mode === 'login'
                ? 'Sign In'
                : mode === 'register'
                  ? 'Create Account'
                  : 'Update Password'}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
};
