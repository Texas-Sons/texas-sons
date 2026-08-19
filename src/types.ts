export type Tier = 'Basic Website' | 'Lead Generation Site' | 'Full Custom Application' | string;
export type Status = 'Intake' | 'Scaffolding' | 'Theme Assembly' | 'QA & Staging' | 'Live';

export interface Project {
  id: string;
  clientName: string;
  companyName: string;
  tier: Tier;
  status: Status;
  updatedAt: string;
  domain?: string;
  ownerId: string;
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

export type ViewState = 'dashboard' | 'projects' | 'clients' | 'agent-builder' | 'billing' | 'settings' | 'prospects';
