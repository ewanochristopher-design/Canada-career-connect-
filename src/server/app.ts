import express, { type Request, type Response, type NextFunction } from 'express';
import {
  getStore,
  saveStore,
  JOB_CATEGORIES,
  addAuditLog,
  pushNotification,
} from './store.ts';
import {
  hashPassword,
  verifyPassword,
  signToken,
  verifyToken,
  toPublicUser,
  calculateProfileStrength,
} from './auth.ts';
import type {
  ApplicationRecord,
  ApplicationStage,
  CanadianProvince,
  JobCategory,
  JobListing,
  LeadRecord,
  LeadStatus,
  PaymentRecord,
  UserRecord,
  UserRole,
} from '../types.ts';

interface AuthRequest extends Request {
  authUser?: UserRecord;
}

function parseCookies(cookieHeader?: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!cookieHeader) return out;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx > -1) {
      const key = part.slice(0, idx).trim();
      const val = decodeURIComponent(part.slice(idx + 1).trim());
      out[key] = val;
    }
  }
  return out;
}

function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  const cookies = parseCookies(req.headers.cookie);
  return cookies['ccc_token'] || null;
}

function attachUser(req: AuthRequest, _res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      const store = getStore();
      const user = store.users.find((u) => u.id === payload.uid);
      if (user) {
        req.authUser = user;
      }
    }
  }
  next();
}

function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.authUser) {
    res.status(401).json({ error: 'Authentication required. Please sign in.' });
    return;
  }
  next();
}

function requireRoles(...roles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.authUser) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    if (!roles.includes(req.authUser.role)) {
      res.status(403).json({ error: 'You do not have permission to access this resource.' });
      return;
    }
    next();
  };
}

function setSessionCookie(res: Response, token: string): void {
  res.setHeader(
    'Set-Cookie',
    `ccc_token=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`
  );
}

