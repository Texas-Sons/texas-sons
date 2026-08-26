import React, { useState, useEffect } from 'react';
import {
  Zap, Layers, ChevronDown, Sparkles, ShieldCheck,
  Camera, Check, Wand2, Users, Briefcase, UtensilsCrossed, Heart,
  Building2, Phone, Mail, MapPin, Clock, Image as ImageIcon,
  Award, MessageSquareQuote, Palette, Sliders, Scale, FileText, Cpu, Terminal
} from 'lucide-react';
import type { ProjectSnapshot } from './AgentBuilderStudio';
import { SUPPORTED_MODELS } from './aiModelConfig';
import type { BusinessProfile, ServiceItem, TestimonialItem } from '../../templates/blocks';

// ── Vertical preset config ────────────────────────────────────────────────────
const VERTICALS = [
  { 
    id: 'campaign', 
    label: 'Campaign & Leadership', 
    icon: ShieldCheck, 
    theme: 'campaign-navy' as const, 
    accentColor: '#C5A059', 
    primaryColor: '#00081e',
    badge: 'Civic Authority'
  },
  { 
    id: 'trades', 
    label: 'Commercial Trades', 
    icon: Briefcase, 
    theme: 'dark' as const, 
    accentColor: '#f97316', 
    primaryColor: '#0c0a09',
    badge: 'High Conversion'
  },
  { 
    id: 'beauty', 
    label: 'Luxury Beauty & Spa', 
    icon: Heart, 
    theme: 'luxury' as const, 
    accentColor: '#d97706', 
    primaryColor: '#1c1917',
    badge: 'Editorial Chic'
  },
  { 
    id: 'bbq', 
    label: 'BBQ & Smokehouse', 
    icon: UtensilsCrossed, 
    theme: 'crimson-bold' as const, 
    accentColor: '#dc2626', 
    primaryColor: '#2b0c0d',
    badge: 'Bold Flavor'
  },
] as const;

// ── Exported types ────────────────────────────────────────────────────────────
export interface InstantFormData {
  title: string;
  category: string;
  name: string;
  tagline: string;
  description: string;
  phone: string;
  email: string;
  address: string;
  hours: string;
  heroImage: string;
  theme: ProjectSnapshot['theme'];
  primaryColor: string;
  accentColor: string;
  treasurerName: string;
  heroVariant: 'split' | 'bento' | 'centered';
  pillar1title: string; pillar1desc: string;
  pillar2title: string; pillar2desc: string;
  pillar3title: string; pillar3desc: string;
  badge1: string; badge2: string; badge3: string; badge4: string;
  proofBadgeText: string;
  endorsement1quote: string; endorsement1author: string; endorsement1role: string;
  endorsement2quote: string; endorsement2author: string; endorsement2role: string;
  endorsement3quote: string; endorsement3author: string; endorsement3role: string;
}

const DEFAULT_FORM: InstantFormData = {
  title: 'Campaign Platform', category: 'Campaign & Leadership', 
  name: 'Ernest Trevino for Sheriff', tagline: 'A Lifetime of Dedicated Service & Courtroom Integrity', 
  description: 'Protecting rural Texas landowners, enhancing county deputy patrols, and maintaining strict fiscal transparency.',
  phone: '(830) 555-VOTE', email: 'campaign@trevinoforsheriff.com', address: 'Jourdanton, TX 78026', hours: 'Mon – Sat: 8AM – 6PM', 
  heroImage: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80',
  theme: 'campaign-navy', primaryColor: '#00081e', accentColor: '#C5A059',
  treasurerName: 'Joseph S. Boyle, CPA', heroVariant: 'split',
  pillar1title: 'Violent Crime Interdiction', pillar1desc: 'Expanding rapid patrol response times and specialized narcotics task force units across rural county highways.',
  pillar2title: 'Landowner Rights & Anti-Poaching', pillar2desc: 'Direct deputy coordination with local ranch managers to safeguard property borders and agricultural livestock.',
  pillar3title: 'Fiscal Responsibility & Grants', pillar3desc: 'Securing state & federal law enforcement equipment grants without burdening local county taxpayers.',
  badge1: '28+ Years Texas Law Enforcement', badge2: 'Master Peace Officer Certified', badge3: 'Unanimously Backed by Deputies', badge4: 'Lifelong Atascosa County Resident', 
  proofBadgeText: 'Official 2026 Endorsements · Law Enforcement Association Verified',
  endorsement1quote: 'Ernest Trevino brings unmatched courtroom composure, proven tactical leadership, and unwavering constitutional dedication to our community.', endorsement1author: 'Judge Ronald Sterling', endorsement1role: 'Presiding County Magistrate (Ret.)',
  endorsement2quote: 'A steadfast defender of rural landowners who always answers the call. He has earned the trust and respect of every deputy.', endorsement2author: 'Captain Marcus Vance', endorsement2role: 'Atascosa Deputy Patrol Commander',
  endorsement3quote: 'He will restore real accountability, transparent budgeting, and swift justice to the Sheriff’s Department from Day One.', endorsement3author: 'Eleanor Rodriguez', endorsement3role: 'President, Pleasanton Small Business Alliance',
};

