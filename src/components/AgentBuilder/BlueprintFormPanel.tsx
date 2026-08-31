import React, { useState, useEffect } from 'react';
import {
  Zap, Layers, ChevronDown, Sparkles, ShieldCheck,
  Camera, Check, Wand2, Users, Briefcase, UtensilsCrossed, Heart,
  Building2, Phone, Mail, MapPin, Clock, Image as ImageIcon, User as UserIcon,
  Award, MessageSquareQuote, Palette, Sliders, Scale, FileText, Cpu, Terminal,
  LayoutGrid, CalendarCheck, Calculator, Vote, Flame, ArrowRight, Shield, CheckCircle2
} from 'lucide-react';
import type { ProjectSnapshot } from './AgentBuilderStudio';
import { SUPPORTED_MODELS } from './aiModelConfig';
import type { BusinessProfile, ServiceItem, TestimonialItem } from '../../templates/blocks';

// ── Layout Archetypes ────────────────────────────────────────────────────────
export interface ArchetypeOption {
  id: string;
  name: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  heroVariant: 'split' | 'bento' | 'centered';
  recommendedTheme: ProjectSnapshot['theme'];
  primaryColor: string;
  accentColor: string;
  category: string;
}

export const ARCHETYPES: ArchetypeOption[] = [
  {
    id: 'civic',
    name: 'Civic Authority',
    badge: 'Commanding',
    icon: ShieldCheck,
    description: 'Split portrait hero, verified credential badges, and direct civic voting access.',
    heroVariant: 'split',
    recommendedTheme: 'campaign-navy',
    primaryColor: '#00081e',
    accentColor: '#C5A059',
    category: 'Campaign & Leadership',
  },
  {
    id: 'bento',
    name: 'Kinetic Bento Grid',
    badge: 'High-Density',
    icon: LayoutGrid,
    description: 'Asymmetric modular cards, live metric counters, and dynamic proof highlights.',
    heroVariant: 'bento',
    recommendedTheme: 'dark',
    primaryColor: '#0c0a09',
    accentColor: '#f97316',
    category: 'Commercial Trades',
  },
  {
    id: 'editorial',
    name: 'Editorial Luxury',
    badge: 'Chic Aesthetic',
    icon: Sparkles,
    description: 'Generous whitespace, metallic champagne accents, and curated lookbook drawers.',
    heroVariant: 'centered',
    recommendedTheme: 'luxury',
    primaryColor: '#1c1917',
    accentColor: '#d97706',
    category: 'Luxury Beauty & Spa',
  },
  {
    id: 'bold-craft',
    name: 'Bold Texas Craft',
    badge: 'High-Impact',
    icon: Flame,
    description: 'Rich dark textures, fiery crimson accents, and bold authentic narrative storytelling.',
    heroVariant: 'split',
    recommendedTheme: 'crimson-bold',
    primaryColor: '#2b0c0d',
    accentColor: '#dc2626',
    category: 'BBQ & Smokehouse',
  }
];

