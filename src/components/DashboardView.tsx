import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bell,
  Bookmark,
  BookOpen,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  Download,
  FileText,
  Headphones,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  MessageSquare,
  PlayCircle,
  Plus,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Trash2,
  Upload,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import {
  apiFetch,
  buildAuthorizedUrl,
  CANADIAN_PROVINCES,
  formatJobSalary,
  getWorkPermitBadge,
} from '../lib/api.ts';
import type {
  AffiliatePartner,
  ApplicationRecord,
  ApplicationStage,
  AuditLogEntry,
  BlogArticle,
  CanadianProvince,
  ConsultationRecord,
  JobCategory,
  JobListing,
  LeadRecord,
  LeadStatus,
  MessageRecord,
  NotificationRecord,
  PaymentRecord,
  PublicDocumentMeta,
  PublicUser,
  ServiceItem,
} from '../types.ts';
import {
  ExactDashboardBannerArt,
  ExactSidebarFlagArt,
  MapleLeafIcon,
} from './HeroArtwork.tsx';

interface DashboardViewProps {
  user: PublicUser;
  profileStrength: number;
  assignedAgent: PublicUser | null;
  jobs: JobListing[];
  services: ServiceItem[];
  affiliates: AffiliatePartner[];
  articles: BlogArticle[];
  notifications: NotificationRecord[];
  currency: 'CAD' | 'KES';
  cadToKesRate: number;
  onToggleCurrency: () => void;
  onMarkNotificationRead: (id: string) => void;
  onUserUpdated: (u: PublicUser, strength: number) => void;
  onOpenJob: (job: JobListing) => void;
  onToggleSaveJob: (jobId: string) => void;
  onOpenCheckout: (service: ServiceItem) => void;
  onBackToSite: () => void;
  onLogout: () => void;
}

const APPLICATION_STAGES: ApplicationStage[] = [
  'Interest Submitted',
  'Initial Review',
  'Agent Consultation',
  'Employer Application',
  'Interview Stage',
  'Employer Decision',
  'Immigration Process',
];

const LEAD_STATUSES: LeadStatus[] = [
  'NEW LEAD',
  'CONTACTED',
  'CONSULTATION BOOKED',
  'CONSULTATION COMPLETED',
  'SERVICE OFFERED',
  'PAYMENT RECEIVED',
  'IN PROGRESS',
  'COMPLETED',
  'CLOSED',
];