// ── Helper: Map Snapshot to Form ─────────────────────────────────────────────
function snapshotToForm(snap: ProjectSnapshot): InstantFormData {
  return {
    title: snap.prompt || snap.profile.name || '',
    category: snap.profile.category || 'Campaign & Leadership',
    name: snap.profile.name || '',
    tagline: snap.profile.tagline || '',
    description: snap.profile.description || '',
    phone: snap.profile.phone || '',
    email: snap.profile.email || '',
    address: snap.profile.address || '',
    hours: Array.isArray(snap.profile.hours) ? snap.profile.hours.join(', ') : (snap.profile.hours || ''),
    heroImage: snap.profile.heroImage || '',
    theme: snap.theme || 'campaign-navy',
    primaryColor: snap.profile.primaryColor || '#00081e',
    accentColor: snap.profile.accentColor || '#C5A059',
    treasurerName: snap.profile.treasurerName || '',
    heroVariant: snap.heroVariant || 'split',
    pillar1title: snap.services?.[0]?.title || '',
    pillar1desc: snap.services?.[0]?.description || '',
    pillar2title: snap.services?.[1]?.title || '',
    pillar2desc: snap.services?.[1]?.description || '',
    pillar3title: snap.services?.[2]?.title || '',
    pillar3desc: snap.services?.[2]?.description || '',
    badge1: snap.badges?.[0] || '',
    badge2: snap.badges?.[1] || '',
    badge3: snap.badges?.[2] || '',
    badge4: snap.badges?.[3] || '',
    proofBadgeText: snap.proofBadgeText || '',
    endorsement1quote: snap.testimonials?.[0]?.quote || '',
    endorsement1author: snap.testimonials?.[0]?.author || '',
    endorsement1role: snap.testimonials?.[0]?.role || '',
    endorsement2quote: snap.testimonials?.[1]?.quote || '',
    endorsement2author: snap.testimonials?.[1]?.author || '',
    endorsement2role: snap.testimonials?.[1]?.role || '',
    endorsement3quote: snap.testimonials?.[2]?.quote || '',
    endorsement3author: snap.testimonials?.[2]?.author || '',
    endorsement3role: snap.testimonials?.[2]?.role || '',
  };
}

// ── Helper: build a ProjectSnapshot from form fields ─────────────────────────
function buildSnapshot(form: InstantFormData): Omit<ProjectSnapshot, 'id' | 'prompt' | 'timestamp'> {
  const services: ServiceItem[] = [
    form.pillar1title ? { title: form.pillar1title, description: form.pillar1desc, duration: 'Pillar #1', highlight: true } : null,
    form.pillar2title ? { title: form.pillar2title, description: form.pillar2desc, duration: 'Pillar #2' } : null,
    form.pillar3title ? { title: form.pillar3title, description: form.pillar3desc, duration: 'Pillar #3' } : null,
  ].filter(Boolean) as ServiceItem[];

  const testimonials: TestimonialItem[] = [
    form.endorsement1author ? { quote: form.endorsement1quote, author: form.endorsement1author, role: form.endorsement1role, rating: 5, verified: true } : null,
    form.endorsement2author ? { quote: form.endorsement2quote, author: form.endorsement2author, role: form.endorsement2role, rating: 5, verified: true } : null,
    form.endorsement3author ? { quote: form.endorsement3quote, author: form.endorsement3author, role: form.endorsement3role, rating: 5, verified: true } : null,
  ].filter(Boolean) as TestimonialItem[];

  const badges = [form.badge1, form.badge2, form.badge3, form.badge4].filter(Boolean);

  const profile: BusinessProfile = {
    name: form.name || 'Campaign Name',
    tagline: form.tagline,
    description: form.description,
    phone: form.phone,
    email: form.email,
    address: form.address,
    hours: form.hours,
    heroImage: form.heroImage,
    category: form.category,
    theme: form.theme,
    primaryColor: form.primaryColor,
    accentColor: form.accentColor,
    treasurerName: form.treasurerName || undefined,
  };

  return { 
    profile, 
    services, 
    testimonials, 
    theme: form.theme, 
    heroVariant: form.heroVariant, 
    badges, 
    proofBadgeText: form.proofBadgeText, 
    seo: { title: `${form.name} — ${form.tagline}`, description: form.description } 
  };
}

