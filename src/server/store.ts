import fs from 'fs';
import path from 'path';
import { hashPassword } from './auth.ts';
import type {
  AffiliatePartner,
  ApplicationRecord,
  AuditLogEntry,
  BlogArticle,
  ConsultationRecord,
  DocumentRecord,
  FaqItem,
  JobCategory,
  JobListing,
  LeadRecord,
  MessageRecord,
  NotificationRecord,
  PaymentRecord,
  PlatformSettings,
  ServiceItem,
  TestimonialItem,
  UserRecord,
} from '../types.ts';

export const JOB_CATEGORIES: Array<{
  id: string;
  name: JobCategory;
  description: string;
  averageWageCad: string;
  demandLevel: string;
}> = [
  {
    id: 'cat_health',
    name: 'Healthcare',
    description: 'Registered nurses, personal support workers, care aides, and medical technicians.',
    averageWageCad: 'CAD $26 – $48/hr',
    demandLevel: 'Critical Demand',
  },
  {
    id: 'cat_trucking',
    name: 'Truck Driving & Logistics',
    description: 'AZ/Class 1 long-haul drivers, dispatch coordinators, and fleet mechanics.',
    averageWageCad: 'CAD $28 – $38/hr',
    demandLevel: 'High Demand',
  },
  {
    id: 'cat_trades',
    name: 'Construction & Trades',
    description: 'Red Seal electricians, welders, carpenters, heavy equipment operators, and plumbers.',
    averageWageCad: 'CAD $30 – $46/hr',
    demandLevel: 'Critical Demand',
  },
  {
    id: 'cat_hospitality',
    name: 'Hospitality & Food Service',
    description: 'Line cooks, bakers, hotel housekeeping supervisors, and food service managers.',
    averageWageCad: 'CAD $18 – $29/hr',
    demandLevel: 'Steady Demand',
  },
  {
    id: 'cat_agri',
    name: 'Agriculture & Agri-Food',
    description: 'Greenhouse supervisors, dairy farm technicians, and food processing specialists.',
    averageWageCad: 'CAD $19 – $28/hr',
    demandLevel: 'Seasonal & Year-Round',
  },
  {
    id: 'cat_it',
    name: 'Information Technology',
    description: 'Full-stack engineers, cloud analysts, cybersecurity specialists, and QA engineers.',
    averageWageCad: 'CAD $80k – $135k/yr',
    demandLevel: 'High Demand',
  },
  {
    id: 'cat_office',
    name: 'Office & Administration',
    description: 'Bookkeepers, payroll clerks, executive assistants, and customer operations leads.',
    averageWageCad: 'CAD $24 – $36/hr',
    demandLevel: 'Moderate Demand',
  },
  {
    id: 'cat_mfg',
    name: 'Manufacturing & Warehouse',
    description: 'CNC machinists, forklift operators, quality inspectors, and millwrights.',
    averageWageCad: 'CAD $24 – $39/hr',
    demandLevel: 'High Demand',
  },
];

export interface StoreState {
  users: UserRecord[];
  jobs: JobListing[];
  applications: ApplicationRecord[];
  leads: LeadRecord[];
  payments: PaymentRecord[];
  documents: DocumentRecord[];
  messages: MessageRecord[];
  consultations: ConsultationRecord[];
  notifications: NotificationRecord[];
  services: ServiceItem[];
  affiliates: AffiliatePartner[];
  blogArticles: BlogArticle[];
  faqs: FaqItem[];
  testimonials: TestimonialItem[];
  auditLogs: AuditLogEntry[];
  settings: PlatformSettings;
}

const STORE_FILE = path.resolve('/tmp', 'canada-career-connect-store.json');

