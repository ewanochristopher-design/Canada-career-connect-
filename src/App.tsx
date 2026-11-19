import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Bookmark,
  BookOpen,
  Briefcase,
  Building2,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  Filter,
  GraduationCap,
  Loader2,
  MapPin,
  Play,
  Search,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import { AuthModal } from './components/AuthModal.tsx';
import { CheckoutModal } from './components/CheckoutModal.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { ExactHeroPhotoLayer, MapleLeafIcon } from './components/HeroArtwork.tsx';
import { JobDetailModal } from './components/JobDetailModal.tsx';
import { Navbar } from './components/Navbar.tsx';
import {
  apiFetch,
  CANADIAN_PROVINCES,
  formatJobSalary,
  getWorkPermitBadge,
  setAuthToken,
} from './lib/api.ts';
import type {
  AffiliatePartner,
  BlogArticle,
  CanadianProvince,
  CategorySummary,
  FaqItem,
  JobCategory,
  JobListing,
  LeadRecord,
  NotificationRecord,
  PublicStats,
  PublicUser,
  ServiceItem,
  TestimonialItem,
} from './types.ts';

export default function App() {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [profileStrength, setProfileStrength] = useState(0);
  const [assignedAgent, setAssignedAgent] = useState<PublicUser | null>(null);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);

  const [activeView, setActiveView] = useState<'home' | 'dashboard'>('home');
  const [currency, setCurrency] = useState<'CAD' | 'KES'>('CAD');

  // Public data
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [affiliates, setAffiliates] = useState<AffiliatePartner[]>([]);
  const [cadToKesRate, setCadToKesRate] = useState(96);
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>([]);

  // Job filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSponsorship, setSelectedSponsorship] = useState('All');
  const [selectedExperience, setSelectedExperience] = useState('All');
  const [loadingJobs, setLoadingJobs] = useState(false);

  // Modals
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | null>(null);
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null);
  const [checkoutService, setCheckoutService] = useState<ServiceItem | null>(null);
  const [activeArticle, setActiveArticle] = useState<BlogArticle | null>(null);
  const [showVideoBriefing, setShowVideoBriefing] = useState(false);
  const [openFaqId, setOpenFaqId] = useState<string | null>('faq_1');

  // Relocation lead form
  const [leadName, setLeadName] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadCountry, setLeadCountry] = useState('Kenya');
  const [leadCategory, setLeadCategory] = useState<JobCategory>('Healthcare');
  const [leadProvince, setLeadProvince] = useState<CanadianProvince>('Ontario');
  const [leadExperience, setLeadExperience] = useState('');
  const [leadAssistance, setLeadAssistance] = useState('Canadian CV Rewrite & Job Roadmap');
  const [leadMessage, setLeadMessage] = useState('');
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [leadConfirmed, setLeadConfirmed] = useState<LeadRecord | null>(null);
  const [leadError, setLeadError] = useState('');

  const jobSearchInputRef = useRef<HTMLInputElement | null>(null);

  const loadSession = useCallback(async () => {
    try {
      const me = await apiFetch<{
        user: PublicUser | null;
        profileStrength?: number;
        assignedAgent?: PublicUser | null;
      }>('/api/auth/me');
      if (me.user) {
        setUser(me.user);
        setProfileStrength(me.profileStrength || 0);
        setAssignedAgent(me.assignedAgent || null);
        try {
          const notifs = await apiFetch<NotificationRecord[]>('/api/notifications');
          setNotifications(notifs);
        } catch {
          setNotifications([]);
        }
      } else {
        setAuthToken(null);
        setUser(null);
        setNotifications([]);
      }
    } catch {
      setUser(null);
    }
  }, []);

  const loadJobs = useCallback(async () => {
    setLoadingJobs(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set('q', searchQuery.trim());
      if (selectedProvince !== 'All') params.set('province', selectedProvince);
      if (selectedCategory !== 'All') params.set('category', selectedCategory);
      if (selectedSponsorship !== 'All') params.set('sponsorship', selectedSponsorship);
      if (selectedExperience !== 'All') params.set('experienceLevel', selectedExperience);
      const list = await apiFetch<JobListing[]>(`/api/jobs?${params.toString()}`);
      setJobs(list);
    } finally {
      setLoadingJobs(false);
    }
  }, [
    searchQuery,
    selectedProvince,
    selectedCategory,
    selectedSponsorship,
    selectedExperience,
  ]);

  useEffect(() => {
    loadSession();
    Promise.all([
      apiFetch<PublicStats>('/api/stats'),
      apiFetch<CategorySummary[]>('/api/categories'),
      apiFetch<{ services: ServiceItem[]; affiliates: AffiliatePartner[]; cadToKesRate: number }>(
        '/api/services'
      ),
      apiFetch<BlogArticle[]>('/api/blog'),
      apiFetch<FaqItem[]>('/api/faqs'),
      apiFetch<TestimonialItem[]>('/api/testimonials'),
    ])
      .then(([st, cats, srvRes, blogs, faqList, testList]) => {
        setStats(st);
        setCategories(cats);
        setServices(srvRes.services);
        setAffiliates(srvRes.affiliates);
        setCadToKesRate(srvRes.cadToKesRate);
        setArticles(blogs);
        setFaqs(faqList);
        setTestimonials(testList);
      })
      .catch((err) => console.error('Initial data load error:', err));
  }, [loadSession]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  function handleNavigate(view: 'home' | 'dashboard', sectionId?: string) {
    setActiveView(view);
    if (view === 'home' && sectionId) {
      setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
      }, 60);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function handleFocusJobSearch() {
    setActiveView('home');
    setTimeout(() => {
      document.getElementById('jobs-section')?.scrollIntoView({ behavior: 'smooth' });
      jobSearchInputRef.current?.focus();
    }, 80);
  }

  async function handleLogout() {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network errors during logout
    } finally {
      setAuthToken(null);
      setUser(null);
      setAssignedAgent(null);
      setNotifications([]);
      setActiveView('home');
    }
  }

  async function handleToggleSaveJob(jobId: string) {
    if (!user) {
      setAuthModalMode('login');
      return;
    }
    try {
      const res = await apiFetch<{ saved: boolean; savedJobIds: string[] }>(
        `/api/jobs/${jobId}/save`,
        { method: 'POST' }
      );
      setUser((prev) => (prev ? { ...prev, savedJobIds: res.savedJobIds } : prev));
    } catch (err) {
      if (err instanceof Error && err.message.includes('Premium')) {
        const sub = services.find((s) => s.id === 'srv_sub_monthly');
        if (sub) setCheckoutService(sub);
      }
    }
  }

  async function handleLeadSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLeadError('');
    setLeadSubmitting(true);
    try {
      const created = await apiFetch<LeadRecord>('/api/leads', {
        method: 'POST',
        body: JSON.stringify({
          fullName: leadName,
          email: leadEmail,
          phone: leadPhone,
          countryOfResidence: leadCountry,
          preferredJobCategory: leadCategory,
          preferredProvince: leadProvince,
          workExperience: leadExperience,
          assistanceType: leadAssistance,
          message: leadMessage,
        }),
      });
      setLeadConfirmed(created);
      setLeadMessage('');
    } catch (err) {
      setLeadError(err instanceof Error ? err.message : 'Failed to submit relocation inquiry.');
    } finally {
      setLeadSubmitting(false);
    }
  }

  async function handleMarkNotifRead(id: string) {
    await apiFetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }

  return (
    <div className="min-h-screen bg-[#F4F7FA] text-[#0A1D3D]">
      {activeView === 'dashboard' && user ? (
        <DashboardView
          user={user}
          profileStrength={profileStrength}
          assignedAgent={assignedAgent}
          jobs={jobs}
          services={services}
          affiliates={affiliates}
          articles={articles}
          notifications={notifications}
          currency={currency}
          cadToKesRate={cadToKesRate}
          onToggleCurrency={() => setCurrency((c) => (c === 'CAD' ? 'KES' : 'CAD'))}
          onMarkNotificationRead={handleMarkNotifRead}
          onUserUpdated={(updatedUser, strength) => {
            setUser(updatedUser);
            setProfileStrength(strength);
          }}
          onOpenJob={(job) => setSelectedJob(job)}
          onToggleSaveJob={handleToggleSaveJob}
          onOpenCheckout={(srv) => setCheckoutService(srv)}
          onBackToSite={() => setActiveView('home')}
          onLogout={handleLogout}
        />
      ) : (
        <>
          <Navbar
            user={user}
            onNavigate={handleNavigate}
            onFocusSearch={handleFocusJobSearch}
            onOpenAuth={(mode = 'login') => setAuthModalMode(mode)}
            onLogout={handleLogout}
          />

          <main>
            {/* ==================== HERO SECTION (EXACT REFERENCE COMPOSITE) ==================== */}
            <section className="relative min-h-[540px] overflow-hidden bg-[#EEF3FB]">
              <ExactHeroPhotoLayer />

              <div className="relative z-10 mx-auto max-w-7xl px-4 pb-16 pt-12 sm:px-6 lg:py-20">
                <div className="grid items-center gap-8 lg:grid-cols-12">
                  {/* Left Hero Copy */}
                  <div className="lg:col-span-5">
                    <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#F5D0D6] bg-[#FFF1F3]/95 px-4 py-1.5 text-xs font-bold text-[#0A1D3D] shadow-xs backdrop-blur-sm">
                      <MapleLeafIcon className="h-4 w-4 text-[#E01E37]" />
                      <span>Dream. Apply. Thrive.</span>
                    </div>

                    <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.06] tracking-tight text-[#0A1D3D] sm:text-5xl lg:text-[56px]">
                      Your Career
                      <br />
                      in <span className="text-[#E01E37]">Canada</span>
                      <br />
                      <span className="relative inline-block">
                        Starts Here!
                        <svg
                          viewBox="0 0 260 16"
                          className="mt-0.5 h-3.5 w-full text-[#E01E37]"
                          fill="none"
                          aria-hidden="true"
                        >
                          <path
                            d="M4 11 C75 3, 185 3, 256 10"
                            stroke="currentColor"
                            strokeWidth="4.5"
                            strokeLinecap="round"
                          />
                        </svg>
                      </span>
                    </h1>

                    <p className="mt-4 max-w-md text-[15px] font-medium leading-relaxed text-[#2C3E5D]">
                      Explore job opportunities, get expert guidance, and build a successful career
                      in Canada.
                    </p>

                    <div className="mt-7 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          user ? setActiveView('dashboard') : setAuthModalMode('register')
                        }
                        className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#E61E3A] to-[#C2142B] px-6 py-3.5 text-sm font-bold text-white shadow-lg transition hover:opacity-95 whitespace-nowrap"
                      >
                        <span>{user ? 'Open Dashboard' : 'Create Your Account'}</span>
                        <ArrowRight className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowVideoBriefing(true)}
                        className="inline-flex items-center gap-2.5 rounded-full border border-slate-200/90 bg-white/95 px-5 py-3.5 text-sm font-bold text-[#0A1D3D] shadow-sm backdrop-blur transition hover:bg-white whitespace-nowrap"
                      >
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#E01E37] text-white">
                          <Play className="ml-0.5 h-2.5 w-2.5 fill-current" />
                        </span>
                        <span>Watch Video</span>
                      </button>
                    </div>
                  </div>

                  {/* Spacer over the smiling professionals + CN tower + flag */}
                  <div className="hidden lg:col-span-4 lg:block" />

                  {/* Right 3 Stacked Glass Feature Cards (matching exact positions over hero background) */}
                  <div className="flex flex-col justify-center gap-3.5 lg:col-span-3">
                    <button
                      type="button"
                      onClick={() => handleNavigate('home', 'jobs-section')}
                      className="flex items-center gap-3.5 rounded-2xl border border-white/95 bg-white/92 p-4 text-left shadow-lg backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FFF0F2] text-[#E01E37]">
                        <Briefcase className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-display text-sm font-extrabold text-[#0A1D3D]">
                          Find Your Ideal Job
                        </div>
                        <div className="text-xs text-slate-600">
                          Access thousands of jobs across Canada
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleNavigate('home', 'relocation-desk')}
                      className="flex items-center gap-3.5 rounded-2xl border border-white/95 bg-white/92 p-4 text-left shadow-lg backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EEF3FC] text-[#1A4B9F]">
                        <GraduationCap className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-display text-sm font-extrabold text-[#0A1D3D]">
                          Get Career Guidance
                        </div>
                        <div className="text-xs text-slate-600">
                          From experts and mentors
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleNavigate('home', 'guides-section')}
                      className="flex items-center gap-3.5 rounded-2xl border border-white/95 bg-white/92 p-4 text-left shadow-lg backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FFF0F2] text-[#E01E37]">
                        <TrendingUp className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-display text-sm font-extrabold text-[#0A1D3D]">
                          Grow Your Skills
                        </div>
                        <div className="text-xs text-slate-600">
                          With certified courses and resources
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* ==================== LIVE STATS BAR ==================== */}
            <section className="mx-auto -mt-4 max-w-7xl px-4 sm:px-6 relative z-20">
              <div className="grid gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:grid-cols-4">
                <div>
                  <div className="font-mono text-2xl font-extrabold text-[#0A1D3D] tabular-nums">
                    {stats?.availableJobs ?? '—'}
                  </div>
                  <div className="text-xs font-medium text-slate-500">Active Canadian Roles</div>
                </div>
                <div>
                  <div className="font-mono text-2xl font-extrabold text-[#0A1D3D] tabular-nums">
                    {stats?.verifiedEmployers ?? '—'}
                  </div>
                  <div className="text-xs font-medium text-slate-500">Verified Employers</div>
                </div>
                <div>
                  <div className="font-mono text-2xl font-extrabold text-[#0A1D3D] tabular-nums">
                    {stats?.registeredApplicants ?? '—'}
                  </div>
                  <div className="text-xs font-medium text-slate-500">Registered Applicants</div>
                </div>
                <div>
                  <div className="font-mono text-2xl font-extrabold text-[#E01E37] tabular-nums">
                    {stats?.totalActiveAgents ?? '—'}
                  </div>
                  <div className="text-xs font-medium text-slate-500">Advising Specialists</div>
                </div>
              </div>
            </section>

            {/* ==================== IN-DEMAND SECTORS ==================== */}
            <section id="sectors-section" className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <div className="text-xs font-bold text-[#E01E37]">Canadian Labour Demand</div>
                  <h2 className="mt-1 font-display text-2xl font-extrabold text-[#0A1D3D]">
                    Explore High-Demand Sectors
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCategory('All')}
                  className="text-xs font-bold text-[#E01E37] hover:underline"
                >
                  Show All Sectors →
                </button>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {categories.map((cat) => {
                  const active = selectedCategory === cat.name;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(active ? 'All' : cat.name);
                        document
                          .getElementById('jobs-section')
                          ?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className={`rounded-2xl border p-4 text-left transition ${
                        active
                          ? 'border-[#0A1D3D] bg-[#0A1D3D] text-white shadow-md'
                          : 'border-slate-200/80 bg-white hover:border-[#0A1D3D]/40'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className={active ? 'text-[#FF8A95]' : 'text-[#E01E37]'}>
                          {cat.demandLevel}
                        </span>
                        <span className="font-mono tabular-nums opacity-80">
                          {cat.jobCount} jobs
                        </span>
                      </div>
                      <h3 className="mt-2 font-display text-sm font-extrabold">{cat.name}</h3>
                      <p
                        className={`mt-1 line-clamp-2 text-xs ${
                          active ? 'text-slate-300' : 'text-slate-500'
                        }`}
                      >
                        {cat.description}
                      </p>
                      <div
                        className={`mt-3 font-mono text-[11px] font-semibold tabular-nums ${
                          active ? 'text-emerald-300' : 'text-emerald-700'
                        }`}
                      >
                        Avg: {cat.averageWageCad}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* ==================== JOBS MARKETPLACE ==================== */}
            <section id="jobs-section" className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
              <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
                  <div>
                    <h2 className="font-display text-xl font-extrabold text-[#0A1D3D]">
                      Verified Canadian Job Marketplace ({jobs.length})
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Every role clearly discloses work permit &amp; LMIA sponsorship status before
                      you submit an Expression of Interest.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setCurrency((c) => (c === 'CAD' ? 'KES' : 'CAD'))}
                    className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 font-mono text-xs font-bold text-[#0A1D3D] hover:bg-slate-100"
                  >
                    Currency: {currency === 'CAD' ? 'CAD $' : 'KES'}
                  </button>
                </div>

                {/* Search + Filters */}
                <div className="mt-4 grid gap-3 lg:grid-cols-12">
                  <div className="relative lg:col-span-4">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      ref={jobSearchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search title, city, or company..."
                      className="w-full rounded-full border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm focus:border-[#0A1D3D] focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 lg:col-span-8">
                    <Filter className="hidden h-4 w-4 text-slate-400 sm:block" />
                    <select
                      value={selectedProvince}
                      onChange={(e) => setSelectedProvince(e.target.value)}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold"
                    >
                      <option value="All">All Provinces</option>
                      {CANADIAN_PROVINCES.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold"
                    >
                      <option value="All">All Sectors</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <select
                      value={selectedSponsorship}
                      onChange={(e) => setSelectedSponsorship(e.target.value)}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold"
                    >
                      <option value="All">All Permit Statuses</option>
                      <option value="lmia_verified">LMIA / Work Permit Verified</option>
                      <option value="employer_supported_case_by_case">Case-by-Case Support</option>
                      <option value="no_sponsorship_verified">No Sponsorship</option>
                    </select>
                    <select
                      value={selectedExperience}
                      onChange={(e) => setSelectedExperience(e.target.value)}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold"
                    >
                      <option value="All">All Experience Levels</option>
                      <option value="Entry Level">Entry Level</option>
                      <option value="Mid Level">Mid Level</option>
                      <option value="Senior Level">Senior Level</option>
                    </select>
                  </div>
                </div>

                {loadingJobs ? (
                  <div className="flex items-center justify-center py-12 text-sm text-slate-500">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin text-[#E01E37]" />
                    Loading Canadian job opportunities...
                  </div>
                ) : jobs.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-sm font-semibold text-slate-600">
                      No jobs match your current filters.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedProvince('All');
                        setSelectedCategory('All');
                        setSelectedSponsorship('All');
                        setSelectedExperience('All');
                      }}
                      className="mt-3 rounded-full bg-[#0A1D3D] px-5 py-2 text-xs font-bold text-white"
                    >
                      Reset Filters
                    </button>
                  </div>
                ) : (
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    {jobs.map((job) => {
                      const wpBadge = getWorkPermitBadge(job.workPermitSupport);
                      const isSaved = (user?.savedJobIds || []).includes(job.id);
                      return (
                        <div
                          key={job.id}
                          className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-[#FAFBFD] p-5 transition hover:border-[#0A1D3D]/35 hover:bg-white hover:shadow-sm"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white shadow-xs border border-slate-200/70">
                                  <MapleLeafIcon className="h-6 w-6 text-[#E01E37]" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500">
                                    <span className="text-emerald-700">{wpBadge.label}</span>
                                    {job.featured && (
                                      <>
                                        <span aria-hidden="true">·</span>
                                        <span className="text-[#E01E37]">Featured</span>
                                      </>
                                    )}
                                  </div>
                                  <h3 className="mt-1 font-display text-base font-extrabold text-[#0A1D3D]">
                                    {job.title}
                                  </h3>
                                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                                    <span className="inline-flex items-center gap-1">
                                      <Building2 className="h-3.5 w-3.5 text-slate-400" />
                                      {job.companyName}
                                    </span>
                                    <span className="inline-flex items-center gap-1">
                                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                                      {job.city}, {job.province}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleToggleSaveJob(job.id)}
                                className={`rounded-full border p-2 ${
                                  isSaved
                                    ? 'border-[#E01E37] bg-[#E01E37]/10 text-[#E01E37]'
                                    : 'border-slate-200 bg-white text-slate-400 hover:text-[#0A1D3D]'
                                }`}
                                title={isSaved ? 'Saved' : 'Save Job'}
                              >
                                <Bookmark
                                  className="h-4 w-4"
                                  fill={isSaved ? 'currentColor' : 'none'}
                                />
                              </button>
                            </div>

                            <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-slate-600">
                              {job.description}
                            </p>
                          </div>

                          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/70 pt-3">
                            <div>
                              <div className="font-mono text-sm font-extrabold text-[#0A1D3D] tabular-nums">
                                {formatJobSalary(
                                  job.salaryMinCad,
                                  job.salaryMaxCad,
                                  job.salaryUnit,
                                  currency,
                                  cadToKesRate
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {job.employmentType} · {job.experienceLevel}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => setSelectedJob(job)}
                              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#E61E3A] to-[#C2142B] px-4 py-2 text-xs font-bold text-white shadow-xs hover:opacity-95"
                            >
                              <span>Apply Now</span>
                              <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>

            {/* ==================== PROGRAMS & SERVICES ==================== */}
            <section id="services-section" className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
              <div>
                <div className="text-xs font-bold text-[#E01E37]">
                  Transparent Advisory &amp; Preparation Programs
                </div>
                <h2 className="mt-1 font-display text-2xl font-extrabold text-[#0A1D3D]">
                  Canadian CV Preparation, Coaching &amp; Alerts
                </h2>
                <p className="mt-1 max-w-2xl text-sm text-slate-600">
                  Job search and Expression of Interest tracking are free. Optional paid services
                  support <strong>M-Pesa (KES)</strong> and <strong>Stripe (CAD)</strong>.
                </p>
              </div>

              <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {services.map((srv) => (
                  <div
                    key={srv.id}
                    className={`flex flex-col justify-between rounded-2xl border bg-white p-6 shadow-sm ${
                      srv.popular ? 'border-[#E01E37]' : 'border-slate-200/80'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                        <span>{srv.turnaround}</span>
                        {srv.popular && <span className="text-[#E01E37]">Most Popular</span>}
                      </div>
                      <h3 className="mt-2 font-display text-base font-extrabold text-[#0A1D3D]">
                        {srv.name}
                      </h3>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="font-mono text-2xl font-extrabold text-[#0A1D3D] tabular-nums">
                          CAD ${srv.priceCad}
                        </span>
                        <span className="font-mono text-xs font-semibold text-emerald-700 tabular-nums">
                          / KES {Math.round(srv.priceCad * cadToKesRate).toLocaleString()}
                        </span>
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-slate-600">
                        {srv.description}
                      </p>
                      <ul className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-xs text-slate-700">
                        {srv.deliverables.map((d, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                            <span>{d}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (!user) {
                          setAuthModalMode('register');
                        } else {
                          setCheckoutService(srv);
                        }
                      }}
                      className="mt-6 w-full rounded-full bg-[#0A1D3D] py-2.5 text-xs font-bold text-white hover:bg-[#132F5C]"
                    >
                      {user ? 'Proceed with M-Pesa or Card' : 'Create Account to Book'}
                    </button>
                  </div>
                ))}
              </div>

              {affiliates.length > 0 && (
                <div className="mt-8 grid gap-4 md:grid-cols-3">
                  {affiliates.map((aff) => (
                    <a
                      key={aff.id}
                      href={aff.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 transition hover:border-[#0A1D3D]"
                    >
                      <div>
                        <div className="text-[11px] font-bold text-[#E01E37]">{aff.badge}</div>
                        <h4 className="mt-1 font-display text-sm font-bold text-[#0A1D3D]">
                          {aff.name}
                        </h4>
                        <p className="mt-1 text-xs text-slate-600">{aff.description}</p>
                      </div>
                      <ExternalLink className="h-4 w-4 shrink-0 text-slate-400" />
                    </a>
                  ))}
                </div>
              )}
            </section>

            {/* ==================== RELOCATION ADVISORY DESK ==================== */}
            <section
              id="relocation-desk"
              className="bg-gradient-to-br from-[#071A38] via-[#0B234A] to-[#123266] py-14 text-white"
            >
              <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-12">
                <div className="lg:col-span-5">
                  <div className="text-xs font-bold text-[#FF8A95]">
                    Nairobi &amp; Toronto Advisory Desk
                  </div>
                  <h2 className="mt-2 font-display text-2xl font-extrabold sm:text-3xl">
                    Request a Free Relocation Readiness Assessment
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-slate-300">
                    Share your background and preferred Canadian province below to receive a tracked
                    reference number assigned directly to a specialist advisor.
                  </p>

                  <div className="mt-6 space-y-3 rounded-2xl border border-white/15 bg-white/5 p-5 text-xs">
                    <div className="flex items-start gap-2.5">
                      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                      <p className="leading-relaxed text-slate-200">
                        <strong>Anti-Scam Standard:</strong> We never charge fees to issue an LMIA
                        or job offer letter. All career preparation services have transparent pricing
                        and receipts.
                      </p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Users className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                      <p className="leading-relaxed text-slate-200">
                        Supporting international professionals across Kenya, Nigeria, Ghana, Uganda,
                        Tanzania, Rwanda, and South Africa.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-7">
                  {leadConfirmed ? (
                    <div className="rounded-2xl border border-emerald-400/40 bg-emerald-950/50 p-6">
                      <div className="flex items-center gap-2 font-display text-lg font-extrabold text-emerald-300">
                        <CheckCircle2 className="h-6 w-6" />
                        Inquiry Registered ({leadConfirmed.referenceNumber})
                      </div>
                      <p className="mt-2 text-sm text-slate-200">
                        Assigned to advisor <strong>{leadConfirmed.assignedAgentName}</strong> under
                        status <strong>{leadConfirmed.status}</strong>.
                      </p>
                      <button
                        type="button"
                        onClick={() => setLeadConfirmed(null)}
                        className="mt-4 rounded-full bg-white px-5 py-2 text-xs font-bold text-[#0A1D3D]"
                      >
                        Submit Another Inquiry
                      </button>
                    </div>
                  ) : (
                    <form
                      onSubmit={handleLeadSubmit}
                      className="space-y-3.5 rounded-2xl bg-white p-6 text-[#0A1D3D] shadow-xl"
                    >
                      {leadError && (
                        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                          {leadError}
                        </div>
                      )}
                      <div className="grid gap-3 sm:grid-cols-2">
                        <input
                          type="text"
                          required
                          value={leadName}
                          onChange={(e) => setLeadName(e.target.value)}
                          placeholder="Full Name *"
                          className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                        />
                        <input
                          type="email"
                          required
                          value={leadEmail}
                          onChange={(e) => setLeadEmail(e.target.value)}
                          placeholder="Email Address *"
                          className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                        />
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <input
                          type="text"
                          required
                          value={leadPhone}
                          onChange={(e) => setLeadPhone(e.target.value)}
                          placeholder="WhatsApp / Phone (+254...) *"
                          className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                        />
                        <input
                          type="text"
                          required
                          value={leadCountry}
                          onChange={(e) => setLeadCountry(e.target.value)}
                          placeholder="Country of Residence *"
                          className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                        />
                      </div>
                      <div className="grid gap-3 sm:grid-cols-3">
                        <select
                          value={leadCategory}
                          onChange={(e) => setLeadCategory(e.target.value as JobCategory)}
                          className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                        >
                          {categories.map((c) => (
                            <option key={c.id} value={c.name}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                        <select
                          value={leadProvince}
                          onChange={(e) => setLeadProvince(e.target.value as CanadianProvince)}
                          className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                        >
                          {CANADIAN_PROVINCES.map((p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={leadExperience}
                          onChange={(e) => setLeadExperience(e.target.value)}
                          placeholder="Years of Experience"
                          className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                        />
                      </div>
                      <input
                        type="text"
                        value={leadAssistance}
                        onChange={(e) => setLeadAssistance(e.target.value)}
                        placeholder="Assistance Needed"
                        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                      />
                      <textarea
                        rows={3}
                        value={leadMessage}
                        onChange={(e) => setLeadMessage(e.target.value)}
                        placeholder="Tell us about your qualifications, certifications, and timeline..."
                        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                      />
                      <button
                        type="submit"
                        disabled={leadSubmitting}
                        className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#E61E3A] to-[#C2142B] py-3 text-sm font-bold text-white shadow-md hover:opacity-95 disabled:opacity-60"
                      >
                        {leadSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                        <span>Submit Relocation Inquiry</span>
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </section>

            {/* ==================== GUIDES, TESTIMONIALS & FAQS ==================== */}
            <section id="guides-section" className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
              <div>
                <div className="text-xs font-bold text-[#E01E37]">Career Resources</div>
                <h2 className="mt-1 font-display text-2xl font-extrabold text-[#0A1D3D]">
                  Canadian Career &amp; Relocation Guides
                </h2>
              </div>

              <div className="mt-6 grid gap-5 md:grid-cols-3">
                {articles.map((art) => (
                  <article
                    key={art.id}
                    className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"
                  >
                    <div>
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                        <span className="text-[#E01E37]">{art.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>{art.readTime}</span>
                      </div>
                      <h3 className="mt-2 font-display text-base font-extrabold text-[#0A1D3D]">
                        {art.title}
                      </h3>
                      <p className="mt-2 text-xs leading-relaxed text-slate-600">{art.excerpt}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveArticle(art)}
                      className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#0A1D3D] hover:text-[#E01E37]"
                    >
                      <BookOpen className="h-3.5 w-3.5" />
                      Read Full Guide
                    </button>
                  </article>
                ))}
              </div>

              {/* Testimonials + FAQs */}
              <div id="faq-section" className="mt-12 grid gap-8 lg:grid-cols-12">
                <div className="space-y-4 lg:col-span-5">
                  <h3 className="font-display text-xl font-extrabold text-[#0A1D3D]">
                    Applicant Stories
                  </h3>
                  {testimonials.map((t) => (
                    <div
                      key={t.id}
                      className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"
                    >
                      <p className="text-xs italic leading-relaxed text-slate-700">
                        &ldquo;{t.quote}&rdquo;
                      </p>
                      <div className="mt-3 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-[#0A1D3D]">{t.name}</div>
                          <div className="text-slate-500">
                            {t.originCountry} → {t.destinationCity} · {t.role}
                          </div>
                        </div>
                        <span className="text-[11px] text-slate-400">{t.dateLabel}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 lg:col-span-7">
                  <h3 className="font-display text-xl font-extrabold text-[#0A1D3D]">
                    Support &amp; Frequently Asked Questions
                  </h3>
                  {faqs.map((faq) => {
                    const open = openFaqId === faq.id;
                    return (
                      <div
                        key={faq.id}
                        className="rounded-2xl border border-slate-200/80 bg-white shadow-sm"
                      >
                        <button
                          type="button"
                          onClick={() => setOpenFaqId(open ? null : faq.id)}
                          className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
                        >
                          <div>
                            <div className="text-[11px] font-bold text-[#E01E37]">
                              {faq.category}
                            </div>
                            <div className="font-display text-sm font-bold text-[#0A1D3D]">
                              {faq.question}
                            </div>
                          </div>
                          <ChevronDown
                            className={`h-4 w-4 shrink-0 text-slate-400 transition ${
                              open ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                        {open && (
                          <div className="border-t border-slate-100 px-5 py-3.5 text-xs leading-relaxed text-slate-600">
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          </main>

          {/* FOOTER */}
          <footer className="border-t border-slate-200 bg-white py-10">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div className="max-w-xl">
                  <div className="flex items-center gap-2 font-display text-base font-extrabold text-[#0A1D3D]">
                    <MapleLeafIcon className="h-5 w-5 text-[#E01E37]" />
                    <span>Canada Career Connect</span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-slate-500">
                    Disclaimer: Canada Career Connect is an independent international recruitment
                    discovery and relocation guidance platform. We are not affiliated with the
                    Government of Canada or Immigration, Refugees and Citizenship Canada (IRCC). We
                    do not sell job offers, LMIAs, or visas.
                  </p>
                </div>
                <div className="text-xs text-slate-500">
                  <div>© {new Date().getFullYear()} Canada Career Connect</div>
                  <div className="mt-1">Nairobi &amp; Toronto Career Advisory Desk</div>
                </div>
              </div>
            </div>
          </footer>
        </>
      )}

      {/* MODALS */}
      {authModalMode && (
        <AuthModal
          initialMode={authModalMode}
          onClose={() => setAuthModalMode(null)}
          onSuccess={(u, strength) => {
            setUser(u);
            setProfileStrength(strength);
            setAuthModalMode(null);
            setActiveView('dashboard');
            apiFetch<NotificationRecord[]>('/api/notifications')
              .then((notifs) => setNotifications(notifs))
              .catch(() => setNotifications([]));
          }}
        />
      )}

      {selectedJob && (
        <JobDetailModal
          job={selectedJob}
          user={user}
          currency={currency}
          cadToKesRate={cadToKesRate}
          isSaved={(user?.savedJobIds || []).includes(selectedJob.id)}
          onToggleSave={handleToggleSaveJob}
          onRequireAuth={() => {
            setSelectedJob(null);
            setAuthModalMode('login');
          }}
          onApplicationSubmitted={() => {
            loadSession();
          }}
          onClose={() => setSelectedJob(null)}
        />
      )}

      {checkoutService && user && (
        <CheckoutModal
          service={checkoutService}
          user={user}
          cadToKesRate={cadToKesRate}
          onClose={() => setCheckoutService(null)}
          onPaid={() => {
            loadSession();
          }}
        />
      )}

      {activeArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A1D3D]/65 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-bold text-[#E01E37]">
                  {activeArticle.category} · {activeArticle.readTime}
                </div>
                <h2 className="mt-1 font-display text-xl font-extrabold text-[#0A1D3D]">
                  {activeArticle.title}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  By {activeArticle.author} · {activeArticle.publishedAt}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveArticle(null)}
                className="rounded-full border border-slate-200 px-3.5 py-1.5 text-xs font-bold text-slate-600"
              >
                Close
              </button>
            </div>
            <div className="mt-5 space-y-4 text-sm leading-relaxed text-slate-700">
              {activeArticle.content.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      {showVideoBriefing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A1D3D]/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-bold text-[#E01E37]">Platform Walkthrough</div>
                <h2 className="mt-1 font-display text-xl font-extrabold text-[#0A1D3D]">
                  How Canada Career Connect Works (4 Steps)
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowVideoBriefing(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="font-mono text-xs font-bold text-[#E01E37]">01</div>
                <h3 className="mt-1 font-display text-sm font-extrabold text-[#0A1D3D]">
                  Create Your Free Profile
                </h3>
                <p className="mt-1 text-xs text-slate-600">
                  Build your Canadian readiness score and upload your CV to the document vault.
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="font-mono text-xs font-bold text-[#E01E37]">02</div>
                <h3 className="mt-1 font-display text-sm font-extrabold text-[#0A1D3D]">
                  Inspect Work Permit Status
                </h3>
                <p className="mt-1 text-xs text-slate-600">
                  Filter roles by LMIA Verified, Case-by-Case Support, or Canadian Permit Required.
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="font-mono text-xs font-bold text-[#E01E37]">03</div>
                <h3 className="mt-1 font-display text-sm font-extrabold text-[#0A1D3D]">
                  Track Expressions of Interest
                </h3>
                <p className="mt-1 text-xs text-slate-600">
                  Receive a tracked EOI code and follow progress across 7 clear milestone stages.
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="font-mono text-xs font-bold text-[#E01E37]">04</div>
                <h3 className="mt-1 font-display text-sm font-extrabold text-[#0A1D3D]">
                  Optional Advisor Guidance
                </h3>
                <p className="mt-1 text-xs text-slate-600">
                  Book Canadian CV rewrites or 1-on-1 consultations with M-Pesa (KES) or Stripe (CAD).
                </p>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowVideoBriefing(false);
                  if (user) {
                    setActiveView('dashboard');
                  } else {
                    setAuthModalMode('register');
                  }
                }}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#E61E3A] to-[#C2142B] px-5 py-2.5 text-xs font-bold text-white"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>{user ? 'Go to Dashboard' : 'Create Free Account'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