// ── Component ────────────────────────────────────────────────────────────────
interface BlueprintFormPanelProps {
  activeSnapshot?: ProjectSnapshot;
  onBuild: (snapshot: Omit<ProjectSnapshot, 'id' | 'prompt' | 'timestamp'>) => void;
  onOpenScanner: () => void;
  onOpenHandoff: () => void;
  onOpenAudit: () => void;
  onOpenProposal: () => void;
  isBusy: boolean;
  selectedModel?: string;
  onSelectModel?: (modelId: string) => void;
}

type TabKey = 'brand' | 'pillars' | 'badges' | 'endorsements' | 'theme' | 'all';

export default function BlueprintFormPanel({
  activeSnapshot, onBuild, onOpenScanner, onOpenHandoff, onOpenAudit, onOpenProposal, isBusy,
  selectedModel = 'claude-3-7-sonnet', onSelectModel
}: BlueprintFormPanelProps) {
  const [form, setForm] = useState<InstantFormData>(() => {
    return activeSnapshot ? snapshotToForm(activeSnapshot) : DEFAULT_FORM;
  });

  const [activeTab, setActiveTab] = useState<TabKey>('brand');

  // Synchronize when the user switches snapshots/presets in the Studio
  useEffect(() => {
    if (activeSnapshot) {
      setForm(snapshotToForm(activeSnapshot));
    }
  }, [activeSnapshot?.id, activeSnapshot?.profile?.name]);

  const set = (key: keyof InstantFormData, val: string) =>
    setForm(prev => ({ ...prev, [key]: val }));

  const applyVertical = (v: typeof VERTICALS[number]) => {
    setForm(prev => ({
      ...prev,
      theme: v.theme,
      primaryColor: v.primaryColor,
      accentColor: v.accentColor,
      category: v.label,
    }));
  };

  const handleBuild = () => {
    const snap = buildSnapshot(form);
    onBuild(snap);
  };

  const isCampaign = form.theme === 'campaign-navy' || form.theme === 'campaign-judicial';

  // ── Stitch Component Primitives ────────────────────────────────────────────
  const FormCard = ({ title, icon: Icon, badge, children }: { title: string; icon: React.ComponentType<{ className?: string }>; badge?: string; children: React.ReactNode }) => (
    <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 space-y-3.5 shadow-md backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-stone-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
            <Icon className="w-3.5 h-3.5" />
          </div>
          <h3 className="text-xs font-bold text-stone-100 tracking-wide">{title}</h3>
        </div>
        {badge && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-800 text-stone-400 border border-stone-700">
            {badge}
          </span>
        )}
      </div>
      <div className="space-y-3">
        {children}
      </div>
    </div>
  );

  const InputField = ({ label, id, placeholder, value, onChange, icon: Icon, type = 'text' }: {
    label: string; id: string; placeholder?: string; value: string; onChange: (v: string) => void; icon?: React.ComponentType<{ className?: string }>; type?: string; key?: React.Key;
  }) => (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="block text-[11px] font-bold text-stone-300 uppercase tracking-wider">
          {label}
        </label>
        {value.trim() && (
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Populated" />
        )}
      </div>
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500">
            <Icon className="w-3.5 h-3.5" />
          </div>
        )}
        <input
          id={id}
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={e => onChange(e.target.value)}
          className={`w-full h-10 ${Icon ? 'pl-9.5' : 'px-3.5'} pr-3.5 rounded-xl bg-stone-950/90 border border-stone-700/80 text-xs font-medium text-white placeholder-stone-600 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/25 transition-all shadow-inner`}
        />
      </div>
    </div>
  );

  const TextareaField = ({ label, id, placeholder, value, onChange, rows = 3 }: {
    label: string; id: string; placeholder?: string; value: string; onChange: (v: string) => void; rows?: number;
  }) => (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="block text-[11px] font-bold text-stone-300 uppercase tracking-wider">
          {label}
        </label>
        {value.trim() && (
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Populated" />
        )}
      </div>
      <textarea
        id={id}
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950/90 border border-stone-700/80 text-xs font-medium text-white placeholder-stone-600 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/25 transition-all resize-none shadow-inner leading-relaxed"
      />
    </div>
  );

  return (
    <div className="w-full space-y-4 px-3.5 py-3 pb-32">

      {/* ── Stitch Vertical Presets ──────────────────────────────────────── */}
      <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-3.5 shadow-md">
        <div className="flex items-center justify-between mb-2.5">
          <p className="text-[11px] font-bold text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-orange-500" /> Vertical Presets
          </p>
          <span className="text-[10px] text-orange-400 font-semibold">1-Click Layouts</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {VERTICALS.map(v => {
            const active = form.theme === v.theme;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => applyVertical(v)}
                className={`flex flex-col text-left p-2.5 rounded-xl border transition-all relative overflow-hidden ${
                  active
                    ? 'border-orange-500 bg-orange-500/10 text-white shadow-sm shadow-orange-500/20 ring-1 ring-orange-500/40'
                    : 'border-stone-800 bg-stone-950/80 text-stone-400 hover:border-stone-700 hover:text-stone-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="w-6 h-6 rounded-lg bg-stone-900 border border-stone-800 flex items-center justify-center">
                    <v.icon className={`w-3.5 h-3.5 ${active ? 'text-orange-400' : 'text-stone-400'}`} />
                  </div>
                  {active && <Check className="w-3.5 h-3.5 text-orange-400" />}
                </div>
                <span className="text-xs font-bold truncate text-stone-100">{v.label}</span>
                <span className="text-[9px] text-stone-500 mt-0.5">{v.badge}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Segmented Navigation Tabs ────────────────────────────────────── */}
      <div className="flex items-center gap-1 p-1 bg-stone-950 rounded-xl border border-stone-800 sticky top-0 z-20 shadow-lg backdrop-blur-md">
        <button
          type="button"
          onClick={() => setActiveTab('brand')}
          className={`flex-1 py-2 px-1.5 rounded-lg text-[10px] font-bold flex flex-col items-center gap-0.5 transition-all ${
            activeTab === 'brand' ? 'bg-orange-600 text-white shadow-sm shadow-orange-600/30' : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Brand</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('pillars')}
          className={`flex-1 py-2 px-1.5 rounded-lg text-[10px] font-bold flex flex-col items-center gap-0.5 transition-all ${
            activeTab === 'pillars' ? 'bg-orange-600 text-white shadow-sm shadow-orange-600/30' : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Pillars</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('badges')}
          className={`flex-1 py-2 px-1.5 rounded-lg text-[10px] font-bold flex flex-col items-center gap-0.5 transition-all ${
            activeTab === 'badges' ? 'bg-orange-600 text-white shadow-sm shadow-orange-600/30' : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Badges</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('endorsements')}
          className={`flex-1 py-2 px-1.5 rounded-lg text-[10px] font-bold flex flex-col items-center gap-0.5 transition-all ${
            activeTab === 'endorsements' ? 'bg-orange-600 text-white shadow-sm shadow-orange-600/30' : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
          }`}
        >
          <MessageSquareQuote className="w-3.5 h-3.5" />
          <span>Quotes</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('theme')}
          className={`flex-1 py-2 px-1.5 rounded-lg text-[10px] font-bold flex flex-col items-center gap-0.5 transition-all ${
            activeTab === 'theme' ? 'bg-orange-600 text-white shadow-sm shadow-orange-600/30' : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Style</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`py-2 px-2 rounded-lg text-[10px] font-bold flex flex-col items-center gap-0.5 transition-all ${
            activeTab === 'all' ? 'bg-stone-800 text-orange-400 border border-stone-700' : 'text-stone-500 hover:text-stone-300'
          }`}
          title="Show all sections"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>All</span>
        </button>
      </div>

      {/* ── SECTION 1: Brand & Bio ────────────────────────────────────────── */}
      {(activeTab === 'brand' || activeTab === 'all') && (
        <FormCard title="Candidate / Business Identity" icon={Building2} badge="Primary Info">
          <InputField 
            label="Candidate or Business Name" 
            id="name" 
            placeholder="Ernest Trevino for Sheriff" 
            value={form.name} 
            onChange={v => set('name', v)} 
            icon={Building2}
          />
          <InputField 
            label="Official Slogan / Tagline" 
            id="tagline" 
            placeholder="A Lifetime of Dedicated Service" 
            value={form.tagline} 
            onChange={v => set('tagline', v)} 
            icon={Sparkles}
          />
          <TextareaField 
            label="Executive Bio / About Overview" 
            id="description" 
            placeholder="Provide a compelling 2-3 sentence overview..." 
            value={form.description} 
            onChange={v => set('description', v)} 
            rows={3}
          />
          <div className="grid grid-cols-2 gap-2">
            <InputField 
              label="Contact Phone" 
              id="phone" 
              placeholder="(830) 555-VOTE" 
              value={form.phone} 
              onChange={v => set('phone', v)} 
              icon={Phone}
            />
            <InputField 
              label="Official Email" 
              id="email" 
              placeholder="campaign@example.com" 
              value={form.email} 
              onChange={v => set('email', v)} 
              icon={Mail}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <InputField 
              label="HQ Location / City" 
              id="address" 
              placeholder="Jourdanton, TX 78026" 
              value={form.address} 
              onChange={v => set('address', v)} 
              icon={MapPin}
            />
            <InputField 
              label="Office Hours" 
              id="hours" 
              placeholder="Mon – Sat: 8AM – 6PM" 
              value={form.hours} 
              onChange={v => set('hours', v)} 
              icon={Clock}
            />
          </div>
          <InputField 
            label="Hero Portrait Image URL" 
            id="heroImage" 
            placeholder="https://images.unsplash.com/..." 
            value={form.heroImage} 
            onChange={v => set('heroImage', v)} 
            icon={ImageIcon}
          />
          {isCampaign && (
            <div className="p-3 bg-stone-950 rounded-xl border border-stone-800 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-stone-200">
                <Scale className="w-3.5 h-3.5 text-orange-400" />
                <span>Campaign Legal Treasurer Disclosure</span>
              </div>
              <InputField 
                label="Treasurer Name" 
                id="treasurerName" 
                placeholder="Joseph S. Boyle, CPA" 
                value={form.treasurerName} 
                onChange={v => set('treasurerName', v)} 
              />
              <p className="text-[10px] text-stone-500">Auto-injected into legal disclaimers and write-in voting guidelines.</p>
            </div>
          )}
        </FormCard>
      )}

      {/* ── SECTION 2: Platform Pillars / Services ─────────────────────────── */}
      {(activeTab === 'pillars' || activeTab === 'all') && (
        <FormCard title="Platform Pillars & Core Services" icon={ShieldCheck} badge="3 Pillars">
          <div className="space-y-3">
            {([
              ['pillar1title', 'pillar1desc', 'Pillar #1 (Primary)'],
              ['pillar2title', 'pillar2desc', 'Pillar #2'],
              ['pillar3title', 'pillar3desc', 'Pillar #3'],
            ] as const).map(([tk, dk, label]) => (
              <div key={tk} className="p-3 bg-stone-950/80 rounded-xl border border-stone-800 space-y-2">
                <InputField 
                  label={`${label} Headline`} 
                  id={tk} 
                  placeholder="e.g. Violent Crime Interdiction" 
                  value={form[tk]} 
                  onChange={v => set(tk, v)} 
                />
                <TextareaField 
                  label="Detailed Platform Narrative" 
                  id={dk} 
                  placeholder="What this initiative accomplishes for Texas voters..." 
                  value={form[dk]} 
                  onChange={v => set(dk, v)} 
                  rows={2}
                />
              </div>
            ))}
          </div>
        </FormCard>
      )}

      {/* ── SECTION 3: Proof Badges & Credentials ─────────────────────────── */}
      {(activeTab === 'badges' || activeTab === 'all') && (
        <FormCard title="Proof Badges & Verification" icon={Award} badge="4 Credentials">
          <InputField 
            label="Proof Banner Highlight Text" 
            id="proofBadgeText" 
            placeholder="Official 2026 Endorsements · Law Enforcement Verified" 
            value={form.proofBadgeText} 
            onChange={v => set('proofBadgeText', v)} 
            icon={Sparkles}
          />
          <div className="grid grid-cols-2 gap-2">
            {([
              ['badge1', 'Badge #1'],
              ['badge2', 'Badge #2'],
              ['badge3', 'Badge #3'],
              ['badge4', 'Badge #4']
            ] as const).map(([bk, label]) => (
              <InputField 
                key={bk}
                label={label} 
                id={bk} 
                placeholder={`e.g. 28+ Years Experience`} 
                value={form[bk]} 
                onChange={v => set(bk, v)} 
              />
            ))}
          </div>
        </FormCard>
      )}

      {/* ── SECTION 4: Endorsements & Quotes ───────────────────────────────── */}
      {(activeTab === 'endorsements' || activeTab === 'all') && (
        <FormCard title="Endorsements & Testimonials" icon={MessageSquareQuote} badge="3 Quotes">
          <div className="space-y-3.5">
            {([
              ['endorsement1quote', 'endorsement1author', 'endorsement1role', 'Quote #1'],
              ['endorsement2quote', 'endorsement2author', 'endorsement2role', 'Quote #2'],
              ['endorsement3quote', 'endorsement3author', 'endorsement3role', 'Quote #3'],
            ] as const).map(([qk, ak, rk, label], idx) => (
              <div key={qk} className="p-3 bg-stone-950/80 rounded-xl border border-stone-800 space-y-2">
                <TextareaField 
                  label={`${label} Testimonial`} 
                  id={qk} 
                  placeholder={`"A leader of unmatched integrity and decisive action..."`} 
                  value={form[qk]} 
                  onChange={v => set(qk, v)} 
                  rows={2}
                />
                <div className="grid grid-cols-2 gap-2">
                  <InputField 
                    label="Author / Endorser" 
                    id={ak} 
                    placeholder="Judge Ronald Sterling" 
                    value={form[ak]} 
                    onChange={v => set(ak, v)} 
                  />
                  <InputField 
                    label="Official Title / Role" 
                    id={rk} 
                    placeholder="Presiding County Magistrate" 
                    value={form[rk]} 
                    onChange={v => set(rk, v)} 
                  />
                </div>
              </div>
            ))}
          </div>
        </FormCard>
      )}

      {/* ── SECTION 5: Theme & Palette ────────────────────────────────────── */}
      {(activeTab === 'theme' || activeTab === 'all') && (
        <FormCard title="Design System & Theme Tokens" icon={Palette} badge="Stitch Tokens">
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-stone-300 uppercase tracking-wider mb-1.5">
                Design Theme Architecture
              </label>
              <select
                value={form.theme}
                onChange={e => set('theme', e.target.value as InstantFormData['theme'])}
                className="w-full h-10 px-3.5 rounded-xl bg-stone-950 border border-stone-700 text-xs font-semibold text-white focus:outline-none focus:border-orange-500"
              >
                <option value="campaign-navy">Campaign Navy (Civic Blue & Heritage Gold)</option>
                <option value="campaign-judicial">Campaign Judicial (Courtroom White & Gold)</option>
                <option value="luxury">Luxury Dark Gold (Boutique Salon & Spa)</option>
                <option value="crimson-bold">Crimson Bold (Smokehouse & Bold Flavor)</option>
                <option value="emerald-gold">Emerald Gold (Texas Energy & Prestige)</option>
                <option value="dark">Dark Obsidian (Commercial Trades & Construction)</option>
                <option value="light">Light Clean (Professional Consulting)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-300 uppercase tracking-wider mb-1.5">
                Hero Section Wireframe
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['split', 'bento', 'centered'] as const).map(hv => (
                  <button 
                    key={hv} 
                    type="button" 
                    onClick={() => set('heroVariant', hv)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all capitalize ${
                      form.heroVariant === hv 
                        ? 'bg-orange-600 border-orange-500 text-white shadow-sm shadow-orange-600/30' 
                        : 'border-stone-800 bg-stone-950 text-stone-400 hover:border-stone-700 hover:text-stone-200'
                    }`}
                  >
                    {hv}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 bg-stone-950 rounded-xl border border-stone-800">
              <div>
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1.5">Primary Tone</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="color" 
                    value={form.primaryColor} 
                    onChange={e => set('primaryColor', e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer border border-stone-700 bg-transparent" 
                  />
                  <span className="text-xs text-stone-200 font-mono font-bold">{form.primaryColor}</span>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1.5">Accent Gold/Flame</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="color" 
                    value={form.accentColor} 
                    onChange={e => set('accentColor', e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer border border-stone-700 bg-transparent" 
                  />
                  <span className="text-xs text-stone-200 font-mono font-bold">{form.accentColor}</span>
                </div>
              </div>
            </div>
          </div>
        </FormCard>
      )}

      {/* ── Action Buttons & Quick Tools ──────────────────────────────────── */}
      <div className="space-y-2.5 pt-2 pb-4">
        {/* Model Selection Chip */}
        <div className="flex items-center justify-between px-1 text-xs">
          <span className="font-semibold text-stone-400 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-[11px]">AI Model:</span>
          </span>
          <select
            value={selectedModel}
            onChange={(e) => onSelectModel?.(e.target.value)}
            className="bg-stone-900 border border-stone-700 text-orange-400 text-xs font-bold rounded-lg px-2 py-1 focus:outline-none focus:border-orange-500 cursor-pointer max-w-[190px]"
            title="Choose AI Model for Blueprint Synthesis"
          >
            {SUPPORTED_MODELS.map(m => (
              <option key={m.id} value={m.id} className="bg-stone-900 text-stone-200">
                {m.name} ({m.badge})
              </option>
            ))}
          </select>
        </div>

        {/* Primary Build Button */}
        <button
          type="button"
          onClick={handleBuild}
          disabled={isBusy || !form.name.trim()}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-40 text-white text-sm font-black tracking-wide shadow-xl shadow-orange-600/30 transition-all hover:scale-[1.01] active:scale-100 cursor-pointer"
        >
          <Zap className="w-4 h-4 fill-current" />
          <span>⚡ Build Instant Preview</span>
        </button>

        {/* Secondary Quick Tools */}
        <div className="grid grid-cols-3 gap-2">
          <button 
            type="button" 
            onClick={onOpenAudit}
            className="flex flex-col items-center gap-1 py-2.5 rounded-xl border border-stone-800 bg-stone-900/70 hover:bg-stone-800 text-stone-200 text-[11px] font-bold transition-all shadow-sm cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Auto-QC</span>
          </button>
          <button 
            type="button" 
            onClick={onOpenProposal}
            className="flex flex-col items-center gap-1 py-2.5 rounded-xl border border-stone-800 bg-stone-900/70 hover:bg-stone-800 text-stone-200 text-[11px] font-bold transition-all shadow-sm cursor-pointer"
          >
            <Layers className="w-4 h-4 text-blue-400" />
            <span>Proposal</span>
          </button>
          <button 
            type="button" 
            onClick={onOpenScanner}
            className="flex flex-col items-center gap-1 py-2.5 rounded-xl border border-stone-800 bg-stone-900/70 hover:bg-stone-800 text-stone-200 text-[11px] font-bold transition-all shadow-sm cursor-pointer"
          >
            <Camera className="w-4 h-4 text-orange-400" />
            <span>Scan Flyer</span>
          </button>
        </div>

        {/* Antigravity AI Prompt / Master Plan Export */}
        <button 
          type="button" 
          onClick={onOpenHandoff}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 hover:text-orange-300 text-xs font-bold transition-all cursor-pointer shadow-sm"
          title="Get AI Master Plan prompt to give directly to Antigravity"
        >
          <Terminal className="w-4 h-4 text-orange-400" />
          <span>⚡ Antigravity AI Blueprint Prompt</span>
        </button>
      </div>

    </div>
  );
}

