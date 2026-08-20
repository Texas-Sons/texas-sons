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
  Tag
} from 'lucide-react';
import { Project, Status, Tier } from '../types';

export interface ProjectProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  project?: Project | null;
  snapshot?: any | null;
  onSaveProject?: (updated: Project) => void;
  onLaunchStudio?: (project: Project | any) => void;
}

export const ProjectProposalModal: React.FC<ProjectProposalModalProps> = ({
  isOpen,
  onClose,
  project,
  snapshot,
  onSaveProject,
  onLaunchStudio
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'proposal' | 'edit'>('proposal');
  const [tone, setTone] = useState<'campaign-presentation' | 'agency-proposal' | 'launch-handoff' | 'donor-outreach'>('campaign-presentation');
  
  // Extract project details
  const initialName = project?.companyName || snapshot?.profile?.name || 'Ernest Trevino for Atascosa County Sheriff';
  const initialClient = project?.clientName || snapshot?.profile?.name || 'Ernest Trevino';
  const initialEmail = snapshot?.profile?.email || 'campaign@trevinoforsheriff.com';
  const initialPhone = snapshot?.profile?.phone || '(830) 555-VOTE';
  const initialDomain = project?.domain || `https://${initialName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pages.dev`;
  const isCampaign = initialName.toLowerCase().includes('sheriff') || 
                     initialName.toLowerCase().includes('judge') || 
                     initialName.toLowerCase().includes('campaign') ||
                     snapshot?.theme === 'campaign-navy';

  // Edit details form state
  const [editForm, setEditForm] = useState({
    companyName: initialName,
    clientName: initialClient,
    email: initialEmail,
    phone: initialPhone,
    domain: initialDomain,
    status: (project?.status || 'QA & Staging') as Status,
    tier: (project?.tier || 'Lead Generation Site') as Tier,
    tagline: snapshot?.profile?.tagline || 'Honest Leadership. Safer Communities. Stronger Atascosa County.',
    treasurer: snapshot?.profile?.treasurerName || 'Joseph S. Boyle'
  });

  // Proposal Generator state
  const [recipientName, setRecipientName] = useState(initialClient || 'Campaign Leadership & Steering Committee');
  const [recipientEmail, setRecipientEmail] = useState(initialEmail || '');
  const [customNotes, setCustomNotes] = useState('');
  const [subject, setSubject] = useState(`${initialName} — Official Digital Platform & Website Review`);
  const [body, setBody] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Generate initial draft on open
  useEffect(() => {
    generateProposal();
  }, [tone]);

  const generateProposal = async () => {
    setIsGenerating(true);
    try {
      const payload = {
        projectName: editForm.companyName,
        siteUrl: editForm.domain,
        recipientName: recipientName,
        tone: tone,
        customNotes: customNotes,
        snapshot: snapshot || {
          profile: {
            name: editForm.companyName,
            tagline: editForm.tagline,
            phone: editForm.phone,
            email: editForm.email,
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
        setSubject(data.subject || `${editForm.companyName} — Official Digital Campaign Platform`);
        setBody(data.body);
      } else {
        throw new Error(data.error || 'Failed to generate proposal');
      }
    } catch (err) {
      console.warn('Using client-side fallback draft:', err);
      const fallbackSubject = `${editForm.companyName} — Official Digital Platform & Presentation`;
      const fallbackBody = `Dear ${recipientName || 'Campaign Leadership'},\n\nWe are pleased to present the official live digital campaign platform and website built for ${editForm.companyName}.\n\nYou can review the live, fully interactive platform here:\n👉 ${editForm.domain}\n\nKey Highlights Included in This Build:\n• Core Policy Platform & Pillars:\n  - Proactive Violent Crime & Cartel Narcotics Interdiction\n  - School & Campus Safety Taskforce\n  - Modernized Jail Operations & Taxpayer Fiscal Accountability\n\n• Verified Career Credentials & Endorsements:\n  - SAPD Medal of Valor Tactical Leadership Citation\n  - 28+ Years Texas Law Enforcement & Certified Master Peace Officer\n\n• Public Voter Engagement & Mobilization:\n  - Live Atascosa County Voter Information Center & Polling Guide\n  - Community Town Hall & BBQ Rally RSVP System\n  - Instant Yard Sign & Grassroots Volunteer Intake (Direct Database Sync)\n  - Official Legal Political Advertising Disclaimer (Treasurer: ${editForm.treasurer})\n\nPlease review the live site and let us know your feedback so we can connect your official domain.\n\nRespectfully,\nTexas Sons Digital Platform Team\nhttps://texassons.dev | (512) 555-TEXAS`;
      setSubject(fallbackSubject);
      setBody(fallbackBody);
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

  const handleSaveDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (project && onSaveProject) {
      const updated: Project = {
        ...project,
        companyName: editForm.companyName,
        clientName: editForm.clientName,
        status: editForm.status,
        tier: editForm.tier,
        domain: editForm.domain,
        updatedAt: new Date().toISOString()
      };
      onSaveProject(updated);
    }
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
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
                  Proposal Objective & Tone
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setTone('campaign-presentation')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      tone === 'campaign-presentation'
                        ? 'border-orange-500 bg-orange-600/20 text-white shadow-sm'
                        : 'border-stone-800 bg-stone-950/60 text-stone-400 hover:border-stone-700'
                    }`}
                  >
                    <p className="text-xs font-bold flex items-center gap-1.5">
                      <span>🏛️ Campaign Review</span>
                    </p>
                    <p className="text-[10px] text-stone-500 mt-1 leading-tight">
                      Platform, voting guide, and Medal of Valor credentials.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTone('agency-proposal')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      tone === 'agency-proposal'
                        ? 'border-orange-500 bg-orange-600/20 text-white shadow-sm'
                        : 'border-stone-800 bg-stone-950/60 text-stone-400 hover:border-stone-700'
                    }`}
                  >
                    <p className="text-xs font-bold flex items-center gap-1.5">
                      <span>💼 Client Pitch</span>
                    </p>
                    <p className="text-[10px] text-stone-500 mt-1 leading-tight">
                      Modern website deliverables, speed, and design value.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTone('launch-handoff')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      tone === 'launch-handoff'
                        ? 'border-orange-500 bg-orange-600/20 text-white shadow-sm'
                        : 'border-stone-800 bg-stone-950/60 text-stone-400 hover:border-stone-700'
                    }`}
                  >
                    <p className="text-xs font-bold flex items-center gap-1.5">
                      <span>🚀 Ready to Launch</span>
                    </p>
                    <p className="text-[10px] text-stone-500 mt-1 leading-tight">
                      DNS custom domain connection and admin portal handoff.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTone('donor-outreach')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      tone === 'donor-outreach'
                        ? 'border-orange-500 bg-orange-600/20 text-white shadow-sm'
                        : 'border-stone-800 bg-stone-950/60 text-stone-400 hover:border-stone-700'
                    }`}
                  >
                    <p className="text-xs font-bold flex items-center gap-1.5">
                      <span>🤝 Community Outreach</span>
                    </p>
                    <p className="text-[10px] text-stone-500 mt-1 leading-tight">
                      Invite leaders to review site and request yard signs.
                    </p>
                  </button>
                </div>
              </div>

              {/* Recipient & Custom Notes Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-400 mb-1">
                    Recipient Name / Organization
                  </label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="e.g. Ernest Trevino Campaign HQ"
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
                    placeholder="e.g. campaign@trevinoforsheriff.com"
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
                    placeholder="e.g. Highlight the upcoming Jourdanton Town Hall and mention Joseph S. Boyle as treasurer..."
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white focus:outline-none focus:border-orange-500 pr-24"
                  />
                  <button
                    onClick={generateProposal}
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
                <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Project details saved successfully!</span>
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
                  className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-all shadow-lg shadow-orange-600/30 flex items-center gap-1.5 ml-auto"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Project Changes</span>
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