const LEARNING_MODULES = [
  {
    id: 'mod_resume',
    title: 'Canadian ATS Resume & Cover Letter Standards',
    category: 'Career Prep',
    duration: '25 min module',
    summary:
      'Learn why Canadian employers prohibit photos and personal IDs, and structure your achievements to match NOC descriptors.',
  },
  {
    id: 'mod_eca',
    title: 'WES & NNAS Credential Evaluation Walkthrough',
    category: 'Credentials',
    duration: '35 min module',
    summary:
      'Step-by-step documentation checklist for Kenyan and African degrees, diplomas, and nursing registrations.',
  },
  {
    id: 'mod_ielts',
    title: 'CLB 7+ IELTS General & CELPIP Strategy',
    category: 'Language Prep',
    duration: '40 min module',
    summary:
      'Target band score benchmarks across Express Entry, Provincial Nominee Programs, and employer interviews.',
  },
  {
    id: 'mod_scam',
    title: 'LMIA Verification & Anti-Scam Protection',
    category: 'Compliance',
    duration: '15 min module',
    summary:
      'Verify genuine Canadian job offers and recognize illegal upfront visa-fee schemes before sharing documents.',
  },
];

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  profileStrength,
  assignedAgent,
  jobs,
  services,
  affiliates,
  articles,
  notifications,
  currency,
  cadToKesRate,
  onToggleCurrency,
  onMarkNotificationRead,
  onUserUpdated,
  onOpenJob,
  onToggleSaveJob,
  onOpenCheckout,
  onBackToSite,
  onLogout,
}) => {
  const [tab, setTab] = useState<string>(
    user.role === 'admin'
      ? 'admin_overview'
      : user.role === 'agent'
        ? 'agent_leads'
        : user.role === 'employer'
          ? 'employer_jobs'
          : 'dashboard_home'
  );

  useEffect(() => {
    setTab(
      user.role === 'admin'
        ? 'admin_overview'
        : user.role === 'agent'
          ? 'agent_leads'
          : user.role === 'employer'
            ? 'employer_jobs'
            : 'dashboard_home'
    );
  }, [user.id, user.role]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [dashSearch, setDashSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Shared records
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [consultations, setConsultations] = useState<ConsultationRecord[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [documents, setDocuments] = useState<PublicDocumentMeta[]>([]);

  // Applicant profile form
  const [bio, setBio] = useState(user.bio || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [country, setCountry] = useState(user.country || 'Kenya');
  const [skillsText, setSkillsText] = useState((user.skills || []).join(', '));
  const [preferredCategory, setPreferredCategory] = useState<JobCategory>(
    user.preferredCategory || 'Healthcare'
  );
  const [preferredProvinces, setPreferredProvinces] = useState<CanadianProvince[]>(
    user.preferredProvinces || ['Ontario']
  );

  // Messaging
  const [messageInput, setMessageInput] = useState('');
  const [recipientId, setRecipientId] = useState('');

  // Employer jobs
  const [managedJobs, setManagedJobs] = useState<JobListing[]>([]);
  const [newJobTitle, setNewJobTitle] = useState('');
  const [newJobProvince, setNewJobProvince] = useState<CanadianProvince>('Ontario');
  const [newJobCity, setNewJobCity] = useState('Toronto');
  const [newJobCategory, setNewJobCategory] = useState<JobCategory>('Healthcare');
  const [newJobMinSal, setNewJobMinSal] = useState(26);
  const [newJobMaxSal, setNewJobMaxSal] = useState(34);
  const [newJobUnit, setNewJobUnit] = useState<'hour' | 'year'>('hour');
  const [newJobDesc, setNewJobDesc] = useState('');
  const [newJobPermit, setNewJobPermit] = useState<
    'lmia_verified' | 'employer_supported_case_by_case' | 'no_sponsorship_verified'
  >('employer_supported_case_by_case');

  // Agent & Admin state
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [leadNotes, setLeadNotes] = useState<Record<string, string>>({});
  const [adminOverview, setAdminOverview] = useState<Record<string, number> | null>(null);
  const [adminUsers, setAdminUsers] = useState<
    Array<PublicUser & { documentCount?: number; assignedLeadsCount?: number }>
  >([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  // Admin forms
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentEmail, setNewAgentEmail] = useState('');
  const [newAgentPass, setNewAgentPass] = useState('DemoPass123!');
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMsg, setBroadcastMsg] = useState('');

  // Agent manual payment form
  const [manualPayEmail, setManualPayEmail] = useState('');
  const [manualPayService, setManualPayService] = useState('Canadian CV Rewrite');
  const [manualPayCad, setManualPayCad] = useState('65');

  const firstName = user.fullName.split(/\s+/)[0] || user.fullName;
  const unreadCount = notifications.filter((n) => !n.read).length;

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [apps, cons, pays, msgs, docs] = await Promise.all([
        apiFetch<ApplicationRecord[]>('/api/applications'),
        apiFetch<ConsultationRecord[]>('/api/consultations'),
        apiFetch<PaymentRecord[]>('/api/payments'),
        apiFetch<MessageRecord[]>('/api/messages'),
        apiFetch<PublicDocumentMeta[]>('/api/documents'),
      ]);
      setApplications(apps);
      setConsultations(cons);
      setPayments(pays);
      setMessages(msgs);
      setDocuments(docs);

      if (user.role === 'employer' || user.role === 'admin') {
        const allJobs = await apiFetch<JobListing[]>('/api/jobs?includeAll=true');
        setManagedJobs(allJobs);
      }
      if (user.role === 'agent' || user.role === 'admin') {
        const [leadList, userList] = await Promise.all([
          apiFetch<LeadRecord[]>('/api/leads'),
          apiFetch<Array<PublicUser & { documentCount?: number; assignedLeadsCount?: number }>>(
            '/api/admin/users'
          ),
        ]);
        setLeads(leadList);
        setAdminUsers(userList);
      }
      if (user.role === 'admin') {
        const [ov, logs] = await Promise.all([
          apiFetch<Record<string, number>>('/api/admin/overview'),
          apiFetch<AuditLogEntry[]>('/api/admin/audit-logs'),
        ]);
        setAdminOverview(ov);
        setAuditLogs(logs);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to load portal data.');
    } finally {
      setLoading(false);
    }
  }, [user.role]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setStatusMsg('');
    try {
      const res = await apiFetch<{ user: PublicUser; profileStrength: number }>('/api/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          phone,
          country,
          bio,
          preferredCategory,
          preferredProvinces,
          skills: skillsText
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
        }),
      });
      onUserUpdated(res.user, res.profileStrength);
      setStatusMsg('Profile updated! Your strength score has been recalculated.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not update profile.');
    }
  }

  async function handleUploadDocument(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        await apiFetch<PublicDocumentMeta>('/api/documents', {
          method: 'POST',
          body: JSON.stringify({
            fileName: file.name,
            fileType: 'CV / Supporting Credential',
            mimeType: file.type || 'application/octet-stream',
            contentBase64: reader.result,
          }),
        });
        setStatusMsg(`Uploaded ${file.name} to your encrypted document vault.`);
        loadDashboardData();
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'Upload failed.');
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleDeleteDoc(id: string) {
    try {
      await apiFetch(`/api/documents/${id}`, { method: 'DELETE' });
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Delete failed.');
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!messageInput.trim()) return;
    try {
      const msg = await apiFetch<MessageRecord>('/api/messages', {
        method: 'POST',
        body: JSON.stringify({
          recipientId: recipientId || assignedAgent?.id || undefined,
          body: messageInput,
        }),
      });
      setMessages((prev) => [...prev, msg]);
      setMessageInput('');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not send message.');
    }
  }

  async function handleCreateJob(e: React.FormEvent) {
    e.preventDefault();
    try {
      const job = await apiFetch<JobListing>('/api/jobs', {
        method: 'POST',
        body: JSON.stringify({
          title: newJobTitle,
          province: newJobProvince,
          city: newJobCity,
          category: newJobCategory,
          salaryMinCad: newJobMinSal,
          salaryMaxCad: newJobMaxSal,
          salaryUnit: newJobUnit,
          description: newJobDesc,
          workPermitSupport: newJobPermit,
        }),
      });
      setManagedJobs((prev) => [job, ...prev]);
      setNewJobTitle('');
      setNewJobDesc('');
      setStatusMsg(
        job.published
          ? `Job "${job.title}" published to the marketplace.`
          : `Job "${job.title}" saved under Pending Review until employer verification completes.`
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not create job.');
    }
  }

  async function handleUpdateAppStage(id: string, stage: ApplicationStage) {
    try {
      const updated = await apiFetch<ApplicationRecord>(`/api/applications/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ stage }),
      });
      setApplications((prev) => prev.map((a) => (a.id === id ? updated : a)));
      setStatusMsg(`Updated ${updated.referenceCode} to "${stage}".`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not update application stage.');
    }
  }

  async function handleUpdateLead(id: string, status: LeadStatus) {
    try {
      const updated = await apiFetch<LeadRecord>(`/api/leads/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status,
          noteText: leadNotes[id] || undefined,
        }),
      });
      setLeads((prev) => prev.map((l) => (l.id === id ? updated : l)));
      setLeadNotes((prev) => ({ ...prev, [id]: '' }));
      setStatusMsg(`Lead ${updated.referenceNumber} updated to ${status}.`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not update lead.');
    }
  }

  async function handleToggleEmployerVerify(u: PublicUser) {
    try {
      const updated = await apiFetch<PublicUser>(`/api/admin/users/${u.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ employerVerified: !u.employerVerified }),
      });
      setAdminUsers((prev) => prev.map((item) => (item.id === u.id ? { ...item, ...updated } : item)));
      setStatusMsg(
        `${updated.companyName || updated.fullName} verification set to ${updated.employerVerified ? 'Verified' : 'Unverified'}.`
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not update employer verification.');
    }
  }

  async function handleCreateAgent(e: React.FormEvent) {
    e.preventDefault();
    try {
      const created = await apiFetch<PublicUser>('/api/admin/agents', {
        method: 'POST',
        body: JSON.stringify({
          fullName: newAgentName,
          email: newAgentEmail,
          password: newAgentPass,
        }),
      });
      setAdminUsers((prev) => [...prev, created]);
      setNewAgentName('');
      setNewAgentEmail('');
      setStatusMsg(`Agent ${created.fullName} created.`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not create agent.');
    }
  }

  async function handleBroadcast(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await apiFetch<{ sentCount: number }>('/api/admin/notifications/broadcast', {
        method: 'POST',
        body: JSON.stringify({
          targetRole: 'all',
          title: broadcastTitle,
          message: broadcastMsg,
        }),
      });
      setBroadcastTitle('');
      setBroadcastMsg('');
      setStatusMsg(`Broadcast sent to ${res.sentCount} platform accounts.`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Broadcast failed.');
    }
  }

  async function handleRecordAgentPayment(e: React.FormEvent) {
    e.preventDefault();
    try {
      const pay = await apiFetch<PaymentRecord>('/api/agent/payments', {
        method: 'POST',
        body: JSON.stringify({
          applicantEmail: manualPayEmail,
          serviceName: manualPayService,
          amountCad: Number(manualPayCad),
          gateway: 'mpesa',
        }),
      });
      setPayments((prev) => [pay, ...prev]);
      setManualPayEmail('');
      setStatusMsg(`Payment receipt ${pay.receiptNumber} recorded.`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not record payment.');
    }
  }

  const sidebarNav: Array<{ id: string; label: string; icon: React.ReactNode }> = [
    {
      id: 'dashboard_home',
      label: 'Dashboard',
      icon: <LayoutDashboard className="h-4 w-4 shrink-0" />,
    },
    {
      id: 'jobs_browse',
      label: 'Job Opportunities',
      icon: <Briefcase className="h-4 w-4 shrink-0" />,
    },
    {
      id: 'my_applications',
      label: 'My Applications',
      icon: <FileText className="h-4 w-4 shrink-0" />,
    },
    {
      id: 'career_resources',
      label: 'Career Resources',
      icon: <BookOpen className="h-4 w-4 shrink-0" />,
    },
    {
      id: 'learning_hub',
      label: 'Learning Hub',
      icon: <PlayCircle className="h-4 w-4 shrink-0" />,
    },
    {
      id: 'profile_settings',
      label: 'Profile Settings',
      icon: <Settings className="h-4 w-4 shrink-0" />,
    },
    {
      id: 'support_desk',
      label: 'Support',
      icon: <Headphones className="h-4 w-4 shrink-0" />,
    },
  ];

  const roleExtras: Array<{ id: string; label: string; icon: React.ReactNode }> =
    user.role === 'employer'
      ? [
          {
            id: 'employer_jobs',
            label: 'Manage Vacancies',
            icon: <Building2 className="h-4 w-4 shrink-0" />,
          },
          {
            id: 'employer_candidates',
            label: 'Candidate Pipeline',
            icon: <Users className="h-4 w-4 shrink-0" />,
          },
        ]
      : user.role === 'agent'
        ? [
            {
              id: 'agent_leads',
              label: 'Relocation Leads',
              icon: <UserCheck className="h-4 w-4 shrink-0" />,
            },
            {
              id: 'agent_apps',
              label: 'Applicant EOIs',
              icon: <Briefcase className="h-4 w-4 shrink-0" />,
            },
          ]
        : user.role === 'admin'
          ? [
              {
                id: 'admin_overview',
                label: 'Admin Overview',
                icon: <ShieldCheck className="h-4 w-4 shrink-0" />,
              },
              {
                id: 'admin_users',
                label: 'Employers & Agents',
                icon: <Users className="h-4 w-4 shrink-0" />,
              },
              {
                id: 'employer_jobs',
                label: 'Jobs & Compliance',
                icon: <Building2 className="h-4 w-4 shrink-0" />,
              },
              {
                id: 'agent_leads',
                label: 'All Leads',
                icon: <UserCheck className="h-4 w-4 shrink-0" />,
              },
            ]
          : [];

  const filteredJobs = jobs.filter((j) => {
    if (!dashSearch.trim()) return true;
    const q = dashSearch.trim().toLowerCase();
    return (
      j.title.toLowerCase().includes(q) ||
      j.companyName.toLowerCase().includes(q) ||
      j.city.toLowerCase().includes(q) ||
      j.province.toLowerCase().includes(q) ||
      j.category.toLowerCase().includes(q)
    );
  });

  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (Math.min(100, Math.max(0, profileStrength)) / 100) * circumference;
  const strengthLabel =
    profileStrength >= 80 ? 'Excellent!' : profileStrength >= 50 ? 'Good Progress' : 'Getting Started';

  return (
    <div className="flex min-h-screen bg-[#EEF3FA] text-[#0A1D3D]">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#071A38]/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* LEFT SIDEBAR MATCHING EXACT REFERENCE */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col justify-between bg-gradient-to-b from-[#071A38] to-[#0A224A] p-4 text-white transition-transform duration-200 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          <div className="flex items-center justify-between px-2 py-2">
            <button
              type="button"
              onClick={onBackToSite}
              className="flex items-center gap-2.5 text-left"
            >
              <MapleLeafIcon className="h-8 w-8 shrink-0 text-[#E01E37]" />
              <div className="font-display text-sm font-extrabold leading-[1.15]">
                <div>Canada</div>
                <div>Career Connect</div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="rounded-lg p-1 text-slate-300 lg:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="mt-6 space-y-1">
            {sidebarNav.map((item) => {
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] font-semibold transition whitespace-nowrap ${
                    active
                      ? 'bg-gradient-to-r from-[#E61E3A] to-[#C2142B] text-white shadow-md'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {roleExtras.length > 0 && (
            <div className="mt-6 border-t border-white/10 pt-4">
              <div className="px-3.5 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {user.role} Workspace
              </div>
              <div className="space-y-1">
                {roleExtras.map((item) => {
                  const active = tab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setTab(item.id);
                        setSidebarOpen(false);
                      }}
                      className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] font-semibold transition whitespace-nowrap ${
                        active
                          ? 'bg-gradient-to-r from-[#E61E3A] to-[#C2142B] text-white shadow-md'
                          : 'text-slate-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Promo Card using exact Canadian flag art from reference */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-b from-[#0E2B5B] to-[#081936] p-3.5 text-center shadow-lg">
          <ExactSidebarFlagArt />
          <div className="mt-3 font-display text-sm font-extrabold leading-snug">
            Build Your Future in Canada
          </div>
          <button
            type="button"
            onClick={() => {
              setTab('jobs_browse');
              setSidebarOpen(false);
            }}
            className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-[#E61E3A] to-[#C2142B] px-3 py-2 text-xs font-bold text-white shadow-sm hover:opacity-95"
          >
            <span>Explore More</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </aside>

      {/* MAIN WORKSPACE */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* TOP HEADER BAR */}
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-[#F8FAFE]/95 px-4 py-3 backdrop-blur sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-1 items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 lg:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>

              <div className="relative w-full max-w-lg">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={dashSearch}
                  onChange={(e) => setDashSearch(e.target.value)}
                  placeholder="Search for jobs, courses or resources..."
                  className="w-full rounded-full border border-slate-200/90 bg-white py-2 pl-10 pr-4 text-sm text-[#0A1D3D] shadow-xs placeholder:text-slate-400 focus:border-[#0A1D3D] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={onToggleCurrency}
                className="hidden rounded-full border border-slate-200 bg-white px-3 py-1.5 font-mono text-xs font-bold text-[#0A1D3D] hover:bg-slate-50 sm:inline-flex"
              >
                {currency}
              </button>

              <button
                type="button"
                onClick={onBackToSite}
                className="hidden items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-[#0A1D3D] md:inline-flex whitespace-nowrap"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Landing Site</span>
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowNotifs((v) => !v)}
                  className="relative flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-xs hover:bg-slate-50"
                  aria-label="Notifications"
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#E01E37] font-mono text-[10px] font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifs && (
                  <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
                    <div className="mb-2 flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-xs font-bold text-[#0A1D3D]">Notifications</span>
                      <button
                        type="button"
                        onClick={() => setShowNotifs(false)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="max-h-64 space-y-2 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="py-4 text-center text-xs text-slate-500">
                          No notifications yet.
                        </p>
                      ) : (
                        notifications.slice(0, 8).map((n) => (
                          <button
                            key={n.id}
                            type="button"
                            onClick={() => onMarkNotificationRead(n.id)}
                            className={`w-full rounded-xl border p-2.5 text-left text-xs transition ${
                              n.read
                                ? 'border-slate-100 bg-white text-slate-500'
                                : 'border-[#D62839]/25 bg-[#D62839]/5 text-[#0A1D3D]'
                            }`}
                          >
                            <div className="font-bold">{n.title}</div>
                            <p className="mt-0.5 text-[11px] leading-relaxed">{n.message}</p>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 shadow-xs">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0A1D3D] font-display text-[11px] font-extrabold text-white">
                  {user.avatarInitials}
                </div>
                <div className="hidden text-left sm:block pr-1">
                  <div className="text-xs font-bold leading-tight text-[#0A1D3D]">
                    {user.fullName}
                  </div>
                  <div className="text-[10px] capitalize text-slate-500">
                    {user.role === 'applicant' ? 'Job Seeker' : user.role}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onLogout}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-red-50 hover:text-[#D62839]"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        {/* WORKSPACE BODY */}
        <main className="flex-1 space-y-6 p-4 sm:p-6">
          {statusMsg && (
            <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800">
              <span>{statusMsg}</span>
              <button type="button" onClick={() => setStatusMsg('')} className="underline">
                Dismiss
              </button>
            </div>
          )}
          {errorMsg && (
            <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
              <span>{errorMsg}</span>
              <button type="button" onClick={() => setErrorMsg('')} className="underline">
                Dismiss
              </button>
            </div>
          )}

          {/* ==================== DASHBOARD HOME MATCHING REFERENCE ==================== */}
          {tab === 'dashboard_home' && (
            <div className="space-y-6">
              {/* Top Row: Exact Welcome Banner + Profile Strength */}
              <div className="grid gap-6 lg:grid-cols-12">
                <div className="relative overflow-hidden rounded-2xl bg-[#1A4B9F] text-white shadow-md lg:col-span-8">
                  <ExactDashboardBannerArt />
                  <div className="relative z-10 flex h-full min-h-[210px] flex-col justify-center p-6 sm:p-8">
                    <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-[32px]">
                      Welcome back, {firstName}!
                    </h1>
                    <p className="mt-1.5 max-w-md text-sm text-slate-100">
                      Keep going towards your Canadian career goals.
                      {assignedAgent ? ` Advisor: ${assignedAgent.fullName}.` : ''}
                    </p>
                    <div className="mt-5">
                      <button
                        type="button"
                        onClick={() =>
                          setTab(applications.length > 0 ? 'my_applications' : 'jobs_browse')
                        }
                        className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#E61E3A] to-[#C2142B] px-5 py-2.5 text-xs font-bold text-white shadow-md transition hover:opacity-95"
                      >
                        <span>Continue Your Journey</span>
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm lg:col-span-4">
                  <h2 className="font-display text-base font-extrabold text-[#0A1D3D]">
                    Your Profile Strength
                  </h2>
                  <div className="my-3 flex items-center gap-5">
                    <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
                      <svg className="h-24 w-24 -rotate-90" viewBox="0 0 88 88">
                        <circle
                          cx="44"
                          cy="44"
                          r={radius}
                          stroke="#E5EAF2"
                          strokeWidth="8"
                          fill="none"
                        />
                        <circle
                          cx="44"
                          cy="44"
                          r={radius}
                          stroke="#16A34A"
                          strokeWidth="8"
                          strokeLinecap="round"
                          fill="none"
                          strokeDasharray={circumference}
                          strokeDashoffset={strokeOffset}
                        />
                      </svg>
                      <span className="absolute font-display text-xl font-extrabold text-[#0A1D3D] tabular-nums">
                        {profileStrength}%
                      </span>
                    </div>
                    <div>
                      <div className="font-display text-lg font-extrabold text-[#16A34A]">
                        {strengthLabel}
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-slate-600">
                        You&apos;re almost there. Add your skills to get more job matches.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTab('profile_settings')}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#0A1D3D] py-2.5 text-xs font-bold text-white transition hover:bg-[#132F5C]"
                  >
                    <span>Update Profile</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Bottom Row: Quick Access Pastel Cards + Recommended Jobs */}
              <div className="grid gap-6 lg:grid-cols-12">
                <div className="space-y-4 lg:col-span-8">
                  <h2 className="font-display text-lg font-extrabold text-[#0A1D3D]">
                    Quick Access
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <button
                      type="button"
                      onClick={() => setTab('jobs_browse')}
                      className="flex flex-col items-center rounded-2xl border border-amber-200/60 bg-gradient-to-b from-[#FDF4DC] to-[#FAF0D4] p-5 text-center shadow-sm transition hover:-translate-y-0.5"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                        <Search className="h-5 w-5" />
                      </div>
                      <div className="mt-3 font-display text-sm font-extrabold text-[#0A1D3D]">
                        Browse Jobs
                      </div>
                      <div className="mt-1 text-xs text-slate-600">Find your ideal role</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTab('learning_hub')}
                      className="flex flex-col items-center rounded-2xl border border-purple-200/60 bg-gradient-to-b from-[#EFE6FF] to-[#E9DDFE] p-5 text-center shadow-sm transition hover:-translate-y-0.5"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                        <BookOpen className="h-5 w-5" />
                      </div>
                      <div className="mt-3 font-display text-sm font-extrabold text-[#0A1D3D]">
                        Explore Courses
                      </div>
                      <div className="mt-1 text-xs text-slate-600">
                        Upskill for better opportunities
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTab('career_resources')}
                      className="flex flex-col items-center rounded-2xl border border-orange-200/60 bg-gradient-to-b from-[#FCEADE] to-[#F9E0CF] p-5 text-center shadow-sm transition hover:-translate-y-0.5"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="mt-3 font-display text-sm font-extrabold text-[#0A1D3D]">
                        Career Resources
                      </div>
                      <div className="mt-1 text-xs text-slate-600">Get expert advice</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTab('support_desk')}
                      className="flex flex-col items-center rounded-2xl border border-indigo-200/60 bg-gradient-to-b from-[#ECE9FE] to-[#E2DDFE] p-5 text-center shadow-sm transition hover:-translate-y-0.5"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
                        <Users className="h-5 w-5" />
                      </div>
                      <div className="mt-3 font-display text-sm font-extrabold text-[#0A1D3D]">
                        Advisor Desk
                      </div>
                      <div className="mt-1 text-xs text-slate-600">Connect with specialists</div>
                    </button>
                  </div>

                  {/* Active Applications Summary */}
                  <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <h3 className="font-display text-sm font-extrabold text-[#0A1D3D]">
                        Active Expressions of Interest ({applications.length})
                      </h3>
                      <button
                        type="button"
                        onClick={() => setTab('my_applications')}
                        className="text-xs font-bold text-[#D62839] hover:underline"
                      >
                        View Tracker →
                      </button>
                    </div>
                    {applications.length === 0 ? (
                      <p className="mt-2 text-xs text-slate-500">
                        No expressions of interest submitted yet. Click Apply Now on any recommended
                        job to track your progress.
                      </p>
                    ) : (
                      <div className="mt-3 divide-y divide-slate-100">
                        {applications.slice(0, 3).map((app) => (
                          <div
                            key={app.id}
                            className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-xs"
                          >
                            <div>
                              <span className="font-mono font-bold text-[#D62839]">
                                {app.referenceCode}
                              </span>
                              <span className="mx-2 text-slate-300">·</span>
                              <span className="font-bold text-[#0A1D3D]">{app.jobTitle}</span>
                              <span className="ml-2 text-slate-500">({app.province})</span>
                            </div>
                            <span className="font-semibold text-emerald-700">{app.stage}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Recommended Jobs Column */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm lg:col-span-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-base font-extrabold text-[#0A1D3D]">
                      Recommended Jobs
                    </h2>
                    <button
                      type="button"
                      onClick={() => setTab('jobs_browse')}
                      className="text-xs font-bold text-[#0A1D3D] hover:text-[#D62839]"
                    >
                      See All →
                    </button>
                  </div>

                  <div className="mt-4 space-y-3">
                    {filteredJobs.slice(0, 3).map((job) => {
                      const saved = (user.savedJobIds || []).includes(job.id);
                      return (
                        <div
                          key={job.id}
                          className="rounded-xl border border-slate-200/80 bg-[#F8FAFE] p-3.5 transition hover:border-[#0A1D3D]/30"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-xs">
                              <MapleLeafIcon className="h-5 w-5 text-[#E01E37]" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="truncate font-display text-sm font-bold text-[#0A1D3D]">
                                {job.title}
                              </h3>
                              <p className="text-xs text-slate-500">
                                {job.city}, {job.province} · {job.employmentType}
                              </p>
                              <div className="mt-1 font-mono text-[11px] font-bold text-emerald-700 tabular-nums">
                                {formatJobSalary(
                                  job.salaryMinCad,
                                  job.salaryMaxCad,
                                  job.salaryUnit,
                                  currency,
                                  cadToKesRate
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="mt-3 flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => onOpenJob(job)}
                              className="flex-1 rounded-full bg-gradient-to-r from-[#E61E3A] to-[#C2142B] py-1.5 text-xs font-bold text-white shadow-xs hover:opacity-95"
                            >
                              Apply Now
                            </button>
                            <button
                              type="button"
                              onClick={() => onToggleSaveJob(job.id)}
                              className={`rounded-full border p-1.5 ${
                                saved
                                  ? 'border-[#D62839] bg-[#D62839]/10 text-[#D62839]'
                                  : 'border-slate-200 bg-white text-slate-400 hover:text-[#0A1D3D]'
                              }`}
                              title="Save Job"
                            >
                              <Bookmark className="h-4 w-4" fill={saved ? 'currentColor' : 'none'} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================== JOB OPPORTUNITIES ==================== */}
          {tab === 'jobs_browse' && (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="font-display text-lg font-extrabold text-[#0A1D3D]">
                    Canadian Job Opportunities ({filteredJobs.length})
                  </h2>
                  <p className="text-xs text-slate-500">
                    Filter using the search bar above and submit free Expressions of Interest.
                  </p>
                </div>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {filteredJobs.map((job) => {
                  const badge = getWorkPermitBadge(job.workPermitSupport);
                  const saved = (user.savedJobIds || []).includes(job.id);
                  return (
                    <div
                      key={job.id}
                      className="flex flex-col justify-between rounded-xl border border-slate-200 p-4"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-xs font-semibold text-emerald-700">
                              {badge.label}
                            </div>
                            <h3 className="mt-0.5 font-display text-base font-extrabold text-[#0A1D3D]">
                              {job.title}
                            </h3>
                            <p className="text-xs text-slate-500">
                              {job.companyName} · {job.city}, {job.province}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => onToggleSaveJob(job.id)}
                            className={`rounded-full border p-2 ${
                              saved ? 'border-[#D62839] text-[#D62839]' : 'border-slate-200 text-slate-400'
                            }`}
                          >
                            <Bookmark className="h-4 w-4" fill={saved ? 'currentColor' : 'none'} />
                          </button>
                        </div>
                        <p className="mt-2 line-clamp-2 text-xs text-slate-600">{job.description}</p>
                      </div>
                      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                        <span className="font-mono text-xs font-bold text-[#0A1D3D] tabular-nums">
                          {formatJobSalary(
                            job.salaryMinCad,
                            job.salaryMaxCad,
                            job.salaryUnit,
                            currency,
                            cadToKesRate
                          )}
                        </span>
                        <button
                          type="button"
                          onClick={() => onOpenJob(job)}
                          className="rounded-full bg-gradient-to-r from-[#E61E3A] to-[#C2142B] px-4 py-1.5 text-xs font-bold text-white"
                        >
                          Apply Now
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ==================== MY APPLICATIONS ==================== */}
          {tab === 'my_applications' && (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-lg font-extrabold text-[#0A1D3D]">
                    My Applications &amp; Expression Tracker ({applications.length})
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Track every stage from initial submission to advisor review and employer stage.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setTab('jobs_browse')}
                  className="rounded-full bg-[#0A1D3D] px-4 py-2 text-xs font-bold text-white"
                >
                  Browse More Jobs
                </button>
              </div>

              <div className="mt-5 space-y-4">
                {applications.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-500">
                    No applications tracked yet. Visit Job Opportunities to record your first Expression of Interest.
                  </p>
                ) : (
                  applications.map((app) => (
                    <div
                      key={app.id}
                      className="rounded-xl border border-slate-200 bg-slate-50/70 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="font-mono text-xs font-bold text-[#D62839]">
                            {app.referenceCode}
                          </div>
                          <h3 className="font-display text-base font-bold text-[#0A1D3D]">
                            {app.jobTitle}
                          </h3>
                          <p className="text-xs text-slate-600">
                            {app.companyName} · {app.province} · {app.assistanceStatus}
                          </p>
                        </div>
                        <span className="rounded-full bg-[#0A1D3D] px-3 py-1 text-xs font-bold text-white">
                          {app.stage}
                        </span>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-7">
                        {APPLICATION_STAGES.map((st, idx) => {
                          const currentIdx = APPLICATION_STAGES.indexOf(app.stage);
                          const active = idx <= currentIdx;
                          return (
                            <div
                              key={st}
                              className={`rounded-lg px-2 py-1.5 text-center text-[10px] font-semibold ${
                                active
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-200 text-slate-500'
                              }`}
                            >
                              {st}
                            </div>
                          );
                        })}
                      </div>
                      {app.agentNotes && (
                        <p className="mt-3 rounded-lg bg-white p-3 text-xs text-slate-700">
                          <strong>Advisor Note:</strong> {app.agentNotes}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ==================== CAREER RESOURCES & CV VAULT ==================== */}
          {tab === 'career_resources' && (
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
                <h2 className="font-display text-base font-extrabold text-[#0A1D3D]">
                  CV &amp; Credential Document Vault
                </h2>
                <p className="text-xs text-slate-500">
                  Upload your resume, license, or ECA report (max 6 MB) for advisor review.
                </p>
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center hover:border-[#0A1D3D]">
                  <Upload className="h-6 w-6 text-[#D62839]" />
                  <span className="mt-2 text-xs font-bold text-[#0A1D3D]">
                    Upload CV or Credential Document
                  </span>
                  <input type="file" className="hidden" onChange={handleUploadDocument} />
                </label>

                <div className="space-y-2">
                  {documents.length === 0 ? (
                    <p className="text-xs text-slate-500">No documents uploaded yet.</p>
                  ) : (
                    documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-[#0A1D3D]" />
                          <div>
                            <div className="font-semibold">{doc.fileName}</div>
                            <div className="text-[11px] text-slate-500">
                              {Math.round(doc.sizeBytes / 1024)} KB
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href={buildAuthorizedUrl(`/api/documents/${doc.id}/download`)}
                            className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:text-[#0A1D3D]"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </a>
                          <button
                            type="button"
                            onClick={() => handleDeleteDoc(doc.id)}
                            className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:text-red-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
                <h2 className="font-display text-base font-extrabold text-[#0A1D3D]">
                  Guides &amp; Official Partner Links
                </h2>
                <div className="space-y-3">
                  {articles.map((art) => (
                    <div key={art.id} className="rounded-xl border border-slate-200 p-4">
                      <div className="text-[11px] font-semibold text-[#D62839]">
                        {art.category} · {art.readTime}
                      </div>
                      <h3 className="mt-1 font-display text-sm font-bold text-[#0A1D3D]">
                        {art.title}
                      </h3>
                      <p className="mt-1 text-xs text-slate-600">{art.excerpt}</p>
                    </div>
                  ))}
                  {affiliates.map((aff) => (
                    <a
                      key={aff.id}
                      href={aff.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs hover:border-[#0A1D3D]"
                    >
                      <div className="font-bold text-[#0A1D3D]">{aff.name}</div>
                      <div className="text-slate-500">{aff.description}</div>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ==================== LEARNING HUB ==================== */}
          {tab === 'learning_hub' && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
                <h2 className="font-display text-lg font-extrabold text-[#0A1D3D]">
                  Canadian Career Readiness Modules
                </h2>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {LEARNING_MODULES.map((mod) => (
                    <div key={mod.id} className="rounded-xl border border-slate-200 p-4">
                      <div className="text-xs font-semibold text-[#D62839]">
                        {mod.category} · {mod.duration}
                      </div>
                      <h3 className="mt-1 font-display text-base font-bold text-[#0A1D3D]">
                        {mod.title}
                      </h3>
                      <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                        {mod.summary}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
                <h2 className="font-display text-lg font-extrabold text-[#0A1D3D]">
                  1-on-1 Coaching, CV Rewrites &amp; Alerts
                </h2>
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  {services
                    .filter((s) => s.category !== 'employer_ad')
                    .map((srv) => (
                      <div
                        key={srv.id}
                        className="flex flex-col justify-between rounded-xl border border-slate-200 p-4"
                      >
                        <div>
                          <div className="font-display text-sm font-bold text-[#0A1D3D]">
                            {srv.name}
                          </div>
                          <div className="mt-1 font-mono text-base font-extrabold text-[#D62839]">
                            CAD ${srv.priceCad} · KES{' '}
                            {Math.round(srv.priceCad * cadToKesRate).toLocaleString()}
                          </div>
                          <p className="mt-2 text-xs text-slate-600">{srv.description}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onOpenCheckout(srv)}
                          className="mt-4 rounded-full bg-[#0A1D3D] py-2 text-xs font-bold text-white hover:bg-[#132F5C]"
                        >
                          Book with M-Pesa / Card
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* ==================== PROFILE SETTINGS ==================== */}
          {tab === 'profile_settings' && (
            <form
              onSubmit={handleSaveProfile}
              className="max-w-3xl space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm"
            >
              <h2 className="font-display text-lg font-extrabold text-[#0A1D3D]">
                Profile Settings &amp; Readiness Details
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Country</label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Target Sector
                </label>
                <select
                  value={preferredCategory}
                  onChange={(e) => setPreferredCategory(e.target.value as JobCategory)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                >
                  {[
                    'Healthcare',
                    'Truck Driving & Logistics',
                    'Construction & Trades',
                    'Hospitality & Food Service',
                    'Agriculture & Agri-Food',
                    'Information Technology',
                    'Office & Administration',
                    'Manufacturing & Warehouse',
                  ].map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Preferred Canadian Provinces
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {CANADIAN_PROVINCES.slice(0, 6).map((prov) => {
                    const selected = preferredProvinces.includes(prov as CanadianProvince);
                    return (
                      <button
                        key={prov}
                        type="button"
                        onClick={() =>
                          setPreferredProvinces((prev) =>
                            selected
                              ? prev.filter((p) => p !== prov)
                              : [...prev, prov as CanadianProvince]
                          )
                        }
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                          selected
                            ? 'border-[#0A1D3D] bg-[#0A1D3D] text-white'
                            : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        {prov}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Professional Summary / Bio
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Skills (comma-separated)
                </label>
                <input
                  type="text"
                  value={skillsText}
                  onChange={(e) => setSkillsText(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <button
                type="submit"
                className="rounded-full bg-gradient-to-r from-[#E61E3A] to-[#C2142B] px-6 py-2.5 text-sm font-bold text-white"
              >
                Save Profile Settings
              </button>
            </form>
          )}

          {/* ==================== SUPPORT, MESSAGES & RECEIPTS ==================== */}
          {tab === 'support_desk' && (
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
                <h2 className="flex items-center gap-2 font-display text-base font-extrabold text-[#0A1D3D]">
                  <MessageSquare className="h-4 w-4 text-[#D62839]" />
                  Direct Advisor Messages
                </h2>
                <div className="mt-4 max-h-72 space-y-3 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-4">
                  {messages.length === 0 ? (
                    <p className="text-center text-xs text-slate-500">No messages yet.</p>
                  ) : (
                    messages.map((m) => {
                      const mine = m.senderId === user.id;
                      return (
                        <div
                          key={m.id}
                          className={`max-w-md rounded-xl p-3 text-xs ${
                            mine
                              ? 'ml-auto bg-[#0A1D3D] text-white'
                              : 'border border-slate-200 bg-white text-[#0A1D3D]'
                          }`}
                        >
                          <div className="font-bold opacity-80">
                            {m.senderName} ({m.senderRole})
                          </div>
                          <p className="mt-1 leading-relaxed">{m.body}</p>
                        </div>
                      );
                    })
                  )}
                </div>
                <form onSubmit={handleSendMessage} className="mt-4 flex flex-wrap gap-2">
                  {user.role === 'agent' && adminUsers.length > 0 && (
                    <select
                      value={recipientId}
                      onChange={(e) => setRecipientId(e.target.value)}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-xs"
                    >
                      <option value="">Select Applicant...</option>
                      {adminUsers.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.fullName}
                        </option>
                      ))}
                    </select>
                  )}
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Write a message to your advisor..."
                    className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#E61E3A] to-[#C2142B] px-4 py-2 text-xs font-bold text-white"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Send
                  </button>
                </form>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                  <h3 className="flex items-center gap-2 font-display text-sm font-extrabold text-[#0A1D3D]">
                    <Calendar className="h-4 w-4 text-[#D62839]" />
                    Scheduled Consultations ({consultations.length})
                  </h3>
                  <div className="mt-3 space-y-2">
                    {consultations.length === 0 ? (
                      <p className="text-xs text-slate-500">No consultations booked yet.</p>
                    ) : (
                      consultations.map((c) => (
                        <div key={c.id} className="rounded-xl border border-slate-200 p-3 text-xs">
                          <div className="font-bold text-[#0A1D3D]">{c.serviceType}</div>
                          <div className="text-slate-500">
                            {c.scheduledDate} · {c.scheduledTime} ({c.timezone}) · {c.agentName}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                  <h3 className="font-display text-sm font-extrabold text-[#0A1D3D]">
                    Payment Receipts ({payments.length})
                  </h3>
                  <div className="mt-3 space-y-2">
                    {payments.length === 0 ? (
                      <p className="text-xs text-slate-500">No receipts found.</p>
                    ) : (
                      payments.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-xs"
                        >
                          <div>
                            <div className="font-mono font-bold text-[#0A1D3D]">
                              {p.receiptNumber}
                            </div>
                            <div className="text-slate-500">{p.serviceName}</div>
                          </div>
                          <div className="text-right font-mono font-bold text-emerald-700">
                            CAD ${p.amountCad}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================== EMPLOYER & ADMIN VACANCY MANAGEMENT ==================== */}
          {tab === 'employer_jobs' && (
            <div className="space-y-6">
              {user.role === 'employer' && !user.employerVerified && (
                <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                  <div>
                    <strong>Account Pending Verification:</strong> Vacancies you submit remain under
                    Pending Review until compliance verification completes.
                  </div>
                </div>
              )}

              <form
                onSubmit={handleCreateJob}
                className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <h2 className="flex items-center gap-2 font-display text-base font-extrabold text-[#0A1D3D]">
                    <Plus className="h-4 w-4 text-[#D62839]" />
                    Post Canadian Vacancy
                  </h2>
                  {user.role === 'employer' && (
                    <button
                      type="button"
                      onClick={() => {
                        const empAd = services.find((s) => s.category === 'employer_ad');
                        if (empAd) onOpenCheckout(empAd);
                      }}
                      className="rounded-full bg-amber-100 px-3.5 py-1.5 text-xs font-bold text-amber-900"
                    >
                      Boost Vacancy Spotlight ($149)
                    </button>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <input
                    type="text"
                    required
                    value={newJobTitle}
                    onChange={(e) => setNewJobTitle(e.target.value)}
                    placeholder="Job Title"
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                  <select
                    value={newJobProvince}
                    onChange={(e) => setNewJobProvince(e.target.value as CanadianProvince)}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  >
                    {CANADIAN_PROVINCES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    required
                    value={newJobCity}
                    onChange={(e) => setNewJobCity(e.target.value)}
                    placeholder="City"
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-5">
                  <select
                    value={newJobCategory}
                    onChange={(e) => setNewJobCategory(e.target.value as JobCategory)}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm sm:col-span-2"
                  >
                    {[
                      'Healthcare',
                      'Truck Driving & Logistics',
                      'Construction & Trades',
                      'Hospitality & Food Service',
                      'Agriculture & Agri-Food',
                      'Information Technology',
                      'Office & Administration',
                      'Manufacturing & Warehouse',
                    ].map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={newJobMinSal}
                    onChange={(e) => setNewJobMinSal(Number(e.target.value))}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                  <input
                    type="number"
                    value={newJobMaxSal}
                    onChange={(e) => setNewJobMaxSal(Number(e.target.value))}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                  <select
                    value={newJobUnit}
                    onChange={(e) => setNewJobUnit(e.target.value as 'hour' | 'year')}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  >
                    <option value="hour">Per Hour</option>
                    <option value="year">Per Year</option>
                  </select>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <select
                    value={newJobPermit}
                    onChange={(e) =>
                      setNewJobPermit(
                        e.target.value as
                          | 'lmia_verified'
                          | 'employer_supported_case_by_case'
                          | 'no_sponsorship_verified'
                      )
                    }
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  >
                    <option value="employer_supported_case_by_case">Case-by-Case Sponsorship</option>
                    <option value="no_sponsorship_verified">No Sponsorship (Permit Req.)</option>
                    {user.role === 'admin' && <option value="lmia_verified">LMIA Verified</option>}
                  </select>
                  <input
                    type="text"
                    required
                    value={newJobDesc}
                    onChange={(e) => setNewJobDesc(e.target.value)}
                    placeholder="Role summary & requirements..."
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>

                <button
                  type="submit"
                  className="rounded-full bg-[#0A1D3D] px-5 py-2.5 text-sm font-bold text-white"
                >
                  Submit Job Listing
                </button>
              </form>

              <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
                <h3 className="font-display text-base font-extrabold text-[#0A1D3D]">
                  Managed Vacancies ({managedJobs.length})
                </h3>
                <div className="mt-4 space-y-3">
                  {managedJobs.map((job) => (
                    <div
                      key={job.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4 text-xs"
                    >
                      <div>
                        <div className="font-display text-sm font-bold text-[#0A1D3D]">
                          {job.title}
                        </div>
                        <div className="text-slate-500">
                          {job.companyName} · {job.city}, {job.province} ·{' '}
                          {job.published ? 'Published' : 'Unpublished'}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {user.role === 'admin' && (
                          <button
                            type="button"
                            onClick={async () => {
                              const updated = await apiFetch<JobListing>(`/api/jobs/${job.id}`, {
                                method: 'PATCH',
                                body: JSON.stringify({
                                  published: !job.published,
                                  verificationStatus: !job.published
                                    ? 'Employer Verified'
                                    : 'Pending Review',
                                }),
                              });
                              setManagedJobs((prev) =>
                                prev.map((j) => (j.id === job.id ? updated : j))
                              );
                            }}
                            className="rounded-full border border-slate-200 px-3.5 py-1.5 font-semibold"
                          >
                            {job.published ? 'Unpublish' : 'Approve & Publish'}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={async () => {
                            await apiFetch(`/api/jobs/${job.id}`, { method: 'DELETE' });
                            setManagedJobs((prev) => prev.filter((j) => j.id !== job.id));
                          }}
                          className="rounded-full border border-red-200 px-3 py-1.5 font-semibold text-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ==================== AGENT LEADS & ADMIN LEADS ==================== */}
          {tab === 'agent_leads' && (
            <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <h2 className="font-display text-base font-extrabold text-[#0A1D3D]">
                Relocation Advisory Leads ({leads.length})
              </h2>
              {leads.map((lead) => (
                <div key={lead.id} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <span className="font-mono text-xs font-bold text-[#D62839]">
                        {lead.referenceNumber}
                      </span>
                      <h3 className="font-display text-sm font-bold text-[#0A1D3D]">
                        {lead.fullName} ({lead.countryOfResidence})
                      </h3>
                      <p className="text-xs text-slate-600">
                        {lead.email} · {lead.phone} · {lead.preferredJobCategory} in{' '}
                        {lead.preferredProvince}
                      </p>
                    </div>
                    <select
                      value={lead.status}
                      onChange={(e) => handleUpdateLead(lead.id, e.target.value as LeadStatus)}
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold"
                    >
                      {LEAD_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <input
                      type="text"
                      value={leadNotes[lead.id] || ''}
                      onChange={(e) =>
                        setLeadNotes((prev) => ({ ...prev, [lead.id]: e.target.value }))
                      }
                      placeholder="Add advisor note..."
                      className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleUpdateLead(lead.id, lead.status)}
                      className="rounded-full bg-[#0A1D3D] px-4 py-1.5 text-xs font-semibold text-white"
                    >
                      Save Note
                    </button>
                  </div>
                </div>
              ))}

              {user.role === 'agent' && (
                <form
                  onSubmit={handleRecordAgentPayment}
                  className="mt-6 grid gap-3 border-t border-slate-200 pt-5 sm:grid-cols-4"
                >
                  <input
                    type="email"
                    required
                    value={manualPayEmail}
                    onChange={(e) => setManualPayEmail(e.target.value)}
                    placeholder="Applicant Email"
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                  <input
                    type="text"
                    required
                    value={manualPayService}
                    onChange={(e) => setManualPayService(e.target.value)}
                    placeholder="Service Name"
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                  <input
                    type="number"
                    required
                    value={manualPayCad}
                    onChange={(e) => setManualPayCad(e.target.value)}
                    placeholder="CAD"
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                  <button
                    type="submit"
                    className="rounded-full bg-[#0A1D3D] px-4 py-2 text-xs font-bold text-white"
                  >
                    Record Verified Payment
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ==================== AGENT EOIs & EMPLOYER CANDIDATES ==================== */}
          {(tab === 'agent_apps' || tab === 'employer_candidates') && (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <h2 className="font-display text-base font-extrabold text-[#0A1D3D]">
                Candidate Expressions of Interest ({applications.length})
              </h2>
              <div className="mt-4 space-y-3">
                {applications.map((app) => (
                  <div
                    key={app.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4"
                  >
                    <div>
                      <div className="font-mono text-xs font-bold text-[#D62839]">
                        {app.referenceCode}
                      </div>
                      <h3 className="font-display text-sm font-bold text-[#0A1D3D]">
                        {app.applicantName} — {app.jobTitle}
                      </h3>
                      <p className="text-xs text-slate-600">{app.applicantEmail}</p>
                    </div>
                    <select
                      value={app.stage}
                      onChange={(e) =>
                        handleUpdateAppStage(app.id, e.target.value as ApplicationStage)
                      }
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold"
                    >
                      {APPLICATION_STAGES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==================== ADMIN OVERVIEW ==================== */}
          {tab === 'admin_overview' && !adminOverview && (
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white p-8 text-sm text-slate-500 shadow-sm">
              <Loader2 className="h-4 w-4 animate-spin text-[#D62839]" />
              <span>Loading administrator compliance overview...</span>
            </div>
          )}
          {tab === 'admin_overview' && adminOverview && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                  <div className="text-xs font-semibold text-slate-500">Total Revenue (CAD)</div>
                  <div className="mt-1 font-mono text-2xl font-extrabold text-[#0A1D3D] tabular-nums">
                    CAD ${adminOverview.totalRevenueCad?.toLocaleString()}
                  </div>
                  <div className="mt-1 text-xs text-emerald-700">
                    KES {adminOverview.totalRevenueKes?.toLocaleString()}
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                  <div className="text-xs font-semibold text-slate-500">Published Jobs</div>
                  <div className="mt-1 font-mono text-2xl font-extrabold text-[#0A1D3D] tabular-nums">
                    {adminOverview.totalActiveJobs} / {adminOverview.totalJobs}
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                  <div className="text-xs font-semibold text-slate-500">Applicants / Leads</div>
                  <div className="mt-1 font-mono text-2xl font-extrabold text-[#0A1D3D] tabular-nums">
                    {adminOverview.totalApplicants} / {adminOverview.totalLeads}
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                  <div className="text-xs font-semibold text-slate-500">Pending Employers</div>
                  <div className="mt-1 font-mono text-2xl font-extrabold text-[#D62839] tabular-nums">
                    {adminOverview.pendingEmployers}
                  </div>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <form
                  onSubmit={handleBroadcast}
                  className="space-y-3 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"
                >
                  <h3 className="font-display text-sm font-extrabold text-[#0A1D3D]">
                    Broadcast Alert to Platform Users
                  </h3>
                  <input
                    type="text"
                    required
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    placeholder="Alert Title"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                  <textarea
                    rows={2}
                    required
                    value={broadcastMsg}
                    onChange={(e) => setBroadcastMsg(e.target.value)}
                    placeholder="Message..."
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                  <button
                    type="submit"
                    className="rounded-full bg-[#0A1D3D] px-5 py-2 text-xs font-bold text-white"
                  >
                    Send Broadcast
                  </button>
                </form>

                <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                  <h3 className="font-display text-sm font-extrabold text-[#0A1D3D]">
                    CSV Compliance &amp; Financial Exports
                  </h3>
                  <div className="flex flex-wrap gap-3 pt-2">
                    <a
                      href={buildAuthorizedUrl('/api/admin/export/applicants')}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-[#0A1D3D]"
                    >
                      <Download className="h-4 w-4" />
                      Export Applicants CSV
                    </a>
                    <a
                      href={buildAuthorizedUrl('/api/admin/export/financials')}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-[#0A1D3D]"
                    >
                      <Download className="h-4 w-4" />
                      Export Financials CSV
                    </a>
                  </div>
                </div>
              </div>

              {auditLogs.length > 0 && (
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                  <h3 className="font-display text-sm font-extrabold text-[#0A1D3D]">
                    Compliance Audit Log
                  </h3>
                  <div className="mt-3 max-h-52 space-y-1.5 overflow-y-auto font-mono text-[11px]">
                    {auditLogs.slice(0, 15).map((log) => (
                      <div
                        key={log.id}
                        className="flex flex-wrap justify-between gap-2 rounded-lg bg-slate-50 px-3 py-1.5"
                      >
                        <span>
                          <strong>{log.action}</strong> · {log.details}
                        </span>
                        <span className="text-slate-400">{log.userEmail}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==================== ADMIN USERS ==================== */}
          {tab === 'admin_users' && (
            <div className="space-y-6">
              <form
                onSubmit={handleCreateAgent}
                className="grid gap-3 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:grid-cols-4"
              >
                <input
                  type="text"
                  required
                  value={newAgentName}
                  onChange={(e) => setNewAgentName(e.target.value)}
                  placeholder="New Advisor Name"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
                <input
                  type="email"
                  required
                  value={newAgentEmail}
                  onChange={(e) => setNewAgentEmail(e.target.value)}
                  placeholder="Advisor Email"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
                <input
                  type="text"
                  required
                  value={newAgentPass}
                  onChange={(e) => setNewAgentPass(e.target.value)}
                  placeholder="Initial Password"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
                <button
                  type="submit"
                  className="rounded-full bg-gradient-to-r from-[#E61E3A] to-[#C2142B] px-4 py-2 text-xs font-bold text-white"
                >
                  Create Agent
                </button>
              </form>

              <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
                <h3 className="font-display text-base font-extrabold text-[#0A1D3D]">
                  Registered Accounts ({adminUsers.length})
                </h3>
                <div className="mt-4 space-y-2.5">
                  {adminUsers.map((u) => (
                    <div
                      key={u.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 px-4 py-3 text-xs"
                    >
                      <div>
                        <div className="font-bold text-[#0A1D3D]">
                          {u.companyName || u.fullName} ·{' '}
                          <span className="uppercase text-slate-500">{u.role}</span>
                        </div>
                        <div className="text-slate-500">
                          {u.email} · {u.country}
                        </div>
                      </div>
                      {u.role === 'employer' && (
                        <button
                          type="button"
                          onClick={() => handleToggleEmployerVerify(u)}
                          className={`inline-flex items-center gap-1 rounded-full px-3.5 py-1.5 font-bold ${
                            u.employerVerified
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-800'
                          }`}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {u.employerVerified ? 'Verified Employer' : 'Verify Employer'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin text-[#D62839]" />
              <span>Syncing portal records...</span>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
