import React, { useState, useEffect } from 'react';
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
  Database
} from 'lucide-react';
import { Project, Status, Tier } from '../types';
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

  const [activeTab, setActiveTab] = useState<'proposal' | 'edit'>('proposal');
  const [tone, setTone] = useState<'campaign-presentation' | 'agency-proposal' | 'launch-handoff' | 'donor-outreach'>('agency-proposal');
  
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
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Template generator helper
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

      const template = getProposalTemplate(tone, customNotes);
      setSubject(template.subject);
      setBody(template.body);
    }
  }, [isOpen, project, snapshot]);

  const handleSelectTone = (newTone: 'campaign-presentation' | 'agency-proposal' | 'launch-handoff' | 'donor-outreach') => {
    setTone(newTone);
    // Instant switch to new tone template
    const template = getProposalTemplate(newTone, customNotes);
    setSubject(template.subject);
    setBody(template.body);
    // Also trigger AI refinement
    generateProposal(newTone, customNotes);
  };

  const generateProposal = async (overrideTone?: string, overrideNotes?: string) => {
    const targetTone = overrideTone || tone;
    const targetNotes = overrideNotes !== undefined ? overrideNotes : customNotes;

    // Apply template immediately so user gets instant zero-latency feedback
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
        snapshot: snapshot || {
          profile: {
            name: editForm.companyName,
            tagline: editForm.tagline,
            phone: editForm.phone,
            email: editForm.email,
            address: editForm.address,
            treasurerName: editForm.treasurer
          },
          services: snapshot?.services || [
            { title: 'Violent Crime & Narcotics Interdiction', description: 'Expanding proactive rural highway patrols and joint task forces targeting cartel narcotics trafficking and property theft networks.' },
            { title: 'School & Campus Safety Taskforce', description: 'Placing certified School Resource Deputies in every county campus and conducting active threat readiness training.' },
            { title: 'Fiscal Transparency & Modernized Jail Ops', description: 'Eliminating administrative waste, modernizing detention facilities, and ensuring every taxpayer dollar is accounted for.' }
          ],
          testimonials: snapshot?.testimonials || [
            { quote: 'When lives were on the line during an active hostage crisis, Trevino led tactical entry from the front with extraordinary courage. His SAPD Medal of Valor speaks for itself.', author: 'Captain Sarah Garza', role: 'Retired SWAT & Tactical Commander' },
            { quote: 'Ernest served as an ROP Detective involved in 165 high-risk felony search warrants, resulting in 1,473 felony suspect arrests and over $100 million in cartel seizures.', author: 'Lieutenant Hector Benavides', role: 'Former Chief of Criminal Investigations' }
          ],
          events: snapshot?.events || [
            { name: 'Jourdanton Community Town Hall & Meet-and-Greet', date: 'Oct 24, 2026', time: '6:30 PM', location: 'Atascosa County Courthouse Annex' },
            { name: 'Sheriff Campaign Rally & BBQ Fundraiser', date: 'Nov 02, 2026', time: '7:00 PM', location: 'Pleasanton Civic Center Plaza' }
          ]
        }
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

  const handleCopy = () => {
    const fullText = `Subject: ${subject}\n\n${body}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenMailClient = () => {
    const mailtoUrl = `mailto:${encodeURIComponent(recipientEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl, '_blank');
  };

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

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
      blueprint: updatedBlueprint
    };

    // 1. Notify Parent callbacks
    if (onSaveProject) {
      onSaveProject(updatedProject);
    }
    if (onApplySnapshot) {
      onApplySnapshot(updatedBlueprint);
    }

    // 2. Persist to LocalStorage (both custom blueprints and projects)
    try {
      const savedProjects = localStorage.getItem('txsons_projects');
      let parsedProjects: Project[] = savedProjects ? JSON.parse(savedProjects) : [];
      const pIdx = parsedProjects.findIndex(p => p.id === updatedProject.id);
      if (pIdx >= 0) {
        parsedProjects[pIdx] = updatedProject;
      } else {
        parsedProjects = [updatedProject, ...parsedProjects];
      }
      localStorage.setItem('txsons_projects', JSON.stringify(parsedProjects));
    } catch {}

    try {
      const savedCustom = localStorage.getItem('txsons_custom_blueprints');
      if (savedCustom) {
        let parsedCustom = JSON.parse(savedCustom);
        parsedCustom = parsedCustom.map((b: any) => b.id === updatedBlueprint.id || b.profile?.name === updatedBlueprint.profile?.name ? updatedBlueprint : b);
        localStorage.setItem('txsons_custom_blueprints', JSON.stringify(parsedCustom));
      }
    } catch {}

    // 3. Persist directly to Supabase
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
    } catch (dbErr) {
      console.warn('Supabase project upsert fallback:', dbErr);
    }

    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
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
            <span>AI Email Proposal & Pitch</span>
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

          {/* TAB 2: Edit Project Details */}
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