function createInitialStore(): StoreState {
  const demoPass = hashPassword('DemoPass123!');
  const adminPass = hashPassword('AdminPass123!');
  const now = new Date().toISOString();

  const users: UserRecord[] = [
    {
      id: 'usr_admin_1',
      email: 'admin@canadacareerconnect.example',
      passwordHash: adminPass,
      fullName: 'Daniel Kariuki',
      role: 'admin',
      phone: '+1 416-555-0190',
      country: 'Canada',
      avatarInitials: 'DK',
      preferredProvinces: ['Ontario'],
      workExperience: [],
      education: [],
      skills: ['Compliance', 'Employer Verification'],
      savedJobIds: [],
      subscriptionTier: 'premium_yearly',
      createdAt: '2026-01-10T09:00:00.000Z',
    },
    {
      id: 'usr_agent_1',
      email: 'grace.otieno@canadacareerconnect.example',
      passwordHash: demoPass,
      fullName: 'Grace Otieno',
      role: 'agent',
      phone: '+254 712 345 678',
      country: 'Kenya',
      avatarInitials: 'GO',
      agentTitle: 'Senior Recruitment & Relocation Advisor',
      agentSpecialty: 'Healthcare, Skilled Trades & Canadian CV Standards',
      agentActive: true,
      preferredProvinces: ['Ontario', 'Alberta'],
      workExperience: [],
      education: [],
      skills: ['Canadian Resume Format', 'Credential Evaluation Prep', 'Interview Coaching'],
      savedJobIds: [],
      subscriptionTier: 'free',
      createdAt: '2026-01-12T08:30:00.000Z',
    },
    {
      id: 'usr_agent_2',
      email: 'samuel.mensah@canadacareerconnect.example',
      passwordHash: demoPass,
      fullName: 'Samuel Mensah',
      role: 'agent',
      phone: '+254 722 987 654',
      country: 'Kenya',
      avatarInitials: 'SM',
      agentTitle: 'Logistics & Hospitality Placement Advisor',
      agentSpecialty: 'Class 1 Trucking, Hospitality & Provincial Programs',
      agentActive: true,
      preferredProvinces: ['British Columbia', 'Manitoba'],
      workExperience: [],
      education: [],
      skills: ['Logistics Hiring', 'Employer Outreach', 'Relocation Planning'],
      savedJobIds: [],
      subscriptionTier: 'free',
      createdAt: '2026-01-15T10:00:00.000Z',
    },
    {
      id: 'usr_emp_1',
      email: 'hr@maplehealth.example.ca',
      passwordHash: demoPass,
      fullName: 'Claire Tremblay',
      role: 'employer',
      phone: '+1 647-555-0144',
      country: 'Canada',
      avatarInitials: 'CT',
      companyName: 'MapleCare Senior Residences (Sample Employer)',
      companyLogo: 'MC',
      companyWebsite: 'https://maplecare.example.ca',
      companyProvince: 'Ontario',
      companyCity: 'Ottawa',
      companyDescription:
        'Accredited long-term care and assisted living network across Eastern Ontario.',
      employerVerified: true,
      preferredProvinces: ['Ontario'],
      workExperience: [],
      education: [],
      skills: [],
      savedJobIds: [],
      subscriptionTier: 'free',
      createdAt: '2026-01-20T11:00:00.000Z',
    },
    {
      id: 'usr_emp_2',
      email: 'talent@prairiefreight.example.ca',
      passwordHash: demoPass,
      fullName: 'Mark Henderson',
      role: 'employer',
      phone: '+1 403-555-0178',
      country: 'Canada',
      avatarInitials: 'MH',
      companyName: 'PrairieLine Logistics Corp. (Sample Employer)',
      companyLogo: 'PL',
      companyWebsite: 'https://prairiefreight.example.ca',
      companyProvince: 'Alberta',
      companyCity: 'Calgary',
      companyDescription:
        'Interprovincial refrigerated freight carrier operating routes from Calgary to Vancouver and Winnipeg.',
      employerVerified: true,
      preferredProvinces: ['Alberta', 'British Columbia'],
      workExperience: [],
      education: [],
      skills: [],
      savedJobIds: [],
      subscriptionTier: 'free',
      createdAt: '2026-01-22T12:00:00.000Z',
    },
    {
      id: 'usr_emp_3',
      email: 'careers@westcoastbuilders.example.ca',
      passwordHash: demoPass,
      fullName: 'Priya Nair',
      role: 'employer',
      phone: '+1 604-555-0162',
      country: 'Canada',
      avatarInitials: 'PN',
      companyName: 'Pacific Timber & Civil Builders (Sample)',
      companyLogo: 'PT',
      companyProvince: 'British Columbia',
      companyCity: 'Surrey',
      companyDescription:
        'Commercial framing, infrastructure, and residential multi-unit contractor in Metro Vancouver.',
      employerVerified: false,
      preferredProvinces: ['British Columbia'],
      workExperience: [],
      education: [],
      skills: [],
      savedJobIds: [],
      subscriptionTier: 'free',
      createdAt: '2026-02-01T14:00:00.000Z',
    },
    {
      id: 'usr_app_1',
      email: 'amina.wanjiku@example.com',
      passwordHash: demoPass,
      fullName: 'Amina Wanjiku',
      role: 'applicant',
      phone: '+254 711 456 789',
      country: 'Kenya',
      avatarInitials: 'AW',
      bio: 'Registered nurse with 5 years of acute care and geriatric ward experience in Nairobi. Preparing ECA and Canadian-style resume for Ontario and Alberta placements.',
      preferredProvinces: ['Ontario', 'Alberta'],
      preferredCategory: 'Healthcare',
      workExperience: [
        {
          id: 'exp_1',
          title: 'Registered Nurse (Medical-Surgical)',
          company: 'Nairobi West Hospital',
          location: 'Nairobi, Kenya',
          years: '2021 – Present',
          description: 'Managed 18-bed acute care unit, medication administration, and patient discharge planning.',
        },
      ],
      education: [
        {
          id: 'edu_1',
          degree: 'BSc in Nursing',
          institution: 'University of Nairobi',
          year: '2020',
        },
      ],
      skills: ['Geriatric Care', 'Electronic Health Records', 'Patient Triage', 'BLS Certified'],
      savedJobIds: ['job_1', 'job_4'],
      subscriptionTier: 'free',
      assignedAgentId: 'usr_agent_1',
      createdAt: '2026-02-05T09:15:00.000Z',
    },
  ];

  const jobs: JobListing[] = [
    {
      id: 'job_1',
      title: 'Personal Support Worker (PSW) / Care Aide',
      employerId: 'usr_emp_1',
      companyName: 'MapleCare Senior Residences (Sample Employer)',
      companyLogo: 'MC',
      province: 'Ontario',
      city: 'Ottawa',
      category: 'Healthcare',
      salaryMinCad: 25,
      salaryMaxCad: 29,
      salaryUnit: 'hour',
      employmentType: 'Full-Time',
      experienceLevel: 'Mid Level',
      experienceRequirements: 'Minimum 2 years in elder care, hospital ward assistance, or nursing.',
      educationRequirements: 'Healthcare certificate or nursing diploma; ECA readiness preferred.',
      description:
        'Support senior residents with daily living activities, mobility assistance, meal coordination, and wellness monitoring inside an accredited 120-bed Ottawa care residence.',
      responsibilities: [
        'Assist residents with personal hygiene, dressing, and safe transfers',
        'Document daily health observations in electronic care charts',
        'Collaborate with Registered Nurses during shift handovers',
      ],
      qualifications: [
        '2+ years verifiable caregiving or clinical support experience',
        'Strong English communication (CLB 6+ equivalent)',
        'Clean police clearance certificate and immunization records',
      ],
      benefits: ['Extended Health & Dental', 'Shift Premiums', 'Paid Orientation', 'Transit Allowance'],
      workPermitSupport: 'lmia_verified',
      workPermitNotes:
        'Sample LMIA-supported employer stream verified for eligible overseas healthcare applicants subject to formal interview and IRCC work permit eligibility.',
      applicationDeadline: '2027-02-28',
      verificationStatus: 'Employer Verified',
      published: true,
      featured: true,
      sponsored: true,
      viewsCount: 412,
      interestCount: 28,
      createdAt: '2026-10-15T10:00:00.000Z',
    },
    {
      id: 'job_2',
      title: 'Long-Haul Class 1 / AZ Commercial Truck Driver',
      employerId: 'usr_emp_2',
      companyName: 'PrairieLine Logistics Corp. (Sample Employer)',
      companyLogo: 'PL',
      province: 'Alberta',
      city: 'Calgary',
      category: 'Truck Driving & Logistics',
      salaryMinCad: 30,
      salaryMaxCad: 36,
      salaryUnit: 'hour',
      employmentType: 'Full-Time',
      experienceLevel: 'Mid Level',
      experienceRequirements: '3+ years heavy articulated truck driving experience on regional or cross-border routes.',
      educationRequirements: 'Secondary diploma and valid heavy commercial driver license (convertible to Alberta Class 1).',
      description:
        'Operate late-model Volvo & Freightliner refrigerated tractor-trailers across Western Canadian corridors with structured MELT licensing transition support.',
      responsibilities: [
        'Complete pre-trip and post-trip DOT safety inspections',
        'Maintain electronic logging device (ELD) compliance',
        'Deliver temperature-controlled cargo safely across AB, BC, and SK',
      ],
      qualifications: [
        'Minimum 3 years verifiable heavy commercial driving record',
        'Clean driver abstract and ability to pass Canadian road test',
        'Basic digital literacy for ELD tablets and dispatch apps',
      ],
      benefits: ['Safety Bonus', 'Medical & Life Insurance', 'Dedicated Dispatch Team'],
      workPermitSupport: 'lmia_verified',
      workPermitNotes:
        'Verified sample employer participates in Alberta & Federal LMIA streams for experienced heavy transport drivers.',
      applicationDeadline: '2027-03-15',
      verificationStatus: 'Employer Verified',
      published: true,
      featured: true,
      sponsored: false,
      viewsCount: 389,
      interestCount: 34,
      createdAt: '2026-10-18T11:30:00.000Z',
    },
    {
      id: 'job_3',
      title: 'Commercial Carpenter & Formwork Specialist',
      employerId: 'usr_emp_3',
      companyName: 'Pacific Timber & Civil Builders (Sample)',
      companyLogo: 'PT',
      province: 'British Columbia',
      city: 'Surrey',
      category: 'Construction & Trades',
      salaryMinCad: 33,
      salaryMaxCad: 42,
      salaryUnit: 'hour',
      employmentType: 'Full-Time',
      experienceLevel: 'Senior Level',
      experienceRequirements: '4+ years commercial concrete formwork, framing, and blueprint reading.',
      educationRequirements: 'Trade certification or documented apprenticeship hours.',
      description:
        'Lead structural formwork and timber framing crews on mid-rise residential and civic projects across the Lower Mainland.',
      responsibilities: [
        'Read architectural drawings and lay out structural forms',
        'Enforce WorkSafeBC jobsite safety protocols',
        'Mentor junior apprentices and coordinate material deliveries',
      ],
      qualifications: [
        '4+ years commercial construction or carpentry experience',
        'Proficiency with laser levels, power tools, and metric/imperial plans',
      ],
      benefits: ['Tool Allowance', 'Extended Benefits', 'Overtime Opportunities'],
      workPermitSupport: 'employer_supported_case_by_case',
      workPermitNotes:
        'Employer evaluates experienced trades candidates for BC PNP / LMIA support on a case-by-case basis after technical interview.',
      applicationDeadline: '2027-01-31',
      verificationStatus: 'Employer Verified',
      published: true,
      featured: false,
      sponsored: false,
      viewsCount: 245,
      interestCount: 19,
      createdAt: '2026-10-20T09:00:00.000Z',
    },
    {
      id: 'job_4',
      title: 'Registered Practical Nurse / Acute Care RN',
      employerId: 'usr_emp_1',
      companyName: 'MapleCare Senior Residences (Sample Employer)',
      companyLogo: 'MC',
      province: 'Ontario',
      city: 'Kingston',
      category: 'Healthcare',
      salaryMinCad: 36,
      salaryMaxCad: 47,
      salaryUnit: 'hour',
      employmentType: 'Full-Time',
      experienceLevel: 'Mid Level',
      experienceRequirements: '2+ years hospital or long-term care clinical nursing experience.',
      educationRequirements: 'BSc Nursing or Diploma in Nursing (NNAS/CNO eligibility pathway).',
      description:
        'Deliver resident-centered clinical nursing care, supervise PSW teams, and coordinate physician care plans in our Kingston facility.',
      responsibilities: [
        'Administer medications and wound care per CNO standards',
        'Lead shift clinical assessments and family care conferences',
      ],
      qualifications: [
        'Active nursing registration in home country and NNAS readiness',
        'Strong written and spoken English',
      ],
      benefits: ['Relocation Guidance Stipend', 'Pension Match', 'Paid Continuing Education'],
      workPermitSupport: 'lmia_verified',
      workPermitNotes:
        'Employer works with internationally educated nurses completing CNO/NNAS steps and offers structured work permit sponsorship for qualified candidates.',
      applicationDeadline: '2027-04-01',
      verificationStatus: 'Employer Verified',
      published: true,
      featured: true,
      sponsored: false,
      viewsCount: 510,
      interestCount: 41,
      createdAt: '2026-10-22T14:20:00.000Z',
    },
    {
      id: 'job_5',
      title: 'Full-Stack TypeScript & Cloud Developer',
      employerId: 'usr_emp_2',
      companyName: 'NorthStar Freight Tech (Sample)',
      companyLogo: 'NF',
      province: 'Ontario',
      city: 'Toronto',
      category: 'Information Technology',
      salaryMinCad: 95000,
      salaryMaxCad: 125000,
      salaryUnit: 'year',
      employmentType: 'Full-Time',
      experienceLevel: 'Mid Level',
      experienceRequirements: '3+ years building React, Node.js, and PostgreSQL production systems.',
      educationRequirements: 'BSc in Computer Science or equivalent proven engineering portfolio.',
      description:
        'Build fleet telemetry dashboards, automated customs clearance APIs, and route optimization tools in downtown Toronto (hybrid).',
      responsibilities: [
        'Design resilient TypeScript APIs and React UI workflows',
        'Participate in code reviews and CI/CD reliability improvements',
      ],
      qualifications: [
        'Production experience with TypeScript, React, SQL, and cloud hosting',
        'Strong asynchronous communication skills',
      ],
      benefits: ['Hybrid Work', 'Health & Wellness Credit', 'Annual Learning Budget'],
      workPermitSupport: 'employer_supported_case_by_case',
      workPermitNotes:
        'Global Talent Stream sponsorship considered for senior/mid-level engineers meeting technical assessment.',
      applicationDeadline: '2027-02-15',
      verificationStatus: 'Employer Verified',
      published: true,
      featured: false,
      sponsored: false,
      viewsCount: 298,
      interestCount: 22,
      createdAt: '2026-10-25T16:10:00.000Z',
    },
    {
      id: 'job_6',
      title: 'Hotel Housekeeping & Guest Services Supervisor',
      employerId: 'usr_emp_1',
      companyName: 'Banff Alpine Lodge Group (Sample)',
      companyLogo: 'BA',
      province: 'Alberta',
      city: 'Banff',
      category: 'Hospitality & Food Service',
      salaryMinCad: 23,
      salaryMaxCad: 27,
      salaryUnit: 'hour',
      employmentType: 'Full-Time',
      experienceLevel: 'Mid Level',
      experienceRequirements: '2+ years supervising hospitality or resort operations teams.',
      educationRequirements: 'Hospitality management diploma or equivalent experience.',
      description:
        'Oversee daily room readiness, staff scheduling, and quality inspections for a 140-room mountain resort with subsidized staff housing.',
      responsibilities: [
        'Coordinate 16-person housekeeping team and daily room turnarounds',
        'Maintain inventory of linens and eco-certified cleaning supplies',
      ],
      qualifications: [
        'Supervisory experience in hotels or serviced apartments',
        'Warm guest service demeanor and attention to detail',
      ],
      benefits: ['Subsidized Staff Housing', 'Meal Plan', 'Mountain Pass Discount'],
      workPermitSupport: 'lmia_verified',
      workPermitNotes:
        'LMIA-approved hospitality supervisory stream; subsidized staff accommodation available in Banff.',
      applicationDeadline: '2027-03-01',
      verificationStatus: 'Employer Verified',
      published: true,
      featured: false,
      sponsored: false,
      viewsCount: 267,
      interestCount: 31,
      createdAt: '2026-10-28T08:45:00.000Z',
    },
    {
      id: 'job_7',
      title: 'Greenhouse Crop & Irrigation Technician',
      employerId: 'usr_emp_2',
      companyName: 'Red River Agri-Greenhouses (Sample)',
      companyLogo: 'RR',
      province: 'Manitoba',
      city: 'Winnipeg',
      category: 'Agriculture & Agri-Food',
      salaryMinCad: 21,
      salaryMaxCad: 26,
      salaryUnit: 'hour',
      employmentType: 'Full-Time',
      experienceLevel: 'Entry Level',
      experienceRequirements: '1+ year commercial horticulture, agronomy, or greenhouse experience.',
      educationRequirements: 'Certificate or diploma in Agriculture / Horticulture.',
      description:
        'Operate climate-controlled hydroponic vegetable greenhouses year-round near Winnipeg, managing nutrient dosing and crop health.',
      responsibilities: [
        'Monitor automated drip irrigation and pH/EC sensors',
        'Coordinate Integrated Pest Management (IPM) inspections',
      ],
      qualifications: [
        'Practical background in greenhouse farming or agronomy',
        'Ability to work in warm indoor agricultural environments',
      ],
      benefits: ['Full-Time Year-Round', 'Extended Health Plan', 'MPNP Pathway Eligible'],
      workPermitSupport: 'lmia_verified',
      workPermitNotes:
        'Eligible for Agri-Food Pilot / MPNP pathways following verifiable work experience.',
      applicationDeadline: '2027-03-20',
      verificationStatus: 'Employer Verified',
      published: true,
      featured: false,
      sponsored: false,
      viewsCount: 190,
      interestCount: 17,
      createdAt: '2026-11-01T13:00:00.000Z',
    },
    {
      id: 'job_8',
      title: 'Industrial CNC Machinist & Quality Inspector',
      employerId: 'usr_emp_3',
      companyName: 'SaskSteel Precision Mfg (Sample)',
      companyLogo: 'SS',
      province: 'Saskatchewan',
      city: 'Saskatoon',
      category: 'Manufacturing & Warehouse',
      salaryMinCad: 30,
      salaryMaxCad: 38,
      salaryUnit: 'hour',
      employmentType: 'Full-Time',
      experienceLevel: 'Mid Level',
      experienceRequirements: '3+ years CNC milling/turning setup and precision micrometer inspection.',
      educationRequirements: 'Machinist trade certificate or mechanical engineering technician diploma.',
      description:
        'Set up and operate 3-axis and 5-axis CNC machining centers producing agricultural and mining equipment components in Saskatoon.',
      responsibilities: [
        'Interpret GD&T blueprints and verify tolerances with CMM/micrometers',
        'Perform routine tool offsets and preventive maintenance',
      ],
      qualifications: [
        '3+ years Fanuc/Haas CNC programming or operation',
        'Reliable work ethic and safety-first mindset',
      ],
      benefits: ['Boot & Tool Allowance', 'Dental & Vision', 'Relocation Guidance'],
      workPermitSupport: 'no_sponsorship_verified',
      workPermitNotes:
        'Currently prioritized for candidates with valid Canadian open work permits or PR/SINP readiness. Listed transparently so applicants know sponsorship status upfront.',
      applicationDeadline: '2027-02-10',
      verificationStatus: 'Employer Verified',
      published: true,
      featured: false,
      sponsored: false,
      viewsCount: 154,
      interestCount: 9,
      createdAt: '2026-11-04T15:30:00.000Z',
    },
  ];

  const services: ServiceItem[] = [
    {
      id: 'srv_consult_career',
      name: '1-on-1 Canadian Career & Relocation Consultation',
      category: 'consultation',
      priceCad: 45,
      description:
        '45-minute live video or WhatsApp consultation with an assigned relocation advisor covering realistic Canadian job pathways, NOC code alignment, and credential timelines.',
      deliverables: [
        '45-minute private advisor session (EAT / EST friendly)',
        'NOC & target province eligibility roadmap',
        'Written action checklist sent to your dashboard',
      ],
      turnaround: 'Book within 24–48 hours',
      popular: true,
      active: true,
    },
    {
      id: 'srv_cv_canadian',
      name: 'Canadian-Standard CV & Cover Letter Rewrite',
      category: 'cv_writing',
      priceCad: 65,
      description:
        'Complete transformation of your East African/international CV into an ATS-optimized Canadian resume format (no photos, quantified achievements, NOC keywords).',
      deliverables: [
        'ATS-ready Canadian Resume (Word + PDF)',
        'Tailored Canadian Cover Letter template',
        '1 round of advisor revisions within 7 days',
      ],
      turnaround: '3 Business Days',
      active: true,
    },
    {
      id: 'srv_relocation_plan',
      name: 'Full Job Search & Relocation Readiness Pack',
      category: 'relocation',
      priceCad: 120,
      description:
        'Combines Canadian CV rewrite, 2 advisory consultations, interview coaching, and WES/NNAS document preparation checklist.',
      deliverables: [
        'Canadian Resume + Cover Letter rewrite',
        'Two 45-min strategy & mock interview sessions',
        'ECA / Credential evaluation document checklist',
      ],
      turnaround: 'Priority 5-Day Delivery',
      active: true,
    },
    {
      id: 'srv_sub_monthly',
      name: 'Premium Job Alerts (Monthly)',
      category: 'subscription',
      priceCad: 12,
      description:
        'Unlimited saved jobs, instant WhatsApp & dashboard alerts for newly verified LMIA-friendly roles, and priority advisor message response.',
      deliverables: [
        'Unlimited saved jobs (free tier limit is 5)',
        'Instant verified job alerts by province',
        'Priority advisor Q&A messaging',
      ],
      turnaround: 'Instant Activation',
      active: true,
    },
    {
      id: 'srv_sub_yearly',
      name: 'Premium Job Alerts (Annual)',
      category: 'subscription',
      priceCad: 99,
      description:
        'Full-year unlimited job saves, priority alerts, and complimentary Canadian CV formatting audit.',
      deliverables: [
        '12 months unlimited saved jobs & alerts',
        'Annual Canadian CV review included',
        'Save 31% compared to monthly billing',
      ],
      turnaround: 'Instant Activation',
      active: true,
    },
    {
      id: 'srv_emp_featured',
      name: 'Employer Featured Vacancy Spotlight',
      category: 'employer_ad',
      priceCad: 149,
      description:
        'For verified Canadian employers: pin your active job listing at the top of search results with a Sponsored & Verified badge for 30 days.',
      deliverables: [
        'Top-of-feed Featured placement for 30 days',
        'Highlighted employer verification badge',
        'Candidate shortlist notifications',
      ],
      turnaround: 'Instant Activation',
      active: true,
    },
  ];

  const affiliates: AffiliatePartner[] = [
    {
      id: 'aff_wes',
      name: 'WES Credential Evaluation Guide',
      category: 'Credential Assessment',
      description: 'Official Educational Credential Assessment (ECA) guidance for Kenyan and African degrees.',
      url: 'https://www.wes.org/ca/',
      badge: 'Official ECA Partner Link',
    },
    {
      id: 'aff_ielts',
      name: 'IELTS / CELPIP Preparation Hub',
      category: 'Language Testing',
      description: 'Prepare for CLB 7+ English proficiency tests required by Canadian employers and IRCC.',
      url: 'https://www.ielts.org/',
      badge: 'Test Prep Resource',
    },
    {
      id: 'aff_wise',
      name: 'Wise CAD ↔ KES Transfers',
      category: 'Relocation Finance',
      description: 'Low-fee cross-border transfers for settlement funds and international application fees.',
      url: 'https://wise.com/',
      badge: 'Currency Partner',
    },
  ];

  const blogArticles: BlogArticle[] = [
    {
      id: 'blog_1',
      slug: 'how-canadian-resume-differs-from-kenyan-cv',
      title: 'How a Canadian Resume Differs From a Kenyan CV (And Why ATS Rejects Photos)',
      category: 'CV & Career Prep',
      readTime: '6 min read',
      author: 'Grace Otieno',
      publishedAt: '2026-10-12',
      excerpt:
        'Canadian employers strictly prohibit photos, age, marital status, and ID numbers on resumes due to human rights hiring standards. Learn the exact 2-page format recruiters expect.',
      content: [
        'One of the fastest ways qualified Kenyan nurses, drivers, and tradespeople get filtered out by Canadian applicant tracking systems (ATS) is submitting a 5-page traditional CV containing a passport photo, date of birth, or national ID number.',
        'In Canada, privacy and equal-opportunity legislation discourages employers from reviewing personal demographic details. A strong Canadian resume is concise (maximum 2 pages), starts with a 3-line Professional Summary aligned to the Canadian National Occupational Classification (NOC), and highlights measurable achievements.',
        'Always convert Kenyan job titles into recognizable Canadian equivalents while keeping your actual role accurate—for example, clarifying "Kenya Registered Community Health Nurse (KRCHN)" alongside comparable acute/geriatric responsibilities.',
      ],
      keywords: ['Canadian Resume', 'Jobs in Canada for Kenyans', 'ATS CV Format'],
    },
    {
      id: 'blog_2',
      slug: 'spotting-fake-canada-job-offers-anti-scam-guide',
      title: 'Anti-Scam Checklist: 6 Red Flags of Fake Canadian Visa & Job Offers',
      category: 'Anti-Scam & Compliance',
      readTime: '5 min read',
      author: 'Daniel Kariuki',
      publishedAt: '2026-10-20',
      excerpt:
        'Never pay anyone for a guaranteed Canadian visa or instant job letter. Learn how to verify genuine employers, LMIA numbers, and official IRCC processes.',
      content: [
        'Legitimate Canadian employers NEVER charge job applicants a fee to issue a job offer or Labour Market Impact Assessment (LMIA). Under Canadian federal law, employers must bear all LMIA processing fees.',
        'Be immediately skeptical of WhatsApp forwards promising "Free flight + visa in 14 days for KES 50,000" or letters written from free @gmail.com domains claiming to represent major Canadian hospitals.',
        'At Canada Career Connect, we explicitly separate job discovery from paid advisory services (such as CV rewriting or career coaching) and clearly label whether each listing has verified LMIA support or offers no sponsorship.',
      ],
      keywords: ['Anti-Scam', 'LMIA Verification', 'IRCC Compliance'],
    },
    {
      id: 'blog_3',
      slug: 'ontario-alberta-bc-in-demand-sectors-2026',
      title: 'Ontario, Alberta & BC: Highest-Demand Sectors for International Talent',
      category: 'Provincial Pathways',
      readTime: '7 min read',
      author: 'Samuel Mensah',
      publishedAt: '2026-11-02',
      excerpt:
        'Compare wages, cost of living, and provincial nominee pathways across Healthcare, Class 1 Trucking, and Construction Trades.',
      content: [
        'While Toronto and Vancouver attract the most headlines, smaller cities like Ottawa, Kingston, Calgary, Saskatoon, and Winnipeg often offer faster employer responses and substantially lower housing costs.',
        'Healthcare (PSWs, Registered Practical Nurses) and Red Seal skilled trades remain in structural shortage across nearly all Canadian provinces.',
        'Before applying, research provincial licensing bodies—such as CNO in Ontario for nurses or Alberta Transportation for MELT Class 1 license conversion—so your timeline is realistic.',
      ],
      keywords: ['Ontario Jobs', 'Alberta Trucking', 'Provincial Nominee Program'],
    },
  ];

  const faqs: FaqItem[] = [
    {
      id: 'faq_1',
      category: 'Compliance & Trust',
      question: 'Does paying for a CV rewrite or consultation guarantee a Canadian job or visa?',
      answer:
        'No. No private platform or agent can guarantee a job offer, LMIA approval, or Canadian visa. Only Canadian employers make hiring decisions, and only Immigration, Refugees and Citizenship Canada (IRCC) issues work permits and visas. Our fees cover transparent career preparation, CV formatting, and advisory sessions.',
    },
    {
      id: 'faq_2',
      category: 'Work Permits & LMIA',
      question: 'What do the Work Permit Support badges on job listings mean?',
      answer:
        'We enforce three honest categories: (1) LMIA Verified — sample/verified employer stream supports LMIA applications for eligible candidates; (2) Case-by-Case Support — employer reviews sponsorship eligibility after interviews; (3) No Sponsorship — role currently requires existing Canadian work authorization.',
    },
    {
      id: 'faq_3',
      category: 'Payments',
      question: 'Can I pay in Kenyan Shillings (KES) using M-Pesa?',
      answer:
        'Yes. All paid career preparation services and consultations support both M-Pesa STK Push (KES) and Stripe card payments (CAD) with automatic digital receipts.',
    },
    {
      id: 'faq_4',
      category: 'Applicants',
      question: 'How does Expression of Interest work when I click a job?',
      answer:
        'Submitting an Expression of Interest is 100% free and logs a tracked reference code (EOI-2026-XXXX) in your dashboard. You can optionally request an advisor review to help prepare your Canadian-standard CV before formal employer outreach.',
    },
  ];

  const testimonials: TestimonialItem[] = [
    {
      id: 'test_1',
      name: 'faith N. (Sample Verified Story)',
      originCountry: 'Nairobi, Kenya',
      destinationCity: 'Ottawa, ON',
      role: 'Personal Support Worker Applicant',
      quote:
        'Rewriting my CV into the 2-page Canadian format and preparing my ECA documents with Grace saved me months of silent rejections.',
      verifiedConsent: true,
      dateLabel: 'Sample Testimonial · Oct 2026',
    },
    {
      id: 'test_2',
      name: 'Peter K. (Sample Verified Story)',
      originCountry: 'Eldoret, Kenya',
      destinationCity: 'Calgary, AB',
      role: 'Heavy Commercial Driver',
      quote:
        'Having transparent guidance on Alberta Class 1 MELT requirements helped me avoid fake brokers and prepare properly.',
      verifiedConsent: true,
      dateLabel: 'Sample Testimonial · Sep 2026',
    },
  ];

  const applications: ApplicationRecord[] = [
    {
      id: 'app_seed_1',
      referenceCode: 'EOI-2026-4821',
      applicantId: 'usr_app_1',
      applicantName: 'Amina Wanjiku',
      applicantEmail: 'amina.wanjiku@example.com',
      jobId: 'job_4',
      jobTitle: 'Registered Practical Nurse / Acute Care RN',
      companyName: 'MapleCare Senior Residences (Sample Employer)',
      province: 'Ontario',
      stage: 'Agent Consultation',
      assistanceStatus: 'Agent Review Requested',
      assignedAgentId: 'usr_agent_1',
      assignedAgentName: 'Grace Otieno',
      note: 'Completed BSc Nursing in Nairobi with 5 years acute care ward experience. NNAS account initiated.',
      agentNotes: 'Strong clinical profile. Scheduled CV alignment review before employer submission.',
      createdAt: '2026-11-01T10:00:00.000Z',
      updatedAt: '2026-11-05T14:20:00.000Z',
    },
  ];

  const leads: LeadRecord[] = [
    {
      id: 'lead_seed_1',
      referenceNumber: 'CCC-2026-7310',
      applicantId: 'usr_app_1',
      fullName: 'Amina Wanjiku',
      email: 'amina.wanjiku@example.com',
      phone: '+254 711 456 789',
      countryOfResidence: 'Kenya',
      preferredJobCategory: 'Healthcare',
      workExperience: '5 years Registered Nurse',
      educationLevel: 'BSc Nursing',
      preferredProvince: 'Ontario',
      assistanceType: 'CV Rewrite & NNAS Roadmap',
      message: 'Looking for guidance on Ontario nursing care roles and LMIA-verified employers.',
      status: 'CONSULTATION BOOKED',
      assignedAgentId: 'usr_agent_1',
      assignedAgentName: 'Grace Otieno',
      privateNotes: [
        {
          id: 'note_seed_1',
          author: 'Grace Otieno',
          text: 'Verified nursing degree transcript ready for WES/NNAS checklist.',
          createdAt: '2026-11-04T09:30:00.000Z',
        },
      ],
      createdAt: '2026-11-02T08:00:00.000Z',
      updatedAt: '2026-11-04T09:30:00.000Z',
    },
  ];

  const consultations: ConsultationRecord[] = [
    {
      id: 'con_seed_1',
      applicantId: 'usr_app_1',
      applicantName: 'Amina Wanjiku',
      applicantEmail: 'amina.wanjiku@example.com',
      agentId: 'usr_agent_1',
      agentName: 'Grace Otieno',
      serviceType: '1-on-1 Canadian Career & Relocation Consultation',
      scheduledDate: '2026-11-24',
      scheduledTime: '15:00',
      timezone: 'EAT (Nairobi, UTC+3)',
      priceCad: 45,
      paymentStatus: 'Paid',
      status: 'Scheduled',
      notes: 'Reviewing Ontario RN/PSW CV alignment and NNAS checklist.',
      createdAt: '2026-11-03T11:00:00.000Z',
    },
  ];

  const payments: PaymentRecord[] = [
    {
      id: 'pay_seed_1',
      receiptNumber: 'CCC-RCP-8421901',
      userId: 'usr_app_1',
      userName: 'Amina Wanjiku',
      userEmail: 'amina.wanjiku@example.com',
      serviceId: 'srv_consult_career',
      serviceName: '1-on-1 Canadian Career & Relocation Consultation',
      category: 'consultation',
      amountCad: 45,
      amountKes: 4320,
      currency: 'KES',
      gateway: 'mpesa',
      paymentDetails: 'M-Pesa STK Push (+254711***789) · Ref SJK8421A9',
      status: 'Completed',
      createdAt: '2026-11-03T10:58:00.000Z',
    },
  ];

  const messages: MessageRecord[] = [
    {
      id: 'msg_seed_1',
      senderId: 'usr_agent_1',
      senderName: 'Grace Otieno',
      senderRole: 'agent',
      recipientId: 'usr_app_1',
      recipientName: 'Amina Wanjiku',
      body: 'Habari Amina! I reviewed your nursing experience and uploaded your Ontario PSW/RN preparation checklist notes. Feel free to upload your current CV in the Document Vault before our session.',
      read: false,
      createdAt: '2026-11-04T11:15:00.000Z',
    },
  ];

  const notifications: NotificationRecord[] = [
    {
      id: 'notif_seed_1',
      userId: 'usr_app_1',
      title: 'Advisor Message from Grace Otieno',
      message: 'Your advisor left notes on your Ontario healthcare pathway.',
      type: 'application',
      read: false,
      createdAt: now,
    },
  ];

  const auditLogs: AuditLogEntry[] = [
    {
      id: 'aud_seed_1',
      userId: 'usr_admin_1',
      userEmail: 'admin@canadacareerconnect.example',
      action: 'PLATFORM_INITIALIZED',
      details: 'Initial compliance dataset and sample verified employers loaded.',
      createdAt: now,
    },
  ];

  return {
    users,
    jobs,
    applications,
    leads,
    payments,
    documents: [],
    messages,
    consultations,
    notifications,
    services,
    affiliates,
    blogArticles,
    faqs,
    testimonials,
    auditLogs,
    settings: {
      cadToKesRate: 96,
      whatsappNumber: process.env.WHATSAPP_BUSINESS_NUMBER || '+254700123456',
      supportEmail: 'desk@canadacareerconnect.example',
      disclaimerBanner:
        'Independent International Career & Relocation Discovery Platform — Not affiliated with the Government of Canada or IRCC. Job discovery is free; paid services cover CV preparation and career advising only.',
      nairobiDeskHours: 'Mon–Fri 8:00 AM – 6:00 PM EAT · Toronto Desk 9:00 AM – 5:00 PM EST',
    },
  };
}

