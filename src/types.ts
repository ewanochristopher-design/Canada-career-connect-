export type UserRole = 'applicant' | 'employer' | 'agent' | 'admin';

export type CanadianProvince =
  | 'Ontario'
  | 'British Columbia'
  | 'Alberta'
  | 'Quebec'
  | 'Manitoba'
  | 'Saskatchewan'
  | 'Nova Scotia'
  | 'New Brunswick'
  | 'Newfoundland and Labrador'
  | 'Prince Edward Island';

export type JobCategory =
  | 'Healthcare'
  | 'Truck Driving & Logistics'
  | 'Construction & Trades'
  | 'Hospitality & Food Service'
  | 'Agriculture & Agri-Food'
  | 'Information Technology'
  | 'Office & Administration'
  | 'Manufacturing & Warehouse';

export interface WorkExperienceItem {
  id: string;
  title: string;
  company: string;
  location: string;
  years: string;
  description: string;
}

export interface EducationItem {
  id: string;
  degree: string;
  institution: string;
  year: string;
}

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  role: UserRole;
  phone: string;
  country: string;
  avatarInitials: string;
  bio?: string;
  preferredProvinces: CanadianProvince[];
  preferredCategory?: JobCategory;
  workExperience: WorkExperienceItem[];
  education: EducationItem[];
  skills: string[];
  savedJobIds: string[];
  subscriptionTier: 'free' | 'premium_monthly' | 'premium_yearly';
  subscriptionExpiresAt?: string;
  assignedAgentId?: string;
  agentTitle?: string;
  agentSpecialty?: string;
  agentActive?: boolean;
  companyName?: string;
  companyLogo?: string;
  companyWebsite?: string;
  companyProvince?: CanadianProvince;
  companyCity?: string;
  companyDescription?: string;
  employerVerified?: boolean;
  internalNotes?: string;
  createdAt: string;
}

export type PublicUser = Omit<UserRecord, 'passwordHash'>;

export type WorkPermitSupport =
  | 'lmia_verified'
  | 'employer_supported_case_by_case'
  | 'no_sponsorship_verified';

export interface JobListing {
  id: string;
  title: string;
  employerId: string;
  companyName: string;
  companyLogo: string;
  province: CanadianProvince;
  city: string;
  category: JobCategory;
  salaryMinCad: number;
  salaryMaxCad: number;
  salaryUnit: 'hour' | 'year';
  employmentType: 'Full-Time' | 'Part-Time' | 'Contract' | 'Seasonal';
  experienceLevel: 'Entry Level' | 'Mid Level' | 'Senior Level';
  experienceRequirements: string;
  educationRequirements: string;
  description: string;
  responsibilities: string[];
  qualifications: string[];
  benefits: string[];
  workPermitSupport: WorkPermitSupport;
  workPermitNotes: string;
  applicationDeadline: string;
  verificationStatus: 'Employer Verified' | 'Pending Review' | 'Compliance Flagged';
  published: boolean;
  featured: boolean;
  sponsored: boolean;
  viewsCount: number;
  interestCount: number;
  createdAt: string;
}

export type ApplicationStage =
  | 'Interest Submitted'
  | 'Initial Review'
  | 'Agent Consultation'
  | 'Employer Application'
  | 'Interview Stage'
  | 'Employer Decision'
  | 'Immigration Process';

export interface ApplicationRecord {
  id: string;
  referenceCode: string;
  applicantId: string;
  applicantName: string;
  applicantEmail: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  province: CanadianProvince;
  stage: ApplicationStage;
  assistanceStatus: string;
  assignedAgentId?: string;
  assignedAgentName?: string;
  note: string;
  agentNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export type LeadStatus =
  | 'NEW LEAD'
  | 'CONTACTED'
  | 'CONSULTATION BOOKED'
  | 'CONSULTATION COMPLETED'
  | 'SERVICE OFFERED'
  | 'PAYMENT RECEIVED'
  | 'IN PROGRESS'
  | 'COMPLETED'
  | 'CLOSED';

export interface LeadNote {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

export interface LeadRecord {
  id: string;
  referenceNumber: string;
  applicantId?: string;
  fullName: string;
  email: string;
  phone: string;
  countryOfResidence: string;
  preferredJobCategory: JobCategory;
  workExperience: string;
  educationLevel: string;
  preferredProvince: CanadianProvince;
  assistanceType: string;
  message: string;
  status: LeadStatus;
  assignedAgentId?: string;
  assignedAgentName: string;
  privateNotes: LeadNote[];
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRecord {
  id: string;
  receiptNumber: string;
  userId: string;
  userName: string;
  userEmail: string;
  serviceId: string;
  serviceName: string;
  category: string;
  amountCad: number;
  amountKes: number;
  currency: 'CAD' | 'KES';
  gateway: 'stripe' | 'mpesa';
  paymentDetails: string;
  status: 'Completed' | 'Pending' | 'Refunded';
  createdAt: string;
}

export interface DocumentRecord {
  id: string;
  userId: string;
  fileName: string;
  fileType: string;
  mimeType: string;
  sizeBytes: number;
  contentBase64: string;
  uploadedAt: string;
}

export type PublicDocumentMeta = Omit<DocumentRecord, 'contentBase64'>;

export interface MessageRecord {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  recipientId: string;
  recipientName: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export interface ConsultationRecord {
  id: string;
  applicantId: string;
  applicantName: string;
  applicantEmail: string;
  agentId: string;
  agentName: string;
  serviceType: string;
  scheduledDate: string;
  scheduledTime: string;
  timezone: string;
  priceCad: number;
  paymentStatus: 'Paid' | 'Pending';
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  notes: string;
  createdAt: string;
}

export interface NotificationRecord {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'system' | 'application' | 'lead' | 'payment' | 'consultation' | 'job_alert';
  read: boolean;
  createdAt: string;
}

export interface ServiceItem {
  id: string;
  name: string;
  category: 'consultation' | 'cv_writing' | 'subscription' | 'employer_ad' | 'relocation';
  priceCad: number;
  description: string;
  deliverables: string[];
  turnaround: string;
  popular?: boolean;
  active: boolean;
}

export interface AffiliatePartner {
  id: string;
  name: string;
  category: string;
  description: string;
  url: string;
  badge: string;
}

export interface BlogArticle {
  id: string;
  slug: string;
  title: string;
  category: string;
  readTime: string;
  author: string;
  publishedAt: string;
  excerpt: string;
  content: string[];
  imageUrl?: string;
  keywords: string[];
}

export interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

export interface TestimonialItem {
  id: string;
  name: string;
  originCountry: string;
  destinationCity: string;
  role: string;
  quote: string;
  verifiedConsent: boolean;
  dateLabel: string;
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  details: string;
  createdAt: string;
}

export interface PlatformSettings {
  cadToKesRate: number;
  whatsappNumber: string;
  supportEmail: string;
  disclaimerBanner: string;
  nairobiDeskHours: string;
}

export interface PublicStats {
  availableJobs: number;
  registeredApplicants: number;
  verifiedEmployers: number;
  successfulRelocations: number;
  totalExpressionsOfInterest: number;
  totalActiveAgents: number;
  dataNotice: string;
}

export interface CategorySummary {
  id: string;
  name: JobCategory;
  description: string;
  averageWageCad: string;
  demandLevel: string;
  jobCount: number;
}