// ── Signature Interactive Features ──────────────────────────────────────────
export interface SignatureFeature {
  id: string;
  name: string;
  tag: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

export const SIGNATURE_FEATURES: SignatureFeature[] = [
  {
    id: 'voting-guide',
    name: 'Interactive Voting Machine Simulator',
    tag: 'Civic Superpower',
    icon: Vote,
    description: 'Step-by-step touch screen simulator, sample ballot review, and precinct finder.',
  },
  {
    id: 'appointment-drawer',
    name: 'Live Appointment & Booking Drawer',
    tag: 'Client Conversion',
    icon: CalendarCheck,
    description: 'Frictionless service picker, time slot selector, and automated lead capture.',
  },
  {
    id: 'quote-calculator',
    name: 'Instant Scope & Estimate Calculator',
    tag: 'Trades & B2B',
    icon: Calculator,
    description: 'Interactive tier selection with real-time budget ranges and project specs.',
  },
  {
    id: 'proof-wall',
    name: 'Verified Authority & Proof Wall',
    tag: 'Reputation',
    icon: Award,
    description: 'Verified badges, video quotes, and authenticated community endorsements.',
  }
];

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
  ownerPhoto: string;
  ownerName: string;
  ownerRole: string;
  theme: ProjectSnapshot['theme'];
  primaryColor: string;
  accentColor: string;
  treasurerName: string;
  heroVariant: 'split' | 'bento' | 'centered';
  selectedArchetype: string;
  selectedFeature: string;
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
  ownerPhoto: '',
  ownerName: '',
  ownerRole: '',
  theme: 'campaign-navy', primaryColor: '#00081e', accentColor: '#C5A059',
  treasurerName: 'Joseph S. Boyle, CPA', heroVariant: 'split',
  selectedArchetype: 'civic',
  selectedFeature: 'voting-guide',
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
    ownerPhoto: snap.profile.ownerPhoto || '',
    ownerName: snap.profile.ownerName || '',
    ownerRole: snap.profile.ownerRole || '',
    theme: snap.theme || 'campaign-navy',
    primaryColor: snap.profile.primaryColor || '#00081e',
    accentColor: snap.profile.accentColor || '#C5A059',
    treasurerName: snap.profile.treasurerName || '',
    heroVariant: snap.heroVariant || 'split',
    selectedArchetype: snap.theme === 'dark' ? 'bento' : snap.theme === 'luxury' ? 'editorial' : snap.theme === 'crimson-bold' ? 'bold-craft' : 'civic',
    selectedFeature: snap.theme === 'campaign-navy' || snap.theme === 'campaign-judicial' ? 'voting-guide' : 'appointment-drawer',
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
    ownerPhoto: form.ownerPhoto,
    ownerName: form.ownerName,
    ownerRole: form.ownerRole,
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

type TabKey = 'archetype' | 'brand' | 'pillars' | 'badges' | 'feature' | 'theme' | 'all';

const Squiggle = ({ className = "w-8 h-1.5 text-[#C5A059]" }: { className?: string }) => (
  <svg viewBox="0 0 36 6" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path
      d="M1 3.5C3.5 1 5.5 1 8 3.5C10.5 6 12.5 6 15 3.5C17.5 1 19.5 1 22 3.5C24.5 6 26.5 6 29 3.5C31.5 1 33.5 1 35 3.5"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default function BlueprintFormPanel({
  activeSnapshot, onBuild, onOpenScanner, onOpenHandoff, onOpenAudit, onOpenProposal, isBusy,
  selectedModel = 'claude-3-7-sonnet', onSelectModel
}: BlueprintFormPanelProps) {
  const [form, setForm] = useState<InstantFormData>(() => {
    return activeSnapshot ? snapshotToForm(activeSnapshot) : DEFAULT_FORM;
  });

  const [activeTab, setActiveTab] = useState<TabKey>('archetype');

  // Synchronize when the user switches snapshots/presets in the Studio
  useEffect(() => {
    if (activeSnapshot) {
      setForm(snapshotToForm(activeSnapshot));
    }
  }, [activeSnapshot?.id, activeSnapshot?.profile?.name]);

  const set = (key: keyof InstantFormData, val: string) =>
    setForm(prev => ({ ...prev, [key]: val }));

  const applyArchetype = (arch: ArchetypeOption) => {
    setForm(prev => ({
      ...prev,
      selectedArchetype: arch.id,
      theme: arch.recommendedTheme,
      heroVariant: arch.heroVariant,
      primaryColor: arch.primaryColor,
      accentColor: arch.accentColor,
      category: arch.category,
    }));
  };

  const handleBuild = () => {
    const snap = buildSnapshot(form);
    onBuild(snap);
  };

  const isCampaign = form.theme === 'campaign-navy' || form.theme === 'campaign-judicial';

  // ── UI Card Primitive with Edgy Color-Blocking & Squiggly Corners ───────────
  const FormCard = ({ title, icon: Icon, badge, children }: { title: string; icon: React.ComponentType<{ className?: string }>; badge?: string; children: React.ReactNode }) => (
    <div className="bg-stone-900/90 border border-stone-800/80 rounded-[22px_12px_24px_14px/14px_24px_12px_22px] p-4 space-y-3.5 shadow-lg backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-stone-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-[14px_6px_16px_8px/8px_16px_6px_14px] bg-[#C5A059]/15 border border-[#C5A059]/30 flex items-center justify-center text-[#C5A059] shadow-sm">
            <Icon className="w-3.5 h-3.5" />
          </div>
          <h3 className="text-xs font-bold text-stone-100 tracking-wide">{title}</h3>
        </div>
        {badge && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-[10px_4px_12px_5px/5px_12px_4px_10px] bg-stone-800 text-stone-300 border border-stone-700">
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
    label: string; id: string; placeholder?: string; value: string; onChange: (v: string) => void; icon?: React.ComponentType<{ className?: string }>; type?: string;
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
          className={`w-full h-10 ${Icon ? 'pl-9.5' : 'px-3.5'} pr-3.5 rounded-[16px_8px_18px_10px/10px_18px_8px_16px] bg-stone-950/90 border border-stone-700/80 text-xs font-medium text-white placeholder-stone-600 focus:outline-none focus:border-[#C5A059] focus:ring-2 focus:ring-[#C5A059]/25 transition-all shadow-inner`}
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
        className="w-full px-3.5 py-2.5 rounded-[16px_8px_18px_10px/10px_18px_8px_16px] bg-stone-950/90 border border-stone-700/80 text-xs font-medium text-white placeholder-stone-600 focus:outline-none focus:border-[#C5A059] focus:ring-2 focus:ring-[#C5A059]/25 transition-all resize-none shadow-inner leading-relaxed"
      />
    </div>
  );

  return (
    <div className="w-full space-y-4 px-3.5 py-3 pb-32">

      {/* ── Brand DNA & Experience Director Header ───────────────────────── */}
      <div className="flex items-center justify-between px-1">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-black uppercase tracking-wider text-stone-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Brand DNA & Experience Director</span>
            </h2>
            <Squiggle className="w-6 h-1.5 text-[#C5A059]/70" />
          </div>
          <p className="text-[10px] text-stone-500">Generative Layouts · Signature Features · Motion</p>
        </div>
      </div>

      {/* ── Segmented Navigation Tabs ────────────────────────────────────── */}
      <div className="grid grid-cols-6 gap-1 p-1 bg-stone-950 rounded-[20px_10px_22px_12px/12px_22px_10px_20px] border border-stone-800 sticky top-0 z-20 shadow-lg backdrop-blur-md">
        <button
          type="button"
          onClick={() => setActiveTab('archetype')}
          className={`py-1.5 px-1 rounded-[14px_6px_16px_8px/8px_16px_6px_14px] text-[9.5px] font-bold flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
            activeTab === 'archetype' ? 'bg-[#C5A059] text-white shadow-sm shadow-[#C5A059]/30 scale-[1.02]' : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
          }`}
          title="Visual Archetype"
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span className="truncate w-full text-center">Archetype</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('feature')}
          className={`py-1.5 px-1 rounded-[14px_6px_16px_8px/8px_16px_6px_14px] text-[9.5px] font-bold flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
            activeTab === 'feature' ? 'bg-[#C5A059] text-white shadow-sm shadow-[#C5A059]/30 scale-[1.02]' : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
          }`}
          title="Signature Feature"
        >
          <Zap className="w-3.5 h-3.5" />
          <span className="truncate w-full text-center">Feature</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('brand')}
          className={`py-1.5 px-1 rounded-[14px_6px_16px_8px/8px_16px_6px_14px] text-[9.5px] font-bold flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
            activeTab === 'brand' ? 'bg-[#C5A059] text-white shadow-sm shadow-[#C5A059]/30 scale-[1.02]' : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
          }`}
          title="Identity & Bio"
        >
          <Building2 className="w-3.5 h-3.5" />
          <span className="truncate w-full text-center">Identity</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('pillars')}
          className={`py-1.5 px-1 rounded-[14px_6px_16px_8px/8px_16px_6px_14px] text-[9.5px] font-bold flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
            activeTab === 'pillars' ? 'bg-[#C5A059] text-white shadow-sm shadow-[#C5A059]/30 scale-[1.02]' : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
          }`}
          title="Platform / Services"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span className="truncate w-full text-center">Pillars</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('theme')}
          className={`py-1.5 px-1 rounded-[14px_6px_16px_8px/8px_16px_6px_14px] text-[9.5px] font-bold flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
            activeTab === 'theme' ? 'bg-[#C5A059] text-white shadow-sm shadow-[#C5A059]/30 scale-[1.02]' : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
          }`}
          title="Style & Tokens"
        >
          <Palette className="w-3.5 h-3.5" />
          <span className="truncate w-full text-center">Style</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`py-1.5 px-1 rounded-[14px_6px_16px_8px/8px_16px_6px_14px] text-[9.5px] font-bold flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
            activeTab === 'all' ? 'bg-stone-800 text-[#C5A059] border border-stone-700' : 'text-stone-500 hover:text-stone-300'
          }`}
          title="Show all sections"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span className="truncate w-full text-center">All</span>
        </button>
      </div>

      {/* ── TAB 1: Layout Archetype & Visual Grammar ───────────────────────── */}
      {(activeTab === 'archetype' || activeTab === 'all') && (
        <FormCard title="Visual Layout Archetype" icon={LayoutGrid} badge="Spatial Grammar">
          <p className="text-[11px] text-stone-400 leading-relaxed">
            Select a custom design grammar tailored to your client's industry energy.
          </p>
          <div className="grid grid-cols-1 gap-2.5">
            {ARCHETYPES.map(arch => {
              const active = form.selectedArchetype === arch.id || form.theme === arch.recommendedTheme;
              return (
                <div
                  key={arch.id}
                  onClick={() => applyArchetype(arch)}
                  className={`p-3 rounded-[14px_6px_16px_8px/8px_16px_6px_14px] border transition-all cursor-pointer relative overflow-hidden active:scale-[0.98] ${
                    active
                      ? 'border-[#C5A059] bg-gradient-to-r from-[#C5A059]/40 via-stone-900 to-stone-950 text-white shadow-md shadow-[#C5A059]/20 ring-1 ring-[#C5A059]/40'
                      : 'border-stone-800/80 bg-stone-950/80 text-stone-400 hover:border-stone-700 hover:text-stone-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-[14px_6px_16px_8px/8px_16px_6px_14px] border flex items-center justify-center transition-all ${
                        active
                          ? 'bg-[#C5A059]/20 border-[#C5A059]/40 text-[#C5A059] shadow-sm'
                          : 'bg-stone-900 border-stone-800 text-stone-400'
                      }`}>
                        <arch.icon className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white">{arch.name}</span>
                        <span className="ml-2 text-[9px] font-bold px-1.5 py-0.5 rounded-[8px_3px_10px_4px/4px_10px_3px_8px] bg-stone-800 text-stone-400 border border-stone-700">
                          {arch.badge}
                        </span>
                      </div>
                    </div>
                    {active && <Check className="w-4 h-4 text-[#C5A059]" />}
                  </div>
                  <p className="text-[11px] text-stone-400 mt-1 pl-10 leading-relaxed">{arch.description}</p>
                </div>
              );
            })}
          </div>
        </FormCard>
      )}

      {/* ── TAB 2: Signature Interactive Superpower ────────────────────────── */}
      {(activeTab === 'feature' || activeTab === 'all') && (
        <FormCard title="Signature Interactive Feature" icon={Zap} badge="Client Superpower">
          <p className="text-[11px] text-stone-400 leading-relaxed">
            Give this client site a signature interactive feature that converts visitors instantly.
          </p>
          <div className="grid grid-cols-1 gap-2.5">
            {SIGNATURE_FEATURES.map(feat => {
              const active = form.selectedFeature === feat.id;
              return (
                <div
                  key={feat.id}
                  onClick={() => set('selectedFeature', feat.id)}
                  className={`p-3 rounded-[14px_6px_16px_8px/8px_16px_6px_14px] border transition-all cursor-pointer relative overflow-hidden active:scale-[0.98] ${
                    active
                      ? 'border-[#C5A059] bg-gradient-to-r from-[#C5A059]/40 via-stone-900 to-stone-950 text-white shadow-md shadow-[#C5A059]/20 ring-1 ring-[#C5A059]/40'
                      : 'border-stone-800/80 bg-stone-950/80 text-stone-400 hover:border-stone-700 hover:text-stone-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-[14px_6px_16px_8px/8px_16px_6px_14px] border flex items-center justify-center transition-all ${
                        active
                          ? 'bg-[#C5A059]/20 border-[#C5A059]/40 text-[#C5A059] shadow-sm'
                          : 'bg-stone-900 border-stone-800 text-stone-400'
                      }`}>
                        <feat.icon className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white">{feat.name}</span>
                        <span className="ml-2 text-[9px] font-bold px-1.5 py-0.5 rounded-[8px_3px_10px_4px/4px_10px_3px_8px] bg-stone-800 text-stone-400 border border-stone-700">
                          {feat.tag}
                        </span>
                      </div>
                    </div>
                    {active && <Check className="w-4 h-4 text-[#C5A059]" />}
                  </div>
                  <p className="text-[11px] text-stone-400 mt-1 pl-10 leading-relaxed">{feat.description}</p>
                </div>
              );
            })}
          </div>
        </FormCard>
      )}

      {/* ── TAB 3: Identity & Story ────────────────────────────────────────── */}
      {(activeTab === 'brand' || activeTab === 'all') && (
        <FormCard title="Candidate / Business Identity" icon={Building2} badge="Primary Bio">
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
            label="Executive Bio / Story Narrative" 
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
              placeholder="campaign@domain.com" 
              value={form.email} 
              onChange={v => set('email', v)} 
              icon={Mail}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <InputField 
              label="HQ Address / County" 
              id="address" 
              placeholder="Jourdanton, TX 78026" 
              value={form.address} 
              onChange={v => set('address', v)} 
              icon={MapPin}
            />
            <InputField 
              label="Operating / Campaign Hours" 
              id="hours" 
              placeholder="Mon – Sat: 8AM – 6PM" 
              value={form.hours} 
              onChange={v => set('hours', v)} 
              icon={Clock}
            />
          </div>
          <InputField 
            label="Hero Image URL" 
            id="heroImage" 
            placeholder="https://..." 
            value={form.heroImage} 
            onChange={v => set('heroImage', v)} 
            icon={ImageIcon}
          />

          {/* The card over the hero image.
            *
            * These three fields existed on the blueprint and in HeroBlock with
            * nowhere to enter them, so the card they drive could not actually be
            * turned on. They replaced a hardcoded "Top Rated Service · 100%
            * Guaranteed · Verified" badge that was true of nobody; with a name
            * and a photo it is true of exactly one person, which is the point.
            *
            * Leave them empty and no card is drawn. An image with no badge looks
            * finished; an invented badge does not. */}
          <InputField 
            label="Owner / Stylist Photo URL" 
            id="ownerPhoto" 
            placeholder="https://... (shown on the hero card)" 
            value={form.ownerPhoto} 
            onChange={v => set('ownerPhoto', v)} 
            icon={ImageIcon}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InputField 
              label="Owner / Stylist Name" 
              id="ownerName" 
              placeholder="Annie Selph" 
              value={form.ownerName} 
              onChange={v => set('ownerName', v)} 
              icon={UserIcon}
            />
            <InputField 
              label="Their Title" 
              id="ownerRole" 
              placeholder="Owner & Master Colorist" 
              value={form.ownerRole} 
              onChange={v => set('ownerRole', v)} 
              icon={UserIcon}
            />
          </div>
          {isCampaign && (
            <InputField 
              label="Campaign Treasurer Name" 
              id="treasurerName" 
              placeholder="Joseph S. Boyle, CPA" 
              value={form.treasurerName} 
              onChange={v => set('treasurerName', v)} 
              icon={Scale}
            />
          )}
        </FormCard>
      )}

      {/* ── TAB 4: Core Pillars & Platform ─────────────────────────────────── */}
      {(activeTab === 'pillars' || activeTab === 'all') && (
        <FormCard title={isCampaign ? "3 Campaign Pillars" : "3 Core Services"} icon={ShieldCheck} badge="Key Focus">
          <div className="space-y-3">
            <div className="p-3 bg-stone-950/80 rounded-xl border border-stone-800 space-y-2">
              <span className="text-[10px] font-bold text-[#C5A059] uppercase tracking-wider">Priority #1 (Hero Highlight)</span>
              <InputField 
                label="Pillar 1 Title" 
                id="p1title" 
                placeholder="Violent Crime Interdiction" 
                value={form.pillar1title} 
                onChange={v => set('pillar1title', v)} 
              />
              <TextareaField 
                label="Pillar 1 Action Plan" 
                id="p1desc" 
                placeholder="Describe specific actions and promises..." 
                value={form.pillar1desc} 
                onChange={v => set('pillar1desc', v)} 
                rows={2}
              />
            </div>

            <div className="p-3 bg-stone-950/80 rounded-xl border border-stone-800 space-y-2">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Priority #2</span>
              <InputField 
                label="Pillar 2 Title" 
                id="p2title" 
                placeholder="Landowner Rights & Anti-Poaching" 
                value={form.pillar2title} 
                onChange={v => set('pillar2title', v)} 
              />
              <TextareaField 
                label="Pillar 2 Action Plan" 
                id="p2desc" 
                placeholder="Describe specific actions and promises..." 
                value={form.pillar2desc} 
                onChange={v => set('pillar2desc', v)} 
                rows={2}
              />
            </div>

            <div className="p-3 bg-stone-950/80 rounded-xl border border-stone-800 space-y-2">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Priority #3</span>
              <InputField 
                label="Pillar 3 Title" 
                id="p3title" 
                placeholder="Fiscal Responsibility & Grants" 
                value={form.pillar3title} 
                onChange={v => set('pillar3title', v)} 
              />
              <TextareaField 
                label="Pillar 3 Action Plan" 
                id="p3desc" 
                placeholder="Describe specific actions and promises..." 
                value={form.pillar3desc} 
                onChange={v => set('pillar3desc', v)} 
                rows={2}
              />
            </div>
          </div>
        </FormCard>
      )}

      {/* ── TAB 5: Authority Proof & Endorsements ───────────────────────────── */}
      {(activeTab === 'badges' || activeTab === 'all') && (
        <div className="space-y-4">
          <FormCard title="Authority Badges" icon={Award} badge="4 Badges">
            <InputField 
              label="Proof Pill Subtitle / Organization Verification" 
              id="proofBadgeText" 
              placeholder="Official 2026 Endorsements · Certified" 
              value={form.proofBadgeText} 
              onChange={v => set('proofBadgeText', v)} 
            />
            <div className="grid grid-cols-2 gap-2">
              <InputField label="Badge 1" id="b1" placeholder="28+ Yrs Experience" value={form.badge1} onChange={v => set('badge1', v)} />
              <InputField label="Badge 2" id="b2" placeholder="Master Peace Officer" value={form.badge2} onChange={v => set('badge2', v)} />
              <InputField label="Badge 3" id="b3" placeholder="Deputies Backing" value={form.badge3} onChange={v => set('badge3', v)} />
              <InputField label="Badge 4" id="b4" placeholder="Lifelong Resident" value={form.badge4} onChange={v => set('badge4', v)} />
            </div>
          </FormCard>

          <FormCard title="Verified Quotes & Endorsements" icon={MessageSquareQuote} badge="Social Proof">
            <div className="p-3 bg-stone-950/80 rounded-xl border border-stone-800 space-y-2">
              <span className="text-[10px] font-bold text-[#C5A059] uppercase tracking-wider">Endorsement #1</span>
              <TextareaField label="Quote" id="e1q" placeholder="Enter endorsement quote..." value={form.endorsement1quote} onChange={v => set('endorsement1quote', v)} rows={2} />
              <div className="grid grid-cols-2 gap-2">
                <InputField label="Author Name" id="e1a" placeholder="Judge Ronald Sterling" value={form.endorsement1author} onChange={v => set('endorsement1author', v)} />
                <InputField label="Role / Title" id="e1r" placeholder="Presiding Magistrate" value={form.endorsement1role} onChange={v => set('endorsement1role', v)} />
              </div>
            </div>

            <div className="p-3 bg-stone-950/80 rounded-xl border border-stone-800 space-y-2">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Endorsement #2</span>
              <TextareaField label="Quote" id="e2q" placeholder="Enter endorsement quote..." value={form.endorsement2quote} onChange={v => set('endorsement2quote', v)} rows={2} />
              <div className="grid grid-cols-2 gap-2">
                <InputField label="Author Name" id="e2a" placeholder="Captain Marcus Vance" value={form.endorsement2author} onChange={v => set('endorsement2author', v)} />
                <InputField label="Role / Title" id="e2r" placeholder="Patrol Commander" value={form.endorsement2role} onChange={v => set('endorsement2role', v)} />
              </div>
            </div>
          </FormCard>
        </div>
      )}

      {/* ── TAB 6: Color Palette & Materials ──────────────────────────────── */}
      {(activeTab === 'theme' || activeTab === 'all') && (
        <FormCard title="Color Palette & Material Physics" icon={Palette} badge="Design Tokens">
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1.5">Theme System Preset</label>
              <select
                value={form.theme}
                onChange={e => set('theme', e.target.value as any)}
                className="w-full h-10 px-3 rounded-xl bg-stone-950 border border-stone-700/80 text-xs font-semibold text-white focus:outline-none focus:border-[#C5A059]"
              >
                <option value="campaign-navy">🏛️ Civic Navy & Texas Gold (Authoritative)</option>
                <option value="campaign-judicial">⚖️ Courtroom Slate & Integrity Bronze</option>
                <option value="dark">⚡ Texas Sons Obsidian & Flame Orange</option>
                <option value="luxury">✨ Editorial Luxury Noir & Champagne</option>
                <option value="crimson-bold">🔥 Smokehouse Crimson & Charcoal</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1.5">Hero Layout Variant</label>
              <div className="grid grid-cols-3 gap-2">
                {(['split', 'bento', 'centered'] as const).map(v => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => set('heroVariant', v)}
                    className={`py-2 px-2 rounded-xl border text-[11px] font-bold capitalize transition-all cursor-pointer ${
                      form.heroVariant === v 
                        ? 'border-[#C5A059] bg-[#C5A059]/10 text-[#C5A059] ring-1 ring-[#C5A059]/30' 
                        : 'border-stone-800 bg-stone-950 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    {v} Hero
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1.5">Primary Background</label>
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
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1.5">Accent Color</label>
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
            <Cpu className="w-3.5 h-3.5 text-[#C5A059]" />
            <span className="text-[11px]">AI Synthesis Engine:</span>
          </span>
          <select
            value={selectedModel}
            onChange={(e) => onSelectModel?.(e.target.value)}
            className="bg-stone-900 border border-stone-700 text-[#C5A059] text-xs font-bold rounded-[14px_6px_16px_8px/8px_16px_6px_14px] px-2.5 py-1 focus:outline-none focus:border-[#C5A059] cursor-pointer max-w-[190px] shadow-sm"
            title="Choose AI Model for Experience Synthesis"
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
          className="w-full flex items-center justify-center gap-2 py-3 rounded-[20px_10px_22px_12px/12px_22px_10px_20px] bg-[#C5A059] hover:bg-[#C5A059] disabled:opacity-40 text-white text-sm font-black tracking-wide shadow-xl shadow-[#C5A059]/30 transition-all hover:scale-[1.01] active:scale-[0.98] cursor-pointer"
        >
          <Zap className="w-4 h-4 fill-current" />
          <span>⚡ Generate Custom Experience</span>
        </button>

        {/* Secondary Quick Tools */}
        <div className="grid grid-cols-3 gap-2">
          <button 
            type="button" 
            onClick={onOpenAudit}
            className="flex flex-col items-center gap-1 py-2.5 rounded-[18px_8px_20px_10px/10px_20px_8px_18px] border border-stone-800 bg-stone-900/80 hover:bg-stone-800 text-stone-200 text-[11px] font-bold transition-all shadow-sm cursor-pointer active:scale-95"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Auto-QC</span>
          </button>
          <button 
            type="button" 
            onClick={onOpenProposal}
            className="flex flex-col items-center gap-1 py-2.5 rounded-[18px_8px_20px_10px/10px_20px_8px_18px] border border-stone-800 bg-stone-900/80 hover:bg-stone-800 text-stone-200 text-[11px] font-bold transition-all shadow-sm cursor-pointer active:scale-95"
          >
            <Layers className="w-4 h-4 text-blue-400" />
            <span>Proposal</span>
          </button>
          <button 
            type="button" 
            onClick={onOpenScanner}
            className="flex flex-col items-center gap-1 py-2.5 rounded-[18px_8px_20px_10px/10px_20px_8px_18px] border border-stone-800 bg-stone-900/80 hover:bg-stone-800 text-stone-200 text-[11px] font-bold transition-all shadow-sm cursor-pointer active:scale-95"
          >
            <Camera className="w-4 h-4 text-[#C5A059]" />
            <span>Scan Flyer</span>
          </button>
        </div>

        {/* Antigravity AI Prompt / Master Plan Export */}
        <button 
          type="button" 
          onClick={onOpenHandoff}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-[20px_10px_22px_12px/12px_22px_10px_20px] border border-[#C5A059]/30 bg-[#C5A059]/10 hover:bg-[#C5A059]/20 text-[#C5A059] hover:text-[#C5A059] text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-[0.98]"
          title="Get AI Master Plan prompt to give directly to Antigravity"
        >
          <Terminal className="w-4 h-4 text-[#C5A059]" />
          <span>⚡ Antigravity AI Experience Prompt</span>
        </button>
      </div>

    </div>
  );
}
