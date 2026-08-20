import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Sparkles, 
  Mail, 
  Copy, 
  Check, 
  ExternalLink, 
  Wand2, 
  Send, 
  Edit3, 
  Layers, 
  Shield, 
  Building, 
  Calendar, 
  Vote, 
  RefreshCw, 
  CheckCircle2, 
  FileText,
  User,
  Phone,
  Tag,
  Save,
  Database,
  Printer,
  Upload,
  FileCheck,
  Download,
  Eye,
  Trash2,
  Paperclip,
  DollarSign,
  Clock,
  Briefcase
} from 'lucide-react';
import { Project, Status, Tier, ProjectContract } from '../types';
import { supabase } from '../supabase';

export interface ProjectProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  project?: Project | null;
  snapshot?: any | null;
  onSaveProject?: (updated: Project) => void;
  onApplySnapshot?: (updatedSnapshot: any) => void;
  onLaunchStudio?: (project: Project | any) => void;
}

export const ProjectProposalModal: React.FC<ProjectProposalModalProps> = ({
  isOpen,
  onClose,
  project,
  snapshot,
  onSaveProject,
  onApplySnapshot,
  onLaunchStudio
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'proposal' | 'contract' | 'edit'>('proposal');
  const [tone, setTone] = useState<'campaign-presentation' | 'agency-proposal' | 'launch-handoff' | 'donor-outreach'>('agency-proposal');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Extract initial project details
  const initialName = project?.companyName || snapshot?.profile?.name || 'Ernest Trevino for Atascosa County Sheriff';
  const initialClient = project?.clientName || snapshot?.profile?.name || 'Ernest Trevino';
  const initialEmail = snapshot?.profile?.email || project?.blueprint?.profile?.email || 'trevinofortransparency@yahoo.com';
  const initialPhone = snapshot?.profile?.phone || project?.blueprint?.profile?.phone || '(830) 555-VOTE';
  const initialAddress = snapshot?.profile?.address || project?.blueprint?.profile?.address || 'Jourdanton, TX 78026';
  const initialDomain = project?.domain || `https://${initialName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pages.dev`;
  const isCampaign = initialName.toLowerCase().includes('sheriff') || 
                     initialName.toLowerCase().includes('judge') || 
                     initialName.toLowerCase().includes('campaign') ||
                     snapshot?.theme === 'campaign-navy' ||
                     snapshot?.profile?.category === 'Campaign & Leadership';

  // Edit details form state
  const [editForm, setEditForm] = useState({
    companyName: initialName,
    clientName: initialClient,
    email: initialEmail,
    phone: initialPhone,
    address: initialAddress,
    domain: initialDomain,
    status: (project?.status || 'QA & Staging') as Status,
    tier: (project?.tier || 'Lead Generation Site') as Tier,
    tagline: snapshot?.profile?.tagline || project?.blueprint?.profile?.tagline || 'Honest Leadership. Safer Communities. Stronger Atascosa County.',
    treasurer: snapshot?.profile?.treasurerName || project?.blueprint?.profile?.treasurerName || 'Joseph S. Boyle'
  });

  // Proposal Generator state
  const [recipientName, setRecipientName] = useState(initialClient || 'Ernest Trevino for Atascosa County Sheriff');
  const [recipientEmail, setRecipientEmail] = useState(initialEmail || '');
  const [customNotes, setCustomNotes] = useState('');
  const [subject, setSubject] = useState(`Website Demo & Digital Platform Preview for ${initialName}`);
  const [body, setBody] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedContract, setCopiedContract] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Contract Generator state
  const [contractType, setContractType] = useState<'campaign-platform' | 'website-build' | 'retainer-maintenance' | 'custom-scope'>(
    isCampaign ? 'campaign-platform' : 'website-build'
  );
  const [contractTotal, setContractTotal] = useState(isCampaign ? 1495 : 995);
  const [contractDeposit, setContractDeposit] = useState(isCampaign ? 750 : 500);
  const [contractTimeline, setContractTimeline] = useState('3 to 5 business days');
  const [contractCustomClauses, setContractCustomClauses] = useState(
    isCampaign ? 'Includes official campaign treasurer legal disclosure and sheriff badge favicon setup.' : ''
  );
  const [contractTitle, setContractTitle] = useState(`Master Services Agreement — ${initialName}`);
  const [contractText, setContractText] = useState('');
  const [isGeneratingContract, setIsGeneratingContract] = useState(false);
  const [contractsList, setContractsList] = useState<ProjectContract[]>(() => {
    return project?.contracts || snapshot?.contracts || [];
  });
  const [selectedAttachmentPreview, setSelectedAttachmentPreview] = useState<ProjectContract | null>(null);

  // Proposal Templates
  const getProposalTemplate = (targetTone: string, targetNotes: string = '') => {
    const firstName = (recipientName || 'there').split(' ')[0];
    const siteLink = editForm.domain || 'https://trevino-for-sheriff.pages.dev';

    if (targetTone === 'agency-proposal') {
      return {
        subject: `Website Demo & Digital Platform Preview for ${editForm.companyName}`,
        body: `Hi ${firstName},

I put together a live, interactive website demo for ${editForm.companyName} to show you how a modern, high-performance web platform can support your outreach and showcase your record.

You can preview the live working demo directly on your phone or computer here:
👉 ${siteLink}

Key features built into this demo:
• Mobile-First Design & Speed: Blazing fast load times optimized for smartphone users.
• Core Platform & Priorities: Clear presentation of your 3 key platform pillars and background.
• Interactive Community Tools: Built-in event schedule (town halls/rallies), voter info guide, and 1-click yard sign and volunteer intake forms.
• Official Campaign Branding: High-authority gold & navy design tokens with official election legal disclosures (Treasurer: ${editForm.treasurer}).
${targetNotes ? `\nSpecial Highlights Added:\n• ${targetNotes}\n` : ''}
Would you be open to a quick 10-minute call or meeting this week so I can walk you through the demo and answer any questions?

Best regards,
Morgan
Texas Sons Web Development & Digital Strategy
(512) 555-TEXAS | contact.txsons@gmail.com`
      };
    } else if (targetTone === 'launch-handoff') {
      return {
        subject: `${editForm.companyName} — Website Launch & Domain Handoff Ready`,
        body: `Dear ${recipientName || 'Campaign Leadership'},

Your official digital platform for ${editForm.companyName} has passed pre-flight quality assurance and is ready for final launch!

Review the live staging site here:
👉 ${siteLink}

Launch Checklist & Deliverables:
✓ Mobile & Desktop Responsive Design verified
✓ Voter Information Center & Polling Location route active (#voting)
✓ Community Events & RSVP engine connected (#events)
✓ Lead & Volunteer Database capture verified with instant admin portal access
✓ Legal Campaign Disclaimer configured (Treasurer: ${editForm.treasurer})
${targetNotes ? `\nAdditional Notes:\n• ${targetNotes}\n` : ''}
Next Steps:
Please reply to confirm approval, and we will connect your official custom domain name.

Respectfully,
Texas Sons Digital Platform Team
(512) 555-TEXAS | https://texassons.dev`
      };
    } else if (targetTone === 'donor-outreach') {
      return {
        subject: `Join our movement — Official Campaign Platform for ${editForm.companyName}`,
        body: `Dear Community Leader,

We are excited to share the official campaign platform for ${editForm.companyName} with trusted leaders across Atascosa County.

Explore the official campaign website here:
👉 ${siteLink}

With over 28 years of dedicated Texas law enforcement service, Master Peace Officer certification, and the SAPD Medal of Valor, Ernest Trevino is committed to proactive crime interdiction, school safety, and constitutional integrity.

How You Can Support:
• Request a Campaign Yard Sign directly on the site
• RSVP for our upcoming Community Town Hall & BBQ Fundraiser
• Sign up to join our grassroots volunteer coalition
${targetNotes ? `\nCommunity Note:\n• ${targetNotes}\n` : ''}
Thank you for your continued leadership and support.

Respectfully,
Ernest Trevino Campaign Team
Campaign HQ: Jourdanton, TX | (830) 555-VOTE`
      };
    } else {
      // Default: campaign-presentation
      return {
        subject: `${editForm.companyName} — Official Digital Campaign Platform & Presentation`,
        body: `Dear ${recipientName || 'Campaign Leadership'},

We are pleased to present the official live digital campaign platform and website built for ${editForm.companyName}.

You can review the live, fully interactive platform here:
👉 ${siteLink}

Key Highlights Included in This Build:
• Core Policy Platform & Pillars:
  - Proactive Violent Crime & Cartel Narcotics Interdiction
  - School & Campus Safety Taskforce
  - Modernized Jail Operations & Taxpayer Fiscal Accountability

• Verified Career Credentials & Endorsements:
  - SAPD Medal of Valor Tactical Leadership Citation
  - 28+ Years Texas Law Enforcement & Certified Master Peace Officer

• Public Voter Engagement & Mobilization:
  - Live Atascosa County Voter Information Center & Polling Guide
  - Community Town Hall & BBQ Rally RSVP System
  - Instant Yard Sign & Grassroots Volunteer Intake (Direct Database Sync)
  - Official Legal Political Advertising Disclaimer (Treasurer: ${editForm.treasurer})
${targetNotes ? `\nCustom Campaign Instructions:\n• ${targetNotes}\n` : ''}
Please review the live site and let us know your feedback so we can connect your official domain.

Respectfully,
Texas Sons Digital Platform Team
https://texassons.dev | (512) 555-TEXAS`
      };
    }
  };

  // Contract Templates generator
  const getContractTemplate = (type: string, total: number, deposit: number, timeline: string, clauses: string) => {
    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const remaining = total - deposit;
    const isCamp = type === 'campaign-platform' || isCampaign;
    const title = isCamp 
      ? `CAMPAIGN DIGITAL PLATFORM MASTER SERVICES AGREEMENT` 
      : `WEB DEVELOPMENT & DIGITAL SERVICES AGREEMENT`;

    const deliverables = isCamp ? [
      '1. Custom Single-Page Responsive Campaign Web Platform (Mobile & Desktop optimized)',
      '2. Atascosa County Voter Information Center & Polling Location Directory (#voting)',
      '3. Public Community Events & Town Hall / BBQ RSVP System with instant attendee logging (#events)',
      '4. Grassroots Volunteer & Yard Sign Intake Form connected to real-time database sync',
      '5. Texas Election Code § 255.001 Political Advertising Legal Compliance Integration',
      '6. Cloudflare Pages Global Edge CDN Hosting, Custom SSL Security Certificate, and Domain Setup'
    ] : [
      '1. Custom Single-Page High-Conversion Business Marketing Website',
      '2. Interactive Service Catalog, Lead Intake Engine & Customer Inquiries',
      '3. Google Maps Platform Integration & Local Business SEO Schema Markup',
      '4. Fast-loading Mobile Responsive Architecture & Global CDN Hosting',
      '5. Custom Domain Connection & Managed SSL Certificate'
    ];

    const body = `================================================================================
${title}
TEXAS SONS WEB DEVELOPMENT & DIGITAL STRATEGY
================================================================================

EFFECTIVE DATE: ${dateStr}

PARTIES:
This Master Services Agreement ("Agreement") is entered into by and between:
1. AGENCY: Texas Sons Web Development & Digital Strategy ("Agency"), and
2. CLIENT: ${editForm.companyName} ("Client"), represented by ${editForm.clientName}.

WHEREAS, Client desires to retain Agency to design, develop, test, and deploy a custom digital web platform, and Agency agrees to perform such services under the terms and conditions outlined herein.

NOW, THEREFORE, the Parties agree as follows:

--------------------------------------------------------------------------------
SECTION 1: SCOPE OF SERVICES & DELIVERABLES
--------------------------------------------------------------------------------
Agency agrees to execute and deliver the following digital assets and services:
${deliverables.join('\n')}

Demonstration / Staging URL: ${editForm.domain}

--------------------------------------------------------------------------------
SECTION 2: PROJECT TIMELINE & MILESTONES
--------------------------------------------------------------------------------
1. Kickoff & Asset Ingestion: Within 24 hours of initial deposit.
2. Staging Deployment: Estimated within ${timeline || '3 to 5 business days'} following receipt of initial deposit and required branding assets.
3. Client Review Window: Client shall have 3 business days to submit written revision requests.
4. Final Launch & Domain Connection: Within 24 hours of final milestone approval.

--------------------------------------------------------------------------------
SECTION 3: COMPENSATION & PAYMENT TERMS
--------------------------------------------------------------------------------
1. Total Contract Investment: $${total.toLocaleString()} USD
2. Initial Deposit (50%): $${deposit.toLocaleString()} USD (Due upon execution of this Agreement prior to development).
3. Final Milestone Balance (50%): $${remaining.toLocaleString()} USD (Due upon staging approval prior to final custom domain deployment).
4. Payment Methods: Stripe secure digital checkout, ACH bank transfer, or authorized campaign check.

--------------------------------------------------------------------------------
SECTION 4: INTELLECTUAL PROPERTY & OWNERSHIP
--------------------------------------------------------------------------------
1. Client Materials: Client retains full, exclusive ownership of all logos, photographs, campaign biographies, and trademarked materials provided to Agency.
2. Deployed Deliverables: Upon full payment of the Total Contract Investment, Agency assigns to Client a perpetual, irrevocable, worldwide license to use, display, and maintain the deployed digital platform.
3. Agency Tools: Agency retains ownership of its proprietary deployment toolchains, reusable component templates, and build engines.

--------------------------------------------------------------------------------
SECTION 5: LEGAL & REGULATORY COMPLIANCE
--------------------------------------------------------------------------------
${isCamp 
  ? `1. Political Advertising Disclosure: All campaign web pages shall prominently display official political advertising disclosures in accordance with Texas Election Code § 255.001.
2. Campaign Treasurer Authorization: This Agreement and digital assets are authorized by Campaign Treasurer ${editForm.treasurer}.
3. Compliance Responsibility: Client confirms all biographical claims, endorsements, and voter information conform with Texas Ethics Commission rules.`
  : `1. Commercial Non-Infringement: Client warrants that all text, imagery, and trade names provided do not infringe on third-party intellectual property.
2. Data Privacy: Client agrees to comply with standard state consumer privacy and commercial data regulations.`}

--------------------------------------------------------------------------------
SECTION 6: WARRANTIES & LIMITATION OF LIABILITY
--------------------------------------------------------------------------------
1. 30-Day Quality Warranty: Agency warrants that the digital platform shall perform in substantial compliance with modern web standards (Chrome, Safari, Firefox, iOS, Android) for 30 days following launch.
2. Limitation of Liability: In no event shall Agency's aggregate liability under this Agreement exceed the Total Contract Investment paid by Client.

--------------------------------------------------------------------------------
SECTION 7: GOVERNING LAW & DISPUTE RESOLUTION
--------------------------------------------------------------------------------
This Agreement shall be construed and governed in accordance with the laws of the State of Texas. Any legal proceedings arising from this Agreement shall be resolved in the appropriate state courts of Texas.

--------------------------------------------------------------------------------
SECTION 8: SPECIAL CONDITIONS & CUSTOM SCOPE
--------------------------------------------------------------------------------
${clauses || 'Standard execution per Texas Sons quality standards. Hosting and Cloudflare Edge SSL security included.'}

================================================================================
EXECUTION & SIGNATURES
================================================================================
IN WITNESS WHEREOF, the Parties hereto have executed this Agreement as of the Effective Date written above.

CLIENT / CANDIDATE:

Signature: _________________________________________  Date: ____________________

Printed Name: ${editForm.clientName}

Title / Office: ${isCamp ? 'Candidate / Campaign Steering Committee' : 'Authorized Business Representative'}

Organization: ${editForm.companyName}


TEXAS SONS AGENCY REPRESENTATIVE:

Signature: _________________________________________  Date: ____________________

Printed Name: Morgan / Authorized Agent

Title: Principal Director, Texas Sons Web Development & Digital Strategy

================================================================================`;

    return { title: `${title} — ${editForm.companyName}`, body };
  };

  // Re-synchronize form when modal opens or props change
  useEffect(() => {
    if (isOpen) {
      const name = project?.companyName || snapshot?.profile?.name || 'Ernest Trevino for Atascosa County Sheriff';
      const client = project?.clientName || snapshot?.profile?.name || 'Ernest Trevino';
      const email = snapshot?.profile?.email || project?.blueprint?.profile?.email || 'trevinofortransparency@yahoo.com';
      const phone = snapshot?.profile?.phone || project?.blueprint?.profile?.phone || '(830) 555-VOTE';
      const address = snapshot?.profile?.address || project?.blueprint?.profile?.address || 'Jourdanton, TX 78026';
      const domain = project?.domain || `https://${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pages.dev`;
      const status = (project?.status || 'QA & Staging') as Status;
      const tier = (project?.tier || 'Lead Generation Site') as Tier;
      const tagline = snapshot?.profile?.tagline || project?.blueprint?.profile?.tagline || 'Honest Leadership. Safer Communities. Stronger Atascosa County.';
      const treasurer = snapshot?.profile?.treasurerName || project?.blueprint?.profile?.treasurerName || 'Joseph S. Boyle';

      setEditForm({
        companyName: name,
        clientName: client,
        email,
        phone,
        address,
        domain,
        status,
        tier,
        tagline,
        treasurer
      });

      setRecipientName(client);
      setRecipientEmail(email);

      const propTemplate = getProposalTemplate(tone, customNotes);
      setSubject(propTemplate.subject);
      setBody(propTemplate.body);

      const contTemplate = getContractTemplate(contractType, contractTotal, contractDeposit, contractTimeline, contractCustomClauses);
      setContractTitle(contTemplate.title);
      setContractText(contTemplate.body);

      const loadedContracts = project?.contracts || snapshot?.contracts || [];
      setContractsList(loadedContracts);
    }
  }, [isOpen, project, snapshot]);

  const handleSelectTone = (newTone: 'campaign-presentation' | 'agency-proposal' | 'launch-handoff' | 'donor-outreach') => {
    setTone(newTone);
    const template = getProposalTemplate(newTone, customNotes);
    setSubject(template.subject);
    setBody(template.body);
    generateProposal(newTone, customNotes);
  };

  const generateProposal = async (overrideTone?: string, overrideNotes?: string) => {
    const targetTone = overrideTone || tone;
    const targetNotes = overrideNotes !== undefined ? overrideNotes : customNotes;

    const template = getProposalTemplate(targetTone, targetNotes);
    setSubject(template.subject);
    setBody(template.body);

    setIsGenerating(true);
    try {
      const payload = {
        projectName: editForm.companyName,
        siteUrl: editForm.domain,
        recipientName: recipientName,
        tone: targetTone,
        customNotes: targetNotes,
        snapshot: snapshot || project?.blueprint
      };

      const res = await fetch('/api/draft-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success && data.body) {
        setSubject(data.subject || template.subject);
        setBody(data.body);
      }
    } catch (err) {
      console.warn('Using client-side synthesized proposal:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateContract = async () => {
    const template = getContractTemplate(contractType, contractTotal, contractDeposit, contractTimeline, contractCustomClauses);
    setContractTitle(template.title);
    setContractText(template.body);

    setIsGeneratingContract(true);
    try {
      const payload = {
        companyName: editForm.companyName,
        clientName: editForm.clientName,
        contractType,
        totalAmount: contractTotal,
        depositAmount: contractDeposit,
        timeline: contractTimeline,
        customClauses: contractCustomClauses,
        snapshot: snapshot || project?.blueprint
      };

      const res = await fetch('/api/draft-contract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success && data.contractText) {
        setContractTitle(data.title || template.title);
        setContractText(data.contractText);
      }
    } catch (err) {
      console.warn('Using client-side synthesized contract:', err);
    } finally {
      setIsGeneratingContract(false);
    }
  };

  const handlePrintContract = () => {
    const printWindow = window.open('', '_blank', 'width=850,height=1000');
    if (!printWindow) {
      window.print();
      return;
    }

    const printHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${contractTitle}</title>
          <style>
            @page { size: letter; margin: 20mm; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              color: #111827;
              background: #fff;
              line-height: 1.6;
              font-size: 13px;
              padding: 0;
              margin: 0;
            }
            .header {
              border-bottom: 2px solid #ea580c;
              padding-bottom: 12px;
              margin-bottom: 20px;
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
            }
            .agency-title {
              font-size: 18px;
              font-weight: 800;
              color: #0f172a;
              letter-spacing: -0.5px;
            }
            .agency-sub {
              font-size: 12px;
              color: #64748b;
            }
            .contract-title {
              font-size: 16px;
              font-weight: 800;
              text-align: center;
              margin: 20px 0;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            pre {
              white-space: pre-wrap;
              font-family: inherit;
              font-size: 12.5px;
              line-height: 1.65;
              color: #1e293b;
              margin: 0;
            }
            @media print {
              body { font-size: 12px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="agency-title">TEXAS SONS</div>
              <div class="agency-sub">Web Development & Digital Strategy · Austin, TX</div>
            </div>
            <div style="text-align: right; font-size: 11px; color: #64748b;">
              Official Independent Agreement<br/>
              Ref: TXS-${Date.now().toString().slice(-6)}
            </div>
          </div>
          <pre>${contractText.replace(/^[=\-\s]+[\s\S]*?EFFECTIVE DATE:/i, 'EFFECTIVE DATE:')}</pre>
        </body>
      </html>
    `;

    printWindow.document.write(printHtml);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 400);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const fileDataUrl = event.target?.result as string;
      const newContract: ProjectContract = {
        id: `cnt-${Date.now()}`,
        projectId: project?.id,
        clientName: editForm.clientName,
        companyName: editForm.companyName,
        contractType: contractType,
        title: contractTitle,
        status: 'Signed & Active',
        totalAmount: contractTotal,
        depositAmount: contractDeposit,
        remainingAmount: contractTotal - contractDeposit,
        paymentTerms: '50% Initial Deposit / 50% Staging Approval',
        deliverables: ['Custom Web Platform', 'Voter/Lead Engine', 'Cloudflare Hosting'],
        timeline: contractTimeline,
        customClauses: contractCustomClauses,
        generatedText: contractText,
        signedFileUrl: fileDataUrl,
        signedFileName: file.name,
        signedFileSize: `${(file.size / 1024).toFixed(1)} KB`,
        signedAt: new Date().toISOString(),
        signerName: editForm.clientName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const updatedContracts = [newContract, ...contractsList];
      setContractsList(updatedContracts);

      // Save to Project & Supabase
      await saveProjectWithContracts(updatedContracts);
    };

    reader.readAsDataURL(file);
  };

  const handleDeleteContract = async (id: string) => {
    if (!confirm('Remove this signed contract attachment?')) return;
    const updated = contractsList.filter(c => c.id !== id);
    setContractsList(updated);
    await saveProjectWithContracts(updated);
  };

  const saveProjectWithContracts = async (contractsToSave: ProjectContract[]) => {
    const baseSnapshot = snapshot || project?.blueprint || {};
    const updatedProfile = {
      ...(baseSnapshot.profile || {}),
      name: editForm.companyName,
      tagline: editForm.tagline,
      email: editForm.email,
      phone: editForm.phone,
      address: editForm.address,
      treasurerName: editForm.treasurer,
    };

    const updatedBlueprint = {
      ...baseSnapshot,
      profile: updatedProfile,
      contracts: contractsToSave,
      theme: baseSnapshot.theme || 'campaign-navy',
    };

    let targetProjectId = project?.id;
    if (!targetProjectId) {
      targetProjectId = baseSnapshot.id ? (baseSnapshot.id.startsWith('prj-') ? baseSnapshot.id.slice(4) : baseSnapshot.id) : `prj_${Date.now()}`;
    }

    const updatedProject: Project = {
      id: targetProjectId,
      companyName: editForm.companyName,
      clientName: editForm.clientName,
      status: editForm.status,
      tier: editForm.tier,
      domain: editForm.domain,
      updatedAt: new Date().toISOString(),
      ownerId: project?.ownerId || '',
      blueprint: updatedBlueprint,
      contracts: contractsToSave
    };

    if (onSaveProject) onSaveProject(updatedProject);
    if (onApplySnapshot) onApplySnapshot(updatedBlueprint);

    // Save to LocalStorage
    try {
      const savedProjects = localStorage.getItem('txsons_projects');
      let parsedProjects: Project[] = savedProjects ? JSON.parse(savedProjects) : [];
      const pIdx = parsedProjects.findIndex(p => p.id === updatedProject.id);
      if (pIdx >= 0) parsedProjects[pIdx] = updatedProject;
      else parsedProjects = [updatedProject, ...parsedProjects];
      localStorage.setItem('txsons_projects', JSON.stringify(parsedProjects));
    } catch {}

    // Save to Supabase
    try {
      await supabase.from('projects').upsert({
        id: targetProjectId,
        company_name: editForm.companyName,
        client_name: editForm.clientName,
        status: editForm.status,
        tier: editForm.tier,
        domain: editForm.domain,
        updated_at: new Date().toISOString(),
        blueprint: updatedBlueprint
      });
    } catch {}
  };

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await saveProjectWithContracts(contractsList);
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleCopy = () => {
    const fullText = `Subject: ${subject}\n\n${body}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyContract = () => {
    navigator.clipboard.writeText(contractText);
    setCopiedContract(true);
    setTimeout(() => setCopiedContract(false), 2500);
  };

  const handleOpenMailClient = () => {
    const mailtoUrl = `mailto:${encodeURIComponent(recipientEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-stone-900 border border-stone-800 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-stone-200">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-stone-800 flex items-center justify-between bg-stone-950/80">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 flex-shrink-0">
              {isCampaign ? <Shield className="w-5 h-5" /> : <Building className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight truncate">
                  {editForm.companyName}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  {isCampaign ? 'Campaign Platform' : 'Client Website'}
                </span>
                {contractsList.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <FileCheck className="w-3 h-3" />
                    <span>{contractsList.length} Signed Contract{contractsList.length > 1 ? 's' : ''}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-400 truncate mt-0.5 flex items-center gap-2">
                <a href={editForm.domain} target="_blank" rel="noopener noreferrer" className="hover:text-orange-400 flex items-center gap-1 font-mono text-[11px]">
                  <span>{editForm.domain}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-white hover:bg-stone-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Selection Bar */}
        <div className="flex border-b border-stone-800 bg-stone-950 px-4 sm:px-6">
          <button
            onClick={() => setActiveTab('proposal')}
            className={`py-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'proposal'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Proposal & Pitch</span>
          </button>

          <button
            onClick={() => setActiveTab('contract')}
            className={`py-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'contract'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Client Contract & PDF Vault</span>
            {contractsList.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-emerald-500/30 text-emerald-400 text-[10px] flex items-center justify-center font-bold">
                {contractsList.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('edit')}
            className={`py-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'edit'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Project Details</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          
          {/* TAB 1: AI Email Proposal */}
          {activeTab === 'proposal' && (
            <div className="space-y-4">
              
              {/* Tone / Objective Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">
                  Proposal Objective & Tone (Click to switch copy instantly)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectTone('agency-proposal')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      tone === 'agency-proposal'
                        ? 'border-orange-500 bg-orange-600/20 text-white ring-1 ring-orange-500/40 shadow-sm'
                        : 'border-stone-800 bg-stone-950/60 text-stone-400 hover:border-stone-700'
                    }`}
                  >
                    <p className="text-xs font-bold flex items-center gap-1.5 text-orange-400">
                      <span>💼 Client Pitch & Meeting</span>
                    </p>
                    <p className="text-[10px] text-stone-400 mt-1 leading-tight">
                      Offers a quick 10-min meeting to review the live working demo.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectTone('campaign-presentation')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      tone === 'campaign-presentation'
                        ? 'border-orange-500 bg-orange-600/20 text-white ring-1 ring-orange-500/40 shadow-sm'
                        : 'border-stone-800 bg-stone-950/60 text-stone-400 hover:border-stone-700'
                    }`}
                  >
                    <p className="text-xs font-bold flex items-center gap-1.5">
                      <span>🏛️ Campaign Review</span>
                    </p>
                    <p className="text-[10px] text-stone-400 mt-1 leading-tight">
                      Platform, voting guide, and Medal of Valor credentials.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectTone('launch-handoff')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      tone === 'launch-handoff'
                        ? 'border-orange-500 bg-orange-600/20 text-white ring-1 ring-orange-500/40 shadow-sm'
                        : 'border-stone-800 bg-stone-950/60 text-stone-400 hover:border-stone-700'
                    }`}
                  >
                    <p className="text-xs font-bold flex items-center gap-1.5">
                      <span>🚀 Ready to Launch</span>
                    </p>
                    <p className="text-[10px] text-stone-400 mt-1 leading-tight">
                      DNS custom domain connection and admin portal handoff.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectTone('donor-outreach')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      tone === 'donor-outreach'
                        ? 'border-orange-500 bg-orange-600/20 text-white ring-1 ring-orange-500/40 shadow-sm'
                        : 'border-stone-800 bg-stone-950/60 text-stone-400 hover:border-stone-700'
                    }`}
                  >
                    <p className="text-xs font-bold flex items-center gap-1.5">
                      <span>🤝 Community Outreach</span>
                    </p>
                    <p className="text-[10px] text-stone-400 mt-1 leading-tight">
                      Invite leaders to review site and request yard signs.
                    </p>
                  </button>
                </div>
              </div>

              {/* Recipient & Custom Notes Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-400 mb-1">
                    Recipient Name / Candidate Name
                  </label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="e.g. Ernest Trevino"
                    className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-400 mb-1">
                    Recipient Email Address
                  </label>
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="e.g. trevinofortransparency@yahoo.com"
                    className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Custom AI Instructions */}
              <div>
                <label className="block text-xs font-semibold text-stone-400 mb-1">
                  Custom AI Focus / Specific Instructions (Optional)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={customNotes}
                    onChange={(e) => setCustomNotes(e.target.value)}
                    placeholder="e.g. Offer meeting on Tuesday or Thursday, mention the gold Sheriff badge favicon..."
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white focus:outline-none focus:border-orange-500 pr-24"
                  />
                  <button
                    onClick={() => generateProposal(tone, customNotes)}
                    disabled={isGenerating}
                    className="absolute right-1.5 top-1.5 px-3 py-1 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
                  >
                    <RefreshCw className={`w-3 h-3 ${isGenerating ? 'animate-spin' : ''}`} />
                    <span>{isGenerating ? 'Drafting...' : 'Re-Draft'}</span>
                  </button>
                </div>
              </div>

              {/* Subject Line */}
              <div>
                <label className="block text-xs font-semibold text-stone-400 mb-1">
                  Email Subject Line
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs font-bold text-orange-400 focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Email Body Area */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-stone-400">
                    Draft Proposal Message (Editable)
                  </label>
                  <span className="text-[10px] text-stone-500">
                    Live site URL automatically embedded
                  </span>
                </div>
                <textarea
                  rows={11}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full p-3.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-200 leading-relaxed font-sans focus:outline-none focus:border-orange-500 resize-none font-mono text-[11px]"
                />
              </div>

            </div>
          )}

          {/* TAB 2: Client Contract & Agreement */}
          {activeTab === 'contract' && (
            <div className="space-y-5">
              
              {/* Contract Configuration Header Bar */}
              <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                      <FileCheck className="w-4 h-4" />
                      <span>Contract Terms & Deliverables</span>
                    </h4>
                    <p className="text-[11px] text-stone-400 mt-0.5">
                      Draft official agreements governed by Texas law with custom deliverables and signature blocks.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      onClick={handlePrintContract}
                      className="px-3.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print / PDF</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyContract}
                      className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold transition-all border border-stone-700 flex items-center gap-1.5"
                    >
                      {copiedContract ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedContract ? 'Copied!' : 'Copy Text'}</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
                  <div>
                    <label className="block text-[10px] font-semibold text-stone-400 mb-1">Contract Type</label>
                    <select
                      value={contractType}
                      onChange={(e) => setContractType(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-stone-900 border border-stone-800 text-xs text-white focus:outline-none focus:border-orange-500"
                    >
                      <option value="campaign-platform">Campaign Platform MSA</option>
                      <option value="website-build">Commercial Website MSA</option>
                      <option value="retainer-maintenance">Monthly Retainer</option>
                      <option value="custom-scope">Custom Scope Agreement</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-stone-400 mb-1">Total Investment ($)</label>
                    <input
                      type="number"
                      value={contractTotal}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setContractTotal(val);
                        setContractDeposit(Math.round(val * 0.5));
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-stone-900 border border-stone-800 text-xs text-white focus:outline-none focus:border-orange-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-stone-400 mb-1">50% Deposit ($)</label>
                    <input
                      type="number"
                      value={contractDeposit}
                      onChange={(e) => setContractDeposit(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-stone-900 border border-stone-800 text-xs text-white focus:outline-none focus:border-orange-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-stone-400 mb-1">Delivery Timeline</label>
                    <input
                      type="text"
                      value={contractTimeline}
                      onChange={(e) => setContractTimeline(e.target.value)}
                      placeholder="3 to 5 business days"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-stone-900 border border-stone-800 text-xs text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={contractCustomClauses}
                    onChange={(e) => setContractCustomClauses(e.target.value)}
                    placeholder="Custom Clauses / Special Notes (e.g. Includes Joseph S. Boyle campaign treasurer setup)..."
                    className="flex-1 px-3 py-1.5 rounded-lg bg-stone-900 border border-stone-800 text-xs text-stone-200 focus:outline-none focus:border-orange-500"
                  />
                  <button
                    type="button"
                    onClick={generateContract}
                    disabled={isGeneratingContract}
                    className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-orange-400 rounded-lg text-xs font-bold transition-all flex items-center gap-1 border border-stone-700 flex-shrink-0"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingContract ? 'animate-spin' : ''}`} />
                    <span>{isGeneratingContract ? 'Synthesizing...' : 'Re-Draft Contract'}</span>
                  </button>
                </div>
              </div>

              {/* Printable Contract Text Editor / Preview */}
              <div>
                <label className="block text-xs font-semibold text-stone-400 mb-1">
                  Agreement Body (Ready to Print as PDF or Email to Client)
                </label>
                <textarea
                  rows={13}
                  value={contractText}
                  onChange={(e) => setContractText(e.target.value)}
                  className="w-full p-4 rounded-xl bg-stone-950 border border-stone-800 text-stone-200 leading-relaxed font-mono text-[11px] focus:outline-none focus:border-orange-500 resize-none"
                />
              </div>

              {/* Signed Contract Attachment Vault */}
              <div className="p-4 rounded-xl bg-stone-950/80 border border-stone-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Paperclip className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Attached Signed Agreements Vault</span>
                    </h5>
                    <p className="text-[10px] text-stone-400 mt-0.5">
                      Upload the signed PDF or scanned copy to store permanently attached to this project in Supabase.
                    </p>
                  </div>

                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept=".pdf,.png,.jpg,.jpeg"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Signed Contract</span>
                    </button>
                  </div>
                </div>

                {/* Stored Contracts List */}
                {contractsList.length > 0 ? (
                  <div className="space-y-2 pt-1">
                    {contractsList.map((cnt) => (
                      <div
                        key={cnt.id}
                        className="p-3 rounded-lg bg-stone-900 border border-stone-800 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                            <FileCheck className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white truncate">{cnt.signedFileName || cnt.title}</span>
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                {cnt.status}
                              </span>
                            </div>
                            <p className="text-[10px] text-stone-400 mt-0.5">
                              Signed by {cnt.signerName || editForm.clientName} · {cnt.signedFileSize || 'File attached'} · {new Date(cnt.signedAt || cnt.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1.5 flex-shrink-0">
                          {cnt.signedFileUrl && (
                            <a
                              href={cnt.signedFileUrl}
                              download={cnt.signedFileName || 'Signed-Contract.pdf'}
                              className="p-1.5 text-stone-400 hover:text-white hover:bg-stone-800 rounded-lg transition-colors"
                              title="Download Signed Contract"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteContract(cnt.id)}
                            className="p-1.5 text-stone-400 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors"
                            title="Remove Contract"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center rounded-lg border border-dashed border-stone-800 text-stone-500 text-xs">
                    No signed contracts attached yet. Click "Upload Signed Contract" once your client signs.
                  </div>
                )}

              </div>

            </div>
          )}

          {/* TAB 3: Edit Project Details */}
          {activeTab === 'edit' && (
            <form onSubmit={handleSaveDetails} className="space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-400 mb-1">
                    Company / Candidate Name
                  </label>
                  <input
                    type="text"
                    value={editForm.companyName}
                    onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white focus:outline-none focus:border-orange-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-400 mb-1">
                    Client Contact Person
                  </label>
                  <input
                    type="text"
                    value={editForm.clientName}
                    onChange={(e) => setEditForm({ ...editForm, clientName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-400 mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-400 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-400 mb-1">
                    Project Stage / Status
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value as Status })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="Intake">Intake</option>
                    <option value="Scaffolding">Scaffolding</option>
                    <option value="Theme Assembly">Theme Assembly</option>
                    <option value="QA & Staging">QA & Staging</option>
                    <option value="Live">Live</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-400 mb-1">
                    Product Tier
                  </label>
                  <select
                    value={editForm.tier}
                    onChange={(e) => setEditForm({ ...editForm, tier: e.target.value as Tier })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="Basic Website">Basic Website ($495)</option>
                    <option value="Lead Generation Site">Lead Generation Site ($995)</option>
                    <option value="Full Custom Application">Full Custom Application ($2,495)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-400 mb-1">
                    Campaign Treasurer
                  </label>
                  <input
                    type="text"
                    value={editForm.treasurer}
                    onChange={(e) => setEditForm({ ...editForm, treasurer: e.target.value })}
                    placeholder="Joseph S. Boyle"
                    className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-400 mb-1">
                    Live Staging / Production URL
                  </label>
                  <input
                    type="url"
                    value={editForm.domain}
                    onChange={(e) => setEditForm({ ...editForm, domain: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs font-mono text-stone-300 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-400 mb-1">
                    Campaign / Business Address
                  </label>
                  <input
                    type="text"
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    placeholder="Jourdanton, TX 78026"
                    className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-400 mb-1">
                  Tagline / Campaign Motto
                </label>
                <input
                  type="text"
                  value={editForm.tagline}
                  onChange={(e) => setEditForm({ ...editForm, tagline: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              {saveSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Project details saved to Supabase database & local cache!</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-between">
                {onLaunchStudio && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onLaunchStudio(project || snapshot);
                    }}
                    className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold transition-all flex items-center gap-2 border border-stone-700"
                  >
                    <Wand2 className="w-3.5 h-3.5 text-orange-400" />
                    <span>Open in AI Builder Studio</span>
                  </button>
                )}

                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-lg shadow-orange-600/30 flex items-center gap-1.5 ml-auto"
                >
                  {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>{isSaving ? 'Saving...' : 'Save Project Changes'}</span>
                </button>
              </div>

            </form>
          )}

        </div>

        {/* Modal Footer Controls */}
        {activeTab === 'proposal' && (
          <div className="p-4 border-t border-stone-800 bg-stone-950 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-stone-500 flex items-center gap-2">
              <Mail className="w-4 h-4 text-orange-400" />
              <span>Ready to send to candidate or prospective client</span>
            </div>

            <div className="flex items-center space-x-2.5 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleCopy}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold transition-all flex items-center justify-center gap-2 border border-stone-700"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Proposal Text'}</span>
              </button>

              <button
                type="button"
                onClick={handleOpenMailClient}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-all shadow-lg shadow-orange-600/30 flex items-center justify-center gap-2 hover:scale-105"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Open in Email App</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