let cachedStore: StoreState | null = null;

export function getStore(): StoreState {
  if (cachedStore) return cachedStore;
  try {
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as StoreState;
      if (parsed && Array.isArray(parsed.users) && Array.isArray(parsed.jobs)) {
        cachedStore = parsed;
        return cachedStore;
      }
    }
  } catch (err) {
    console.warn('Could not load persisted store from /tmp, initializing fresh store:', err);
  }
  cachedStore = createInitialStore();
  saveStore();
  return cachedStore;
}

export function saveStore(): void {
  if (!cachedStore) return;
  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify(cachedStore), 'utf-8');
  } catch (err) {
    console.warn('Non-fatal store persistence warning:', err);
  }
}

export function addAuditLog(userId: string, userEmail: string, action: string, details: string): void {
  const store = getStore();
  store.auditLogs.unshift({
    id: `aud_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
    userId,
    userEmail,
    action,
    details,
    createdAt: new Date().toISOString(),
  });
  if (store.auditLogs.length > 250) {
    store.auditLogs.length = 250;
  }
}

export function pushNotification(
  userId: string,
  title: string,
  message: string,
  type: NotificationRecord['type']
): void {
  const store = getStore();
  store.notifications.unshift({
    id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
    userId,
    title,
    message,
    type,
    read: false,
    createdAt: new Date().toISOString(),
  });
}
