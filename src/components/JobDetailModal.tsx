import React, { useState } from 'react';
import {
  Bookmark,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  Loader2,
  MapPin,
  ShieldAlert,
  ShieldCheck,
  X,
} from 'lucide-react';
import { apiFetch, formatJobSalary, getWorkPermitBadge } from '../lib/api.ts';
import type { ApplicationRecord, JobListing, PublicUser } from '../types.ts';

interface JobDetailModalProps {
  job: JobListing;
  user: PublicUser | null;
  currency: 'CAD' | 'KES';
  cadToKesRate: number;
  isSaved: boolean;
  onToggleSave: (jobId: string) => void;
  onRequireAuth: () => void;
  onApplicationSubmitted: (app: ApplicationRecord) => void;
  onClose: () => void;
}

export const JobDetailModal: React.FC<JobDetailModalProps> = ({
  job,
  user,
  currency,
  cadToKesRate,
  isSaved,
  onToggleSave,
  onRequireAuth,
  onApplicationSubmitted,
  onClose,
}) => {
  const [note, setNote] = useState('');
  const [requestAgentAssistance, setRequestAgentAssistance] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submittedApp, setSubmittedApp] = useState<ApplicationRecord | null>(null);

  const wpBadge = getWorkPermitBadge(job.workPermitSupport);

  async function handleSubmitInterest(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      onRequireAuth();
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const app = await apiFetch<ApplicationRecord>('/api/applications', {
        method: 'POST',
        body: JSON.stringify({
          jobId: job.id,
          note,
          requestAgentAssistance,
        }),
      });
      setSubmittedApp(app);
      onApplicationSubmitted(app);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit expression of interest.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#071B33]/65 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white/95 px-6 py-4 backdrop-blur">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#071B33] font-display text-sm font-extrabold text-white">
              {job.companyLogo}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-lg font-extrabold text-[#071B33] sm:text-xl">
                  {job.title}
                </h2>
                {job.verificationStatus === 'Employer Verified' && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Verified Listing
                  </span>
                )}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1 font-medium">
                  <Building2 className="h-3.5 w-3.5 text-slate-400" />
                  {job.companyName}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  {job.city}, {job.province}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  Deadline: {job.applicationDeadline}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onToggleSave(job.id)}
              className={`rounded-lg border p-2 transition ${
                isSaved
                  ? 'border-[#D62839] bg-[#D62839]/10 text-[#D62839]'
                  : 'border-slate-200 text-slate-500 hover:text-[#071B33]'
              }`}
              title={isSaved ? 'Saved' : 'Save Job'}
            >
              <Bookmark className="h-4 w-4" fill={isSaved ? 'currentColor' : 'none'} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="space-y-6 p-6">
          <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-3">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Compensation
              </div>
              <div className="mt-1 font-mono text-sm font-bold text-[#071B33]">
                {formatJobSalary(
                  job.salaryMinCad,
                  job.salaryMaxCad,
                  job.salaryUnit,
                  currency,
                  cadToKesRate
                )}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Role Type &amp; Level
              </div>
              <div className="mt-1 text-sm font-semibold text-[#071B33]">
                {job.employmentType} · {job.experienceLevel}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Work Permit Status
              </div>
              <span
                className={`mt-1 inline-block rounded-md border px-2 py-0.5 text-[11px] font-semibold ${wpBadge.className}`}
              >
                {wpBadge.label}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-950">
            <div className="flex items-start gap-2">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
              <div>
                <span className="font-bold">Work Permit &amp; Compliance Note: </span>
                {job.workPermitNotes}
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-slate-500">
              Role Overview
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">{job.description}</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <h4 className="font-display text-sm font-bold text-[#071B33]">
                Key Responsibilities
              </h4>
              <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
                {job.responsibilities.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#D62839]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-display text-sm font-bold text-[#071B33]">
                Qualifications &amp; Experience
              </h4>
              <p className="mt-2 text-xs font-semibold text-slate-600">
                Experience: {job.experienceRequirements}
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-600">
                Education: {job.educationRequirements}
              </p>
              <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
                {job.qualifications.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {job.benefits.length > 0 && (
            <div>
              <h4 className="font-display text-sm font-bold text-[#071B33]">Employer Benefits</h4>
              <div className="mt-2 flex flex-wrap gap-2">
                {job.benefits.map((b, i) => (
                  <span
                    key={i}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700"
                  >
                    {b}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="border-t border-slate-200 pt-5">
            {submittedApp ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-center gap-2 font-display text-sm font-extrabold text-emerald-900">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  Expression of Interest Recorded ({submittedApp.referenceCode})
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-emerald-800">
                  Your interest for <strong>{submittedApp.jobTitle}</strong> is saved in your
                  dashboard tracker under stage <strong>{submittedApp.stage}</strong>. Note: This
                  platform does not automatically submit employer or IRCC applications—use your
                  dashboard to prepare your Canadian-standard CV or message your assigned advisor.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitInterest} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="flex items-center gap-2 font-display text-base font-extrabold text-[#071B33]">
                    <Briefcase className="h-4 w-4 text-[#D62839]" />
                    Submit Free Expression of Interest
                  </h4>
                  <span className="font-mono text-[11px] font-semibold text-emerald-700">
                    FREE DISCOVERY TRACKER
                  </span>
                </div>

                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    {error}
                  </div>
                )}

                <textarea
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Briefly describe your relevant years of experience, licenses/certifications, and readiness..."
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-[#071B33] focus:outline-none"
                />

                <label className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={requestAgentAssistance}
                    onChange={(e) => setRequestAgentAssistance(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300"
                  />
                  <span>
                    <strong>Request Recruitment Advisor Review:</strong> Notify my assigned advisor
                    to review my CV readiness and Canadian compliance fit for this role.
                  </span>
                </label>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <p className="text-[11px] text-slate-500">
                    Recording interest is free and assigns an EOI tracking reference code.
                  </p>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#D62839] px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#B81F2E] disabled:opacity-60"
                  >
                    {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    <span>{user ? 'Submit Expression of Interest' : 'Sign In to Submit'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