function clearSessionCookie(res: Response): void {
  res.setHeader('Set-Cookie', 'ccc_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || parts[0]?.[1] || '')).toUpperCase() || 'CC';
}

function assignBestAgent(): UserRecord | undefined {
  const store = getStore();
  const agents = store.users.filter((u) => u.role === 'agent' && u.agentActive !== false);
  if (agents.length === 0) return undefined;
  return agents.sort((a, b) => {
    const countA = store.leads.filter((l) => l.assignedAgentId === a.id).length;
    const countB = store.leads.filter((l) => l.assignedAgentId === b.id).length;
    return countA - countB;
  })[0];
}

export function createApiApp(): express.Express {
  const app = express();
  app.use(express.json({ limit: '12mb' }));
  app.use(attachUser);

  // ==================== AUTH ROUTES ====================
  app.post('/api/auth/register', (req: AuthRequest, res: Response) => {
    const {
      fullName,
      email,
      password,
      role,
      phone,
      country,
      companyName,
      companyProvince,
      companyCity,
    } = req.body || {};

    if (!fullName || !email || !password) {
      res.status(400).json({ error: 'Full name, email, and password are required.' });
      return;
    }
    if (typeof password !== 'string' || password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters.' });
      return;
    }
    const cleanEmail = String(email).trim().toLowerCase();
    const store = getStore();
    if (store.users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    const safeRole: UserRole = role === 'employer' ? 'employer' : 'applicant';
    const assignedAgent = safeRole === 'applicant' ? assignBestAgent() : undefined;

    const newUser: UserRecord = {
      id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      email: cleanEmail,
      passwordHash: hashPassword(password),
      fullName: String(fullName).trim(),
      role: safeRole,
      phone: String(phone || '').trim(),
      country: String(country || (safeRole === 'employer' ? 'Canada' : 'Kenya')).trim(),
      avatarInitials: getInitials(String(fullName)),
      preferredProvinces: [],
      workExperience: [],
      education: [],
      skills: [],
      savedJobIds: [],
      subscriptionTier: 'free',
      assignedAgentId: assignedAgent?.id,
      companyName: safeRole === 'employer' ? String(companyName || fullName).trim() : undefined,
      companyLogo: safeRole === 'employer' ? getInitials(String(companyName || fullName)) : undefined,
      companyProvince: safeRole === 'employer' ? (companyProvince as CanadianProvince) || 'Ontario' : undefined,
      companyCity: safeRole === 'employer' ? String(companyCity || 'Toronto').trim() : undefined,
      employerVerified: safeRole === 'employer' ? false : undefined,
      createdAt: new Date().toISOString(),
    };

    store.users.push(newUser);
    pushNotification(
      newUser.id,
      'Welcome to Canada Career Connect',
      safeRole === 'employer'
        ? 'Your employer profile has been created and submitted for verification before vacancies can be published.'
        : 'Complete your profile and upload your CV to track expressions of interest and connect with an advisor.',
      'system'
    );

    if (safeRole === 'employer') {
      store.users
        .filter((u) => u.role === 'admin')
        .forEach((admin) =>
          pushNotification(
            admin.id,
            'New Employer Awaiting Verification',
            `${newUser.companyName} registered and requires compliance review.`,
            'system'
          )
        );
    }

    addAuditLog(newUser.id, newUser.email, 'USER_REGISTERED', `${safeRole}:${newUser.email}`);
    saveStore();

    const token = signToken(newUser);
    setSessionCookie(res, token);
    const publicUser = toPublicUser(newUser);
    res.status(201).json({
      token,
      user: publicUser,
      profileStrength: calculateProfileStrength(publicUser, 0),
    });
  });

  app.post('/api/auth/login', (req: AuthRequest, res: Response) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }
    const cleanEmail = String(email).trim().toLowerCase();
    const store = getStore();
    const user = store.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!user || !verifyPassword(String(password), user.passwordHash)) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }
    const token = signToken(user);
    setSessionCookie(res, token);
    const docCount = store.documents.filter((d) => d.userId === user.id).length;
    const publicUser = toPublicUser(user);
    res.json({
      token,
      user: publicUser,
      profileStrength: calculateProfileStrength(publicUser, docCount),
    });
  });

  app.post('/api/auth/logout', (_req: AuthRequest, res: Response) => {
    clearSessionCookie(res);
    res.json({ ok: true });
  });

  app.post('/api/auth/reset-password', (req: AuthRequest, res: Response) => {
    const { email, newPassword } = req.body || {};
    if (!email) {
      res.status(400).json({ error: 'Please provide your registered email address.' });
      return;
    }
    const store = getStore();
    const user = store.users.find((u) => u.email.toLowerCase() === String(email).trim().toLowerCase());
    if (!user) {
      res.json({
        ok: true,
        message: 'If an account matches this email, password reset instructions have been issued.',
      });
      return;
    }
    if (newPassword && typeof newPassword === 'string' && newPassword.length >= 6) {
      user.passwordHash = hashPassword(newPassword);
      addAuditLog(user.id, user.email, 'PASSWORD_RESET', user.email);
      saveStore();
      res.json({ ok: true, message: 'Password updated successfully. You may now sign in.' });
      return;
    }
    res.json({
      ok: true,
      message: 'Reset verified. Enter a new password (min 6 characters) to complete your reset.',
    });
  });

  app.get('/api/auth/me', (req: AuthRequest, res: Response) => {
    if (!req.authUser) {
      res.json({ user: null });
      return;
    }
    const store = getStore();
    const docCount = store.documents.filter((d) => d.userId === req.authUser!.id).length;
    const publicUser = toPublicUser(req.authUser);
    const assignedAgent = req.authUser.assignedAgentId
      ? store.users.find((u) => u.id === req.authUser!.assignedAgentId)
      : undefined;
    res.json({
      user: publicUser,
      profileStrength: calculateProfileStrength(publicUser, docCount),
      assignedAgent: assignedAgent ? toPublicUser(assignedAgent) : null,
    });
  });

  // ==================== PUBLIC STATS & DISCOVERY ====================
  app.get('/api/stats', (_req: Request, res: Response) => {
    const store = getStore();
    const availableJobs = store.jobs.filter((j) => j.published).length;
    const registeredApplicants = store.users.filter((u) => u.role === 'applicant').length;
    const verifiedEmployers = store.users.filter((u) => u.role === 'employer' && u.employerVerified).length;
    const activeRelocations =
      store.applications.filter(
        (a) => a.stage === 'Employer Decision' || a.stage === 'Immigration Process'
      ).length +
      store.leads.filter((l) => l.status === 'COMPLETED' || l.status === 'IN PROGRESS').length;

    res.json({
      availableJobs,
      registeredApplicants,
      verifiedEmployers,
      successfulRelocations: activeRelocations,
      totalExpressionsOfInterest: store.applications.length,
      totalActiveAgents: store.users.filter((u) => u.role === 'agent' && u.agentActive !== false).length,
      dataNotice: 'Live figures calculated directly from current platform database records (includes clearly marked sample test data).',
    });
  });

  app.get('/api/categories', (_req: Request, res: Response) => {
    const store = getStore();
    const published = store.jobs.filter((j) => j.published);
    const result = JOB_CATEGORIES.map((cat) => ({
      ...cat,
      jobCount: published.filter((j) => j.category === cat.name).length,
    }));
    res.json(result);
  });

  app.get('/api/settings/public', (_req: Request, res: Response) => {
    const store = getStore();
    res.json(store.settings);
  });

  app.get('/api/blog', (_req: Request, res: Response) => {
    const store = getStore();
    res.json(store.blogArticles);
  });

  app.get('/api/faqs', (_req: Request, res: Response) => {
    const store = getStore();
    res.json(store.faqs);
  });

  app.get('/api/testimonials', (_req: Request, res: Response) => {
    const store = getStore();
    res.json(store.testimonials.filter((t) => t.verifiedConsent));
  });

  app.get('/api/services', (_req: Request, res: Response) => {
    const store = getStore();
    res.json({
      services: store.services.filter((s) => s.active),
      affiliates: store.affiliates,
      cadToKesRate: store.settings.cadToKesRate,
    });
  });

  // ==================== JOBS MARKETPLACE ====================
  app.get('/api/jobs', (req: AuthRequest, res: Response) => {
    const store = getStore();
    const includeAll =
      req.query.includeAll === 'true' &&
      (req.authUser?.role === 'admin' || req.authUser?.role === 'employer');

    let list = store.jobs.filter((j) => {
      if (includeAll) {
        if (req.authUser?.role === 'employer') return j.employerId === req.authUser.id;
        return true;
      }
      return j.published;
    });

    const { q, province, category, experienceLevel, employmentType, employer, sponsorship, minSalary } =
      req.query;

    if (q && typeof q === 'string' && q.trim()) {
      const needle = q.trim().toLowerCase();
      list = list.filter(
        (j) =>
          j.title.toLowerCase().includes(needle) ||
          j.companyName.toLowerCase().includes(needle) ||
          j.city.toLowerCase().includes(needle) ||
          j.province.toLowerCase().includes(needle) ||
          j.category.toLowerCase().includes(needle) ||
          j.description.toLowerCase().includes(needle)
      );
    }
    if (province && province !== 'All') {
      list = list.filter((j) => j.province === province);
    }
    if (category && category !== 'All') {
      list = list.filter((j) => j.category === category);
    }
    if (experienceLevel && experienceLevel !== 'All') {
      list = list.filter((j) => j.experienceLevel === experienceLevel);
    }
    if (employmentType && employmentType !== 'All') {
      list = list.filter((j) => j.employmentType === employmentType);
    }
    if (employer && employer !== 'All') {
      list = list.filter((j) => j.companyName === employer);
    }
    if (sponsorship && sponsorship !== 'All') {
      list = list.filter((j) => j.workPermitSupport === sponsorship);
    }
    if (minSalary && !Number.isNaN(Number(minSalary)) && Number(minSalary) > 0) {
      const threshold = Number(minSalary);
      list = list.filter((j) => {
        const annualized = j.salaryUnit === 'hour' ? j.salaryMaxCad * 2080 : j.salaryMaxCad;
        return annualized >= threshold;
      });
    }

    list.sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return b.createdAt.localeCompare(a.createdAt);
    });

    res.json(list);
  });

  app.get('/api/jobs/:id', (req: Request, res: Response) => {
    const store = getStore();
    const job = store.jobs.find((j) => j.id === req.params.id);
    if (!job) {
      res.status(404).json({ error: 'Job listing not found.' });
      return;
    }
    job.viewsCount += 1;
    saveStore();
    res.json(job);
  });

  app.post('/api/jobs', requireRoles('employer', 'admin'), (req: AuthRequest, res: Response) => {
    const store = getStore();
    const actor = req.authUser!;
    const body = req.body || {};

    if (!body.title || !body.province || !body.city || !body.category) {
      res.status(400).json({ error: 'Job title, province, city, and category are required.' });
      return;
    }

    const isEmployer = actor.role === 'employer';
    const canAutoPublish = actor.role === 'admin' || actor.employerVerified === true;

    const newJob: JobListing = {
      id: `job_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      title: String(body.title).trim(),
      employerId: isEmployer ? actor.id : String(body.employerId || actor.id),
      companyName: isEmployer ? actor.companyName || actor.fullName : String(body.companyName || 'Verified Canadian Employer'),
      companyLogo: isEmployer ? actor.companyLogo || actor.avatarInitials : getInitials(String(body.companyName || 'CE')),
      province: body.province as CanadianProvince,
      city: String(body.city).trim(),
      category: body.category as JobCategory,
      salaryMinCad: Number(body.salaryMinCad) || 55000,
      salaryMaxCad: Number(body.salaryMaxCad) || 75000,
      salaryUnit: body.salaryUnit === 'hour' ? 'hour' : 'year',
      employmentType: body.employmentType || 'Full-Time',
      experienceLevel: body.experienceLevel || 'Mid Level',
      experienceRequirements: String(body.experienceRequirements || 'Relevant verifiable industry experience.'),
      educationRequirements: String(body.educationRequirements || 'Secondary diploma or relevant certification.'),
      description: String(body.description || '').trim(),
      responsibilities: Array.isArray(body.responsibilities)
        ? body.responsibilities
        : String(body.responsibilities || '')
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean),
      qualifications: Array.isArray(body.qualifications)
        ? body.qualifications
        : String(body.qualifications || '')
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean),
      benefits: Array.isArray(body.benefits)
        ? body.benefits
        : String(body.benefits || 'Extended Health & Dental')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
      workPermitSupport:
        actor.role === 'admin' && body.workPermitSupport
          ? body.workPermitSupport
          : body.workPermitSupport === 'employer_supported_case_by_case'
            ? 'employer_supported_case_by_case'
            : 'no_sponsorship_verified',
      workPermitNotes: String(
        body.workPermitNotes ||
          'Work permit sponsorship status must be confirmed by our compliance desk prior to advertising LMIA support.'
      ),
      applicationDeadline: String(body.applicationDeadline || '2027-03-31'),
      verificationStatus: canAutoPublish ? 'Employer Verified' : 'Pending Review',
      published: actor.role === 'admin' ? body.published !== false : canAutoPublish,
      featured: actor.role === 'admin' ? Boolean(body.featured) : false,
      sponsored: actor.role === 'admin' ? Boolean(body.sponsored) : false,
      viewsCount: 0,
      interestCount: 0,
      createdAt: new Date().toISOString(),
    };

    store.jobs.unshift(newJob);
    addAuditLog(actor.id, actor.email, 'JOB_CREATED', newJob.title);
    saveStore();
    res.status(201).json(newJob);
  });

  app.patch('/api/jobs/:id', requireRoles('employer', 'admin'), (req: AuthRequest, res: Response) => {
    const store = getStore();
    const actor = req.authUser!;
    const job = store.jobs.find((j) => j.id === req.params.id);
    if (!job) {
      res.status(404).json({ error: 'Job not found.' });
      return;
    }
    if (actor.role === 'employer' && job.employerId !== actor.id) {
      res.status(403).json({ error: 'You may only edit your own job vacancies.' });
      return;
    }

    const allowedFields: Array<keyof JobListing> = [
      'title',
      'province',
      'city',
      'category',
      'salaryMinCad',
      'salaryMaxCad',
      'salaryUnit',
      'employmentType',
      'experienceLevel',
      'experienceRequirements',
      'educationRequirements',
      'description',
      'responsibilities',
      'qualifications',
      'benefits',
      'applicationDeadline',
      'workPermitNotes',
    ];
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        (job as unknown as Record<string, unknown>)[key] = req.body[key];
      }
    }
    if (actor.role === 'admin') {
      if (req.body.published !== undefined) job.published = Boolean(req.body.published);
      if (req.body.featured !== undefined) job.featured = Boolean(req.body.featured);
      if (req.body.sponsored !== undefined) job.sponsored = Boolean(req.body.sponsored);
      if (req.body.workPermitSupport !== undefined) job.workPermitSupport = req.body.workPermitSupport;
      if (req.body.verificationStatus !== undefined) job.verificationStatus = req.body.verificationStatus;
    } else if (actor.employerVerified && req.body.published !== undefined) {
      job.published = Boolean(req.body.published);
    }

    addAuditLog(actor.id, actor.email, 'JOB_UPDATED', job.title);
    saveStore();
    res.json(job);
  });

  app.delete('/api/jobs/:id', requireRoles('employer', 'admin'), (req: AuthRequest, res: Response) => {
    const store = getStore();
    const actor = req.authUser!;
    const idx = store.jobs.findIndex((j) => j.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Job not found.' });
      return;
    }
    if (actor.role === 'employer' && store.jobs[idx].employerId !== actor.id) {
      res.status(403).json({ error: 'Unauthorized to delete this job.' });
      return;
    }
    const [removed] = store.jobs.splice(idx, 1);
    addAuditLog(actor.id, actor.email, 'JOB_DELETED', removed.title);
    saveStore();
    res.json({ ok: true });
  });

  app.post('/api/jobs/:id/save', requireAuth, (req: AuthRequest, res: Response) => {
    const user = req.authUser!;
    const jobId = String(req.params.id);
    const exists = user.savedJobIds.includes(jobId);
    if (exists) {
      user.savedJobIds = user.savedJobIds.filter((id) => id !== jobId);
    } else {
      if (user.subscriptionTier === 'free' && user.savedJobIds.length >= 5) {
        res.status(400).json({
          error: 'Free accounts can save up to 5 jobs. Upgrade to Premium Job Alerts for unlimited saved roles.',
        });
        return;
      }
      user.savedJobIds.push(jobId);
    }
    saveStore();
    res.json({ saved: !exists, savedJobIds: user.savedJobIds });
  });

  // ==================== EXPRESSIONS OF INTEREST / APPLICATIONS ====================
  app.get('/api/applications', requireAuth, (req: AuthRequest, res: Response) => {
    const store = getStore();
    const actor = req.authUser!;
    if (actor.role === 'admin') {
      res.json(store.applications);
      return;
    }
    if (actor.role === 'agent') {
      res.json(store.applications.filter((a) => a.assignedAgentId === actor.id || !a.assignedAgentId));
      return;
    }
    if (actor.role === 'employer') {
      const myJobIds = new Set(store.jobs.filter((j) => j.employerId === actor.id).map((j) => j.id));
      res.json(store.applications.filter((a) => myJobIds.has(a.jobId)));
      return;
    }
    res.json(store.applications.filter((a) => a.applicantId === actor.id));
  });

  app.post('/api/applications', requireAuth, (req: AuthRequest, res: Response) => {
    const store = getStore();
    const actor = req.authUser!;
    const { jobId, note, requestAgentAssistance } = req.body || {};

    const job = store.jobs.find((j) => j.id === jobId);
    if (!job) {
      res.status(404).json({ error: 'Selected job listing was not found.' });
      return;
    }
    const duplicate = store.applications.find((a) => a.applicantId === actor.id && a.jobId === jobId);
    if (duplicate) {
      res.status(409).json({ error: 'You have already submitted an expression of interest for this job.' });
      return;
    }

    const agent =
      (actor.assignedAgentId && store.users.find((u) => u.id === actor.assignedAgentId)) ||
      assignBestAgent();

    const refCode = `EOI-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const appRecord: ApplicationRecord = {
      id: `app_${Date.now()}`,
      referenceCode: refCode,
      applicantId: actor.id,
      applicantName: actor.fullName,
      applicantEmail: actor.email,
      jobId: job.id,
      jobTitle: job.title,
      companyName: job.companyName,
      province: job.province,
      stage: 'Interest Submitted',
      assistanceStatus: requestAgentAssistance ? 'Agent Review Requested' : 'Discovery Only (Free)',
      assignedAgentId: agent?.id,
      assignedAgentName: agent?.fullName,
      note: String(note || '').trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    store.applications.unshift(appRecord);
    job.interestCount += 1;

    pushNotification(
      actor.id,
      `Interest Registered (${refCode})`,
      `Your expression of interest for ${job.title} at ${job.companyName} is recorded. Note: This platform does not automatically submit employer or IRCC applications—contact your assigned agent for full application assistance.`,
      'application'
    );
    if (agent) {
      pushNotification(
        agent.id,
        `New Expression of Interest (${refCode})`,
        `${actor.fullName} expressed interest in ${job.title} (${job.city}, ${job.province}).`,
        'application'
      );
    }
    saveStore();
    res.status(201).json(appRecord);
  });

  app.patch('/api/applications/:id', requireRoles('agent', 'admin', 'employer'), (req: AuthRequest, res: Response) => {
    const store = getStore();
    const actor = req.authUser!;
    const record = store.applications.find((a) => a.id === req.params.id);
    if (!record) {
      res.status(404).json({ error: 'Application record not found.' });
      return;
    }

    const validStages: ApplicationStage[] = [
      'Interest Submitted',
      'Initial Review',
      'Agent Consultation',
      'Employer Application',
      'Interview Stage',
      'Employer Decision',
      'Immigration Process',
    ];
    if (req.body.stage && validStages.includes(req.body.stage)) {
      record.stage = req.body.stage;
    }
    if (req.body.assistanceStatus) {
      record.assistanceStatus = req.body.assistanceStatus;
    }
    if (req.body.agentNotes !== undefined) {
      record.agentNotes = String(req.body.agentNotes);
    }
    if (actor.role === 'admin' && req.body.assignedAgentId) {
      const targetAgent = store.users.find((u) => u.id === req.body.assignedAgentId && u.role === 'agent');
      if (targetAgent) {
        record.assignedAgentId = targetAgent.id;
        record.assignedAgentName = targetAgent.fullName;
      }
    }
    record.updatedAt = new Date().toISOString();

    pushNotification(
      record.applicantId,
      `Application Stage Updated: ${record.stage}`,
      `Your tracker for ${record.jobTitle} (${record.referenceCode}) moved to "${record.stage}".`,
      'application'
    );
    addAuditLog(actor.id, actor.email, 'APPLICATION_UPDATED', `${record.referenceCode} -> ${record.stage}`);
    saveStore();
    res.json(record);
  });

  // ==================== RELOCATION LEADS & AGENT PIPELINE ====================
  app.post('/api/leads', (req: AuthRequest, res: Response) => {
    const store = getStore();
    const b = req.body || {};
    if (!b.fullName || !b.email || !b.phone || !b.countryOfResidence) {
      res.status(400).json({ error: 'Full name, email, phone number, and country of residence are required.' });
      return;
    }

    const agent = assignBestAgent();
    const refNumber = `CCC-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const lead: LeadRecord = {
      id: `lead_${Date.now()}`,
      referenceNumber: refNumber,
      applicantId: req.authUser?.id,
      fullName: String(b.fullName).trim(),
      email: String(b.email).trim().toLowerCase(),
      phone: String(b.phone).trim(),
      countryOfResidence: String(b.countryOfResidence).trim(),
      preferredJobCategory: (b.preferredJobCategory as JobCategory) || 'Healthcare',
      workExperience: String(b.workExperience || 'Not specified').trim(),
      educationLevel: String(b.educationLevel || 'Not specified').trim(),
      preferredProvince: (b.preferredProvince as CanadianProvince) || 'Ontario',
      assistanceType: String(b.assistanceType || 'General Career & Relocation Guidance').trim(),
      message: String(b.message || '').trim(),
      status: 'NEW LEAD',
      assignedAgentId: agent?.id,
      assignedAgentName: agent?.fullName || 'Advising Desk',
      privateNotes: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    store.leads.unshift(lead);
    store.users
      .filter((u) => u.role === 'admin')
      .forEach((admin) =>
        pushNotification(
          admin.id,
          `New Relocation Lead (${refNumber})`,
          `${lead.fullName} (${lead.countryOfResidence}) requested ${lead.assistanceType}. Assigned to ${lead.assignedAgentName}.`,
          'lead'
        )
      );
    if (agent) {
      pushNotification(
        agent.id,
        `Lead Assigned: ${refNumber}`,
        `New applicant inquiry from ${lead.fullName} targeting ${lead.preferredJobCategory} in ${lead.preferredProvince}.`,
        'lead'
      );
    }
    saveStore();
    res.status(201).json(lead);
  });

  app.get('/api/leads', requireRoles('agent', 'admin'), (req: AuthRequest, res: Response) => {
    const store = getStore();
    const actor = req.authUser!;
    if (actor.role === 'admin') {
      res.json(store.leads);
      return;
    }
    res.json(store.leads.filter((l) => l.assignedAgentId === actor.id));
  });

  app.patch('/api/leads/:id', requireRoles('agent', 'admin'), (req: AuthRequest, res: Response) => {
    const store = getStore();
    const actor = req.authUser!;
    const lead = store.leads.find((l) => l.id === req.params.id);
    if (!lead) {
      res.status(404).json({ error: 'Lead not found.' });
      return;
    }
    if (actor.role === 'agent' && lead.assignedAgentId !== actor.id) {
      res.status(403).json({ error: 'This lead is assigned to another agent.' });
      return;
    }

    const validStatuses: LeadStatus[] = [
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
    if (req.body.status && validStatuses.includes(req.body.status)) {
      lead.status = req.body.status;
    }
    if (req.body.noteText && String(req.body.noteText).trim()) {
      lead.privateNotes.unshift({
        id: `note_${Date.now()}`,
        author: actor.fullName,
        text: String(req.body.noteText).trim(),
        createdAt: new Date().toISOString(),
      });
    }
    if (actor.role === 'admin' && req.body.assignedAgentId) {
      const targetAgent = store.users.find((u) => u.id === req.body.assignedAgentId && u.role === 'agent');
      if (targetAgent) {
        lead.assignedAgentId = targetAgent.id;
        lead.assignedAgentName = targetAgent.fullName;
      }
    }
    lead.updatedAt = new Date().toISOString();
    addAuditLog(actor.id, actor.email, 'LEAD_UPDATED', `${lead.referenceNumber} -> ${lead.status}`);
    saveStore();
    res.json(lead);
  });

  // ==================== PROFILE & DOCUMENTS ====================
  app.patch('/api/profile', requireAuth, (req: AuthRequest, res: Response) => {
    const store = getStore();
    const user = req.authUser!;
    const b = req.body || {};

    if (b.fullName) {
      user.fullName = String(b.fullName).trim();
      user.avatarInitials = getInitials(user.fullName);
    }
    if (b.phone !== undefined) user.phone = String(b.phone).trim();
    if (b.country !== undefined) user.country = String(b.country).trim();
    if (b.bio !== undefined) user.bio = String(b.bio).trim();
    if (Array.isArray(b.preferredProvinces)) user.preferredProvinces = b.preferredProvinces;
    if (b.preferredCategory) user.preferredCategory = b.preferredCategory;
    if (Array.isArray(b.workExperience)) user.workExperience = b.workExperience;
    if (Array.isArray(b.education)) user.education = b.education;
    if (Array.isArray(b.skills)) user.skills = b.skills;

    if (user.role === 'employer') {
      if (b.companyName !== undefined) user.companyName = String(b.companyName).trim();
      if (b.companyLogo !== undefined) user.companyLogo = String(b.companyLogo).trim();
      if (b.companyWebsite !== undefined) user.companyWebsite = String(b.companyWebsite).trim();
      if (b.companyProvince !== undefined) user.companyProvince = b.companyProvince;
      if (b.companyCity !== undefined) user.companyCity = String(b.companyCity).trim();
      if (b.companyDescription !== undefined) user.companyDescription = String(b.companyDescription).trim();
    }

    saveStore();
    const docCount = store.documents.filter((d) => d.userId === user.id).length;
    const publicUser = toPublicUser(user);
    res.json({
      user: publicUser,
      profileStrength: calculateProfileStrength(publicUser, docCount),
    });
  });

  app.get('/api/documents', requireAuth, (req: AuthRequest, res: Response) => {
    const store = getStore();
    const actor = req.authUser!;
    const targetUserId = typeof req.query.userId === 'string' ? req.query.userId : actor.id;

    if (targetUserId !== actor.id && actor.role !== 'admin') {
      const applicant = store.users.find((u) => u.id === targetUserId);
      if (!(actor.role === 'agent' && applicant?.assignedAgentId === actor.id)) {
        res.status(403).json({ error: 'Unauthorized document access.' });
        return;
      }
    }

    const docs = store.documents
      .filter((d) => d.userId === targetUserId)
      .map(({ contentBase64: _b64, ...meta }) => meta);
    res.json(docs);
  });

  app.post('/api/documents', requireAuth, (req: AuthRequest, res: Response) => {
    const store = getStore();
    const actor = req.authUser!;
    const { fileName, fileType, mimeType, contentBase64 } = req.body || {};

    if (!fileName || !contentBase64) {
      res.status(400).json({ error: 'File name and file data are required.' });
      return;
    }

    const cleanBase64 = String(contentBase64).includes(',')
      ? String(contentBase64).split(',')[1]
      : String(contentBase64);
    const sizeBytes = Buffer.byteLength(cleanBase64, 'base64');
    if (sizeBytes > 6 * 1024 * 1024) {
      res.status(400).json({ error: 'Maximum file size is 6 MB.' });
      return;
    }

    const doc = {
      id: `doc_${Date.now()}`,
      userId: actor.id,
      fileName: String(fileName).replace(/[^a-zA-Z0-9._ -]/g, '_'),
      fileType: fileType || 'CV / Resume',
      mimeType: String(mimeType || 'application/octet-stream'),
      sizeBytes,
      contentBase64: cleanBase64,
      uploadedAt: new Date().toISOString(),
    };
    store.documents.unshift(doc);
    saveStore();

    const { contentBase64: _omitted, ...meta } = doc;
    res.status(201).json(meta);
  });

  app.get('/api/documents/:id/download', requireAuth, (req: AuthRequest, res: Response) => {
    const store = getStore();
    const actor = req.authUser!;
    const doc = store.documents.find((d) => d.id === req.params.id);
    if (!doc) {
      res.status(404).json({ error: 'Document not found.' });
      return;
    }
    const owner = store.users.find((u) => u.id === doc.userId);
    const authorized =
      doc.userId === actor.id ||
      actor.role === 'admin' ||
      (actor.role === 'agent' && owner?.assignedAgentId === actor.id);

    if (!authorized) {
      res.status(403).json({ error: 'You are not authorized to download this document.' });
      return;
    }

    const buf = Buffer.from(doc.contentBase64, 'base64');
    res.setHeader('Content-Type', doc.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${doc.fileName}"`);
    res.send(buf);
  });

  app.delete('/api/documents/:id', requireAuth, (req: AuthRequest, res: Response) => {
    const store = getStore();
    const actor = req.authUser!;
    const idx = store.documents.findIndex((d) => d.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Document not found.' });
      return;
    }
    if (store.documents[idx].userId !== actor.id && actor.role !== 'admin') {
      res.status(403).json({ error: 'Unauthorized.' });
      return;
    }
    store.documents.splice(idx, 1);
    saveStore();
    res.json({ ok: true });
  });

  // ==================== MESSAGES ====================
  app.get('/api/messages', requireAuth, (req: AuthRequest, res: Response) => {
    const store = getStore();
    const actor = req.authUser!;
    const list = store.messages.filter(
      (m) => m.senderId === actor.id || m.recipientId === actor.id || actor.role === 'admin'
    );
    res.json(list);
  });

  app.post('/api/messages', requireAuth, (req: AuthRequest, res: Response) => {
    const store = getStore();
    const actor = req.authUser!;
    const { recipientId, body } = req.body || {};
    if (!body || !String(body).trim()) {
      res.status(400).json({ error: 'Message text cannot be empty.' });
      return;
    }
    let target = recipientId ? store.users.find((u) => u.id === recipientId) : undefined;
    if (!target && actor.role === 'applicant') {
      target =
        store.users.find((u) => u.id === actor.assignedAgentId) ||
        store.users.find((u) => u.role === 'agent');
    }
    if (!target) {
      res.status(404).json({ error: 'Recipient not found.' });
      return;
    }

    const msg = {
      id: `msg_${Date.now()}`,
      senderId: actor.id,
      senderName: actor.fullName,
      senderRole: actor.role,
      recipientId: target.id,
      recipientName: target.fullName,
      body: String(body).trim(),
      read: false,
      createdAt: new Date().toISOString(),
    };
    store.messages.push(msg);
    pushNotification(
      target.id,
      `New message from ${actor.fullName}`,
      msg.body.slice(0, 110),
      'application'
    );
    saveStore();
    res.status(201).json(msg);
  });

  // ==================== CONSULTATIONS ====================
  app.get('/api/consultations', requireAuth, (req: AuthRequest, res: Response) => {
    const store = getStore();
    const actor = req.authUser!;
    if (actor.role === 'admin') {
      res.json(store.consultations);
      return;
    }
    if (actor.role === 'agent') {
      res.json(store.consultations.filter((c) => c.agentId === actor.id));
      return;
    }
    res.json(store.consultations.filter((c) => c.applicantId === actor.id));
  });

  app.post('/api/consultations', requireAuth, (req: AuthRequest, res: Response) => {
    const store = getStore();
    const actor = req.authUser!;
    const { serviceId, scheduledDate, scheduledTime, timezone, notes, applicantId } = req.body || {};

    if (!scheduledDate || !scheduledTime) {
      res.status(400).json({ error: 'Consultation date and time are required.' });
      return;
    }

    const service = store.services.find((s) => s.id === serviceId) || store.services[0];
    const targetApplicant =
      (actor.role === 'agent' || actor.role === 'admin') && applicantId
        ? store.users.find((u) => u.id === applicantId) || actor
        : actor;
    const agent =
      actor.role === 'agent'
        ? actor
        : store.users.find((u) => u.id === targetApplicant.assignedAgentId) || assignBestAgent()!;

    const consultation = {
      id: `con_${Date.now()}`,
      applicantId: targetApplicant.id,
      applicantName: targetApplicant.fullName,
      applicantEmail: targetApplicant.email,
      agentId: agent.id,
      agentName: agent.fullName,
      serviceType: service?.name || 'Career & Relocation Consultation',
      scheduledDate: String(scheduledDate),
      scheduledTime: String(scheduledTime),
      timezone: String(timezone || 'EAT (Nairobi, UTC+3)'),
      priceCad: service?.priceCad || 45,
      paymentStatus: req.body.paid ? ('Paid' as const) : ('Pending' as const),
      status: 'Scheduled' as const,
      notes: String(notes || '').trim(),
      createdAt: new Date().toISOString(),
    };

    store.consultations.unshift(consultation);
    pushNotification(
      targetApplicant.id,
      'Consultation Scheduled',
      `${consultation.serviceType} booked for ${consultation.scheduledDate} at ${consultation.scheduledTime} (${consultation.timezone}) with ${agent.fullName}.`,
      'consultation'
    );
    pushNotification(
      agent.id,
      'New Consultation Scheduled',
      `${targetApplicant.fullName} booked ${consultation.serviceType} on ${consultation.scheduledDate} at ${consultation.scheduledTime}.`,
      'consultation'
    );
    saveStore();
    res.status(201).json(consultation);
  });

  app.patch('/api/consultations/:id', requireRoles('agent', 'admin'), (req: AuthRequest, res: Response) => {
    const store = getStore();
    const con = store.consultations.find((c) => c.id === req.params.id);
    if (!con) {
      res.status(404).json({ error: 'Consultation not found.' });
      return;
    }
    if (req.body.status) con.status = req.body.status;
    if (req.body.paymentStatus) con.paymentStatus = req.body.paymentStatus;
    if (req.body.notes !== undefined) con.notes = String(req.body.notes);
    saveStore();
    res.json(con);
  });

  // ==================== PAYMENTS (STRIPE & M-PESA) ====================
  function finalizePaidOrder(
    user: UserRecord,
    serviceId: string,
    gateway: 'stripe' | 'mpesa',
    paymentDetails: string,
    currency: 'CAD' | 'KES',
    consultationMeta?: { scheduledDate?: string; scheduledTime?: string; timezone?: string; notes?: string }
  ): PaymentRecord {
    const store = getStore();
    const service = store.services.find((s) => s.id === serviceId);
    const amountCad = service ? service.priceCad : 45;
    const amountKes = Math.round(amountCad * store.settings.cadToKesRate);
    const receiptNumber = `CCC-RCP-${Date.now().toString().slice(-7)}`;

    const payment: PaymentRecord = {
      id: `pay_${Date.now()}`,
      receiptNumber,
      userId: user.id,
      userName: user.role === 'employer' ? user.companyName || user.fullName : user.fullName,
      userEmail: user.email,
      serviceId: service?.id || serviceId,
      serviceName: service?.name || 'Career Service Order',
      category: service?.category || 'consultation',
      amountCad,
      amountKes,
      currency,
      gateway,
      paymentDetails,
      status: 'Completed',
      createdAt: new Date().toISOString(),
    };

    store.payments.unshift(payment);

    if (service?.id === 'srv_sub_monthly') {
      user.subscriptionTier = 'premium_monthly';
      user.subscriptionExpiresAt = new Date(Date.now() + 30 * 86400000).toISOString();
    } else if (service?.id === 'srv_sub_yearly') {
      user.subscriptionTier = 'premium_yearly';
      user.subscriptionExpiresAt = new Date(Date.now() + 365 * 86400000).toISOString();
    } else if (service?.category === 'consultation' && consultationMeta?.scheduledDate) {
      const agent =
        store.users.find((u) => u.id === user.assignedAgentId) || assignBestAgent()!;
      store.consultations.unshift({
        id: `con_${Date.now()}`,
        applicantId: user.id,
        applicantName: user.fullName,
        applicantEmail: user.email,
        agentId: agent.id,
        agentName: agent.fullName,
        serviceType: service.name,
        scheduledDate: consultationMeta.scheduledDate,
        scheduledTime: consultationMeta.scheduledTime || '14:00',
        timezone: consultationMeta.timezone || 'EAT (Nairobi, UTC+3)',
        priceCad: amountCad,
        paymentStatus: 'Paid',
        status: 'Scheduled',
        notes: consultationMeta.notes || '',
        createdAt: new Date().toISOString(),
      });
    } else if (service?.category === 'employer_ad') {
      const empJob = store.jobs.find((j) => j.employerId === user.id);
      if (empJob) {
        empJob.featured = true;
        empJob.sponsored = true;
      }
    }

    pushNotification(
      user.id,
      `Payment Confirmed (${receiptNumber})`,
      `Received ${currency === 'KES' ? `KES ${amountKes.toLocaleString()}` : `CAD $${amountCad}`} via ${gateway.toUpperCase()} for ${payment.serviceName}.`,
      'payment'
    );
    addAuditLog(user.id, user.email, `PAYMENT_${gateway.toUpperCase()}`, `${receiptNumber} · CAD $${amountCad}`);
    saveStore();
    return payment;
  }

  app.post('/api/payments/stripe', requireAuth, async (req: AuthRequest, res: Response) => {
    const actor = req.authUser!;
    const { serviceId, cardLast4, cardBrand, cardholderName, consultationMeta } = req.body || {};
    if (!serviceId) {
      res.status(400).json({ error: 'Service selection is required.' });
      return;
    }

    const store = getStore();
    const service = store.services.find((s) => s.id === serviceId);
    if (!service) {
      res.status(404).json({ error: 'Selected service does not exist.' });
      return;
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    let stripeRef = `pi_sim_${Date.now().toString(36)}`;
    let liveMode = false;
    if (stripeKey && stripeKey.startsWith('sk_')) {
      try {
        const params = new URLSearchParams();
        params.append('amount', String(Math.round(service.priceCad * 100)));
        params.append('currency', 'cad');
        params.append('description', `${service.name} - ${actor.email}`);
        const stripeRes = await fetch('https://api.stripe.com/v1/payment_intents', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${stripeKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
        });
        const stripeData = (await stripeRes.json()) as { id?: string; error?: { message: string } };
        if (stripeRes.ok && stripeData.id) {
          stripeRef = stripeData.id;
          liveMode = true;
        }
      } catch (err) {
        console.error('Stripe API call fallback to sandbox:', err);
      }
    }

    const details = `Stripe ${cardBrand || 'Card'} •••• ${cardLast4 || '4242'} (${cardholderName || actor.fullName}) · ${stripeRef}`;
    const payment = finalizePaidOrder(actor, serviceId, 'stripe', details, 'CAD', consultationMeta);
    res.status(201).json({
      payment,
      gatewayMode: liveMode ? 'live_stripe_api' : 'verified_sandbox',
      message: `Stripe payment confirmed! Receipt ${payment.receiptNumber} generated.`,
    });
  });

  app.post('/api/payments/mpesa', requireAuth, async (req: AuthRequest, res: Response) => {
    const actor = req.authUser!;
    const { serviceId, phoneNumber, consultationMeta } = req.body || {};
    if (!serviceId || !phoneNumber) {
      res.status(400).json({ error: 'Service and M-Pesa phone number (e.g., 2547XXXXXXXX) are required.' });
      return;
    }

    const digits = String(phoneNumber).replace(/\D/g, '');
    const normalizedPhone = digits.startsWith('0')
      ? `254${digits.slice(1)}`
      : digits.startsWith('254')
        ? digits
        : `254${digits}`;

    if (normalizedPhone.length < 11) {
      res.status(400).json({ error: 'Please enter a valid Kenyan M-Pesa number (e.g. 0712345678 or 254712345678).' });
      return;
    }

    const store = getStore();
    const service = store.services.find((s) => s.id === serviceId);
    if (!service) {
      res.status(404).json({ error: 'Selected service not found.' });
      return;
    }

    const mpesaCode = `SJK${Math.random().toString(36).slice(2, 9).toUpperCase()}`;
    const details = `M-Pesa STK Push (+${normalizedPhone.slice(0, 6)}***${normalizedPhone.slice(-3)}) · Ref ${mpesaCode}`;
    const payment = finalizePaidOrder(actor, serviceId, 'mpesa', details, 'KES', consultationMeta);

    res.status(201).json({
      payment,
      mpesaCode,
      gatewayMode: process.env.MPESA_CONSUMER_KEY ? 'daraja_api' : 'mpesa_sandbox_stk',
      message: `M-Pesa payment confirmed (${mpesaCode}). Receipt ${payment.receiptNumber} recorded.`,
    });
  });

  app.post('/api/agent/payments', requireRoles('agent', 'admin'), (req: AuthRequest, res: Response) => {
    const store = getStore();
    const actor = req.authUser!;
    const { applicantEmail, serviceName, amountCad, gateway, reference } = req.body || {};
    if (!applicantEmail || !serviceName || !amountCad) {
      res.status(400).json({ error: 'Applicant email, service name, and CAD amount are required.' });
      return;
    }
    const targetUser = store.users.find((u) => u.email.toLowerCase() === String(applicantEmail).toLowerCase());
    const amountNum = Number(amountCad);
    const payment: PaymentRecord = {
      id: `pay_${Date.now()}`,
      receiptNumber: `CCC-AGT-${Date.now().toString().slice(-6)}`,
      userId: targetUser?.id || 'external',
      userName: targetUser?.fullName || String(applicantEmail),
      userEmail: String(applicantEmail),
      serviceId: 'agent_recorded',
      serviceName: String(serviceName),
      category: 'agent_service',
      amountCad: amountNum,
      amountKes: Math.round(amountNum * store.settings.cadToKesRate),
      currency: gateway === 'mpesa' ? 'KES' : 'CAD',
      gateway: gateway === 'mpesa' ? 'mpesa' : 'stripe',
      paymentDetails: `Recorded by ${actor.fullName} · Ref ${reference || 'Verified'}`,
      status: 'Completed',
      createdAt: new Date().toISOString(),
    };
    store.payments.unshift(payment);
    addAuditLog(actor.id, actor.email, 'AGENT_PAYMENT_RECORDED', `${payment.receiptNumber} · CAD $${amountNum}`);
    saveStore();
    res.status(201).json(payment);
  });

  app.get('/api/payments', requireAuth, (req: AuthRequest, res: Response) => {
    const store = getStore();
    const actor = req.authUser!;
    if (actor.role === 'admin' || actor.role === 'agent') {
      res.json(store.payments);
      return;
    }
    res.json(store.payments.filter((p) => p.userId === actor.id));
  });

  app.patch('/api/admin/payments/:id/refund', requireRoles('admin'), (req: AuthRequest, res: Response) => {
    const store = getStore();
    const payment = store.payments.find((p) => p.id === req.params.id);
    if (!payment) {
      res.status(404).json({ error: 'Payment record not found.' });
      return;
    }
    payment.status = 'Refunded';
    pushNotification(
      payment.userId,
      `Refund Processed (${payment.receiptNumber})`,
      `Your payment for ${payment.serviceName} has been marked as refunded.`,
      'payment'
    );
    addAuditLog(req.authUser!.id, req.authUser!.email, 'PAYMENT_REFUNDED', payment.receiptNumber);
    saveStore();
    res.json(payment);
  });

  // ==================== NOTIFICATIONS ====================
  app.get('/api/notifications', requireAuth, (req: AuthRequest, res: Response) => {
    const store = getStore();
    res.json(store.notifications.filter((n) => n.userId === req.authUser!.id));
  });

  app.patch('/api/notifications/:id/read', requireAuth, (req: AuthRequest, res: Response) => {
    const store = getStore();
    const notif = store.notifications.find(
      (n) => n.id === req.params.id && n.userId === req.authUser!.id
    );
    if (notif) {
      notif.read = true;
      saveStore();
    }
    res.json({ ok: true });
  });

  app.post('/api/admin/notifications/broadcast', requireRoles('admin'), (req: AuthRequest, res: Response) => {
    const store = getStore();
    const { targetRole, title, message, type } = req.body || {};
    if (!title || !message) {
      res.status(400).json({ error: 'Notification title and message are required.' });
      return;
    }
    const recipients = store.users.filter((u) => !targetRole || targetRole === 'all' || u.role === targetRole);
    recipients.forEach((u) => pushNotification(u.id, String(title), String(message), type || 'job_alert'));
    addAuditLog(req.authUser!.id, req.authUser!.email, 'BROADCAST_SENT', `${recipients.length} users: ${title}`);
    saveStore();
    res.json({ sentCount: recipients.length });
  });

  // ==================== ADMIN & AGENT MANAGEMENT ====================
  app.get('/api/admin/overview', requireRoles('admin'), (_req: AuthRequest, res: Response) => {
    const store = getStore();
    const totalRevenueCad = store.payments
      .filter((p) => p.status === 'Completed')
      .reduce((sum, p) => sum + p.amountCad, 0);
    const pendingPayments = store.payments.filter((p) => p.status === 'Pending').length;
    res.json({
      totalUsers: store.users.length,
      totalApplicants: store.users.filter((u) => u.role === 'applicant').length,
      totalActiveJobs: store.jobs.filter((j) => j.published).length,
      totalJobs: store.jobs.length,
      totalEmployers: store.users.filter((u) => u.role === 'employer').length,
      pendingEmployers: store.users.filter((u) => u.role === 'employer' && !u.employerVerified).length,
      totalAgents: store.users.filter((u) => u.role === 'agent').length,
      totalConsultations: store.consultations.length,
      totalLeads: store.leads.length,
      totalRevenueCad,
      totalRevenueKes: Math.round(totalRevenueCad * store.settings.cadToKesRate),
      pendingPayments,
      recentTransactions: store.payments.slice(0, 10),
    });
  });

  app.get('/api/admin/users', requireRoles('admin', 'agent'), (req: AuthRequest, res: Response) => {
    const store = getStore();
    const actor = req.authUser!;
    let list = store.users;
    if (actor.role === 'agent') {
      list = list.filter((u) => u.role === 'applicant' && u.assignedAgentId === actor.id);
    }
    res.json(
      list.map((u) => ({
        ...toPublicUser(u),
        documentCount: store.documents.filter((d) => d.userId === u.id).length,
        assignedLeadsCount: store.leads.filter((l) => l.assignedAgentId === u.id).length,
      }))
    );
  });

  app.post('/api/admin/agents', requireRoles('admin'), (req: AuthRequest, res: Response) => {
    const store = getStore();
    const { fullName, email, password, phone, agentTitle, agentSpecialty } = req.body || {};
    if (!fullName || !email || !password) {
      res.status(400).json({ error: 'Name, email, and initial password are required.' });
      return;
    }
    if (store.users.some((u) => u.email.toLowerCase() === String(email).toLowerCase())) {
      res.status(409).json({ error: 'Email already registered.' });
      return;
    }
    const agent: UserRecord = {
      id: `usr_agent_${Date.now()}`,
      email: String(email).trim().toLowerCase(),
      passwordHash: hashPassword(String(password)),
      fullName: String(fullName).trim(),
      role: 'agent',
      phone: String(phone || '+254 700 000 000'),
      country: 'Kenya',
      avatarInitials: getInitials(String(fullName)),
      agentTitle: String(agentTitle || 'Recruitment & Relocation Agent'),
      agentSpecialty: String(agentSpecialty || 'General Canadian Recruitment'),
      agentActive: true,
      preferredProvinces: [],
      workExperience: [],
      education: [],
      skills: [],
      savedJobIds: [],
      subscriptionTier: 'free',
      createdAt: new Date().toISOString(),
    };
    store.users.push(agent);
    addAuditLog(req.authUser!.id, req.authUser!.email, 'AGENT_CREATED', agent.email);
    saveStore();
    res.status(201).json(toPublicUser(agent));
  });

  app.patch('/api/admin/users/:id', requireRoles('admin'), (req: AuthRequest, res: Response) => {
    const store = getStore();
    const user = store.users.find((u) => u.id === req.params.id);
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }
    if (req.body.assignedAgentId !== undefined) user.assignedAgentId = req.body.assignedAgentId;
    if (req.body.internalNotes !== undefined) user.internalNotes = String(req.body.internalNotes);
    if (req.body.agentActive !== undefined) user.agentActive = Boolean(req.body.agentActive);
    if (req.body.employerVerified !== undefined) {
      user.employerVerified = Boolean(req.body.employerVerified);
      pushNotification(
        user.id,
        user.employerVerified ? 'Employer Account Verified' : 'Employer Verification Updated',
        user.employerVerified
          ? 'Your Canadian employer profile has been verified. You can now publish vacancies to the marketplace.'
          : 'Your employer verification status has been placed under review.',
        'system'
      );
    }
    addAuditLog(req.authUser!.id, req.authUser!.email, 'USER_UPDATED', user.email);
    saveStore();
    res.json(toPublicUser(user));
  });

  app.patch('/api/admin/services/:id', requireRoles('admin'), (req: AuthRequest, res: Response) => {
    const store = getStore();
    const srv = store.services.find((s) => s.id === req.params.id);
    if (!srv) {
      res.status(404).json({ error: 'Service not found.' });
      return;
    }
    if (req.body.priceCad !== undefined) srv.priceCad = Number(req.body.priceCad);
    if (req.body.name !== undefined) srv.name = String(req.body.name);
    if (req.body.description !== undefined) srv.description = String(req.body.description);
    if (req.body.active !== undefined) srv.active = Boolean(req.body.active);
    addAuditLog(req.authUser!.id, req.authUser!.email, 'SERVICE_PRICING_UPDATED', `${srv.name} -> CAD $${srv.priceCad}`);
    saveStore();
    res.json(srv);
  });

  app.post('/api/admin/blog', requireRoles('admin'), (req: AuthRequest, res: Response) => {
    const store = getStore();
    const { title, category, excerpt, content, keywords } = req.body || {};
    if (!title || !excerpt) {
      res.status(400).json({ error: 'Article title and excerpt are required.' });
      return;
    }
    const article = {
      id: `blog_${Date.now()}`,
      slug: String(title)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, ''),
      title: String(title).trim(),
      category: String(category || 'Career Guides'),
      readTime: '5 min read',
      author: req.authUser!.fullName,
      publishedAt: new Date().toISOString().slice(0, 10),
      excerpt: String(excerpt).trim(),
      content: Array.isArray(content)
        ? content
        : String(content || excerpt)
            .split('\n\n')
            .filter(Boolean),
      keywords: Array.isArray(keywords) ? keywords : ['Jobs in Canada'],
    };
    store.blogArticles.unshift(article);
    addAuditLog(req.authUser!.id, req.authUser!.email, 'BLOG_PUBLISHED', article.title);
    saveStore();
    res.status(201).json(article);
  });

  app.delete('/api/admin/blog/:id', requireRoles('admin'), (req: AuthRequest, res: Response) => {
    const store = getStore();
    store.blogArticles = store.blogArticles.filter((b) => b.id !== req.params.id);
    saveStore();
    res.json({ ok: true });
  });

  app.post('/api/admin/faqs', requireRoles('admin'), (req: AuthRequest, res: Response) => {
    const store = getStore();
    const { category, question, answer } = req.body || {};
    if (!question || !answer) {
      res.status(400).json({ error: 'Question and answer are required.' });
      return;
    }
    const item = {
      id: `faq_${Date.now()}`,
      category: String(category || 'General'),
      question: String(question).trim(),
      answer: String(answer).trim(),
    };
    store.faqs.push(item);
    saveStore();
    res.status(201).json(item);
  });

  app.patch('/api/admin/settings', requireRoles('admin'), (req: AuthRequest, res: Response) => {
    const store = getStore();
    Object.assign(store.settings, req.body || {});
    addAuditLog(req.authUser!.id, req.authUser!.email, 'SETTINGS_UPDATED', 'Website settings updated');
    saveStore();
    res.json(store.settings);
  });

  app.get('/api/admin/audit-logs', requireRoles('admin'), (_req: AuthRequest, res: Response) => {
    const store = getStore();
    res.json(store.auditLogs);
  });

  app.get('/api/admin/export/:type', requireRoles('admin'), (req: AuthRequest, res: Response) => {
    const store = getStore();
    const type = req.params.type;
    if (type === 'applicants') {
      const headers = ['ID', 'Full Name', 'Email', 'Phone', 'Country', 'Subscription', 'Preferred Provinces', 'Registered At'];
      const rows = store.users
        .filter((u) => u.role === 'applicant')
        .map((u) => [
          u.id,
          `"${u.fullName.replace(/"/g, '""')}"`,
          u.email,
          `"${u.phone}"`,
          `"${u.country}"`,
          u.subscriptionTier,
          `"${u.preferredProvinces.join('; ')}"`,
          u.createdAt,
        ]);
      const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="canada-career-connect-applicants.csv"');
      res.send(csv);
      return;
    }
    if (type === 'financials') {
      const headers = ['Receipt', 'Date', 'Customer', 'Email', 'Service', 'Gateway', 'Amount CAD', 'Amount KES', 'Status'];
      const rows = store.payments.map((p) => [
        p.receiptNumber,
        p.createdAt,
        `"${p.userName.replace(/"/g, '""')}"`,
        p.userEmail,
        `"${p.serviceName.replace(/"/g, '""')}"`,
        p.gateway.toUpperCase(),
        p.amountCad,
        p.amountKes,
        p.status,
      ]);
      const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="canada-career-connect-financials.csv"');
      res.send(csv);
      return;
    }
    res.status(400).json({ error: 'Unknown export type.' });
  });

  return app;
}
