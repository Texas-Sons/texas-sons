export type Tier = 'Basic Website' | 'Lead Generation Site' | 'Full Custom Application' | string;
export type Status = 'Intake' | 'Scaffolding' | 'Theme Assembly' | 'QA & Staging' | 'Live';

export interface ProjectContract {
  id: string;
  projectId?: string;
  clientName: string;
  companyName: string;
  contractType: 'campaign-platform' | 'website-build' | 'retainer-maintenance' | 'custom-scope';
  title: string;
  status: 'Draft' | 'Sent for Signature' | 'Signed & Active' | 'Completed';
  totalAmount: number;
  depositAmount: number;
  remainingAmount: number;
  paymentTerms: string;
  deliverables: string[];
  timeline: string;
  customClauses?: string;
  generatedText?: string;
  signedFileUrl?: string; // Base64 data URL or storage link
  signedFileName?: string;
  signedFileSize?: string;
  signedAt?: string;
  signerName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  clientName: string;
  companyName: string;
  tier: Tier;
  status: Status;
  createdAt?: string;
  updatedAt: string;
  domain?: string;
  ownerId: string;
  blueprint?: any;
  contracts?: ProjectContract[];
}

export interface Invoice {
  id: string;
  projectId: string;
  clientName: string;
  amount: number;
  status: 'Draft' | 'Sent' | 'Paid';
  issueDate: string;
  dueDate: string;
  ownerId: string;
}

export type IntakeStatus = 'New Intake' | 'Assets Pending' | 'Studio Ready' | 'Deposit Paid' | 'Live';

export interface ClientIntake {
  id: string;
  businessName: string;
  share_token?: string;
  share_token_revoked?: boolean;
  clientContact: string;
  email: string;
  phone: string;
  address?: string;
  hours?: string;
  domain?: string;
  category: 'Campaign & Leadership' | 'Food & Beverage' | 'Beauty & Wellness' | 'Home & Trade Services' | 'Professional & Medical';
  tier: Tier;
  status: IntakeStatus;
  theme: 'campaign-navy' | 'campaign-judicial' | 'luxury' | 'crimson-bold' | 'dark' | 'light' | 'emerald-gold' | 'custom';
  primaryColor?: string;
  accentColor?: string;
  tagline?: string;
  description?: string;
  heroImage?: string;
  logoUrl?: string;
  badges?: string[];
  proofBadgeText?: string;
  services?: Array<{
    title: string;
    description: string;
    price?: string;
    duration?: string;
    highlight?: boolean;
  }>;
  testimonials?: Array<{
    quote: string;
    author: string;
    role?: string;
    rating?: number;
    verified?: boolean;
  }>;
  notes?: string;
  depositAmount?: number;
  contracts?: ProjectContract[];
  createdAt: string;
  updatedAt: string;
}

export type ViewState = 'dashboard' | 'projects' | 'clients' | 'agent-builder' | 'billing' | 'settings' | 'prospects';
