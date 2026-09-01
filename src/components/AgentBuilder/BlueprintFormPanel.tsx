import React, { useState, useEffect } from 'react';
import { resizeImage } from '../IntakePortal/imageUtils';
import {
  Zap, Layers, ChevronDown, Sparkles, ShieldCheck,
  Camera, Check, Wand2, Users, Briefcase, UtensilsCrossed, Heart,
  Building2, Phone, Mail, MapPin, Clock, Image as ImageIcon, User as UserIcon, Upload as UploadIcon,
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
  logoUrl: string;
  logoScale: string;
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
  // Structure only. No content.
  //
  // This used to be one real candidate's entire campaign: his name, his
  // tagline, his contact details, four credential badges, and three
  // endorsements attributed to named people — "Judge Ronald Sterling",
  // "Captain Marcus Vance", "Eleanor Rodriguez" — who never said them.
  //
  // It is the form's STARTING state, so a blank new blueprint opened
  // pre-populated with fabricated quotes from invented officials, one save away
  // from a client's site. Six other copies of this pattern have been removed
  // this week and this was the largest.
  //
  // An empty form is honest and the fields are self-explanatory. Structural
  // defaults stay, because a layout choice is not a claim about anybody.
  title: '', category: '',
  name: '', tagline: '', description: '',
  phone: '', email: '', address: '', hours: '',
  heroImage: '',
  logoUrl: '',
  logoScale: '1',
  ownerPhoto: '', ownerName: '', ownerRole: '',
  theme: 'campaign-navy',
  primaryColor: '', accentColor: '',
  treasurerName: '', heroVariant: 'split',
  selectedArchetype: 'civic',
  selectedFeature: 'voting-guide',
  pillar1title: '', pillar1desc: '',
  pillar2title: '', pillar2desc: '',
  pillar3title: '', pillar3desc: '',
  badge1: '', badge2: '', badge3: '', badge4: '',
  proofBadgeText: '',
  endorsement1quote: '', endorsement1author: '', endorsement1role: '',
  endorsement2quote: '', endorsement2author: '', endorsement2role: '',
  endorsement3quote: '', endorsement3author: '', endorsement3role: '',
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
    logoUrl: snap.profile.logoUrl || '',
    logoScale: String(snap.profile.logoScale ?? 1),
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
/**
 * The form holds a flat subset of the blueprint: three "pillars", three
 * endorsements, four badges, and the profile fields. It is not the whole site,
 * and it used to be treated as though it were — this function constructed a
 * fresh snapshot out of the form alone and the Studio replaced the project with
 * it.
 *
 * For a salon that was ruinous. Nine services became three, each retitled with
 * a campaign's "Pillar #1" in place of its real duration, with the price and
 * the per-service Square link gone. So did the booking URL, the favicon, the
 * gallery, the before/after pairs, the products and the section order — every
 * one of them absent from the form, and therefore, on the next press of the
 * build button, absent from her site. The operator had changed a photo.
 *
 * So the form contributes rather than replaces. Fields it shows are applied by
 * index onto what is already there; everything it has no input for is left
 * exactly as it was.
 */
function mergeServices(base: ServiceItem[], form: InstantFormData): ServiceItem[] {
  const edits = [
    { title: form.pillar1title, description: form.pillar1desc },
    { title: form.pillar2title, description: form.pillar2desc },
    { title: form.pillar3title, description: form.pillar3desc },
  ];
  const next: (ServiceItem | null)[] = [...base];
  edits.forEach((edit, i) => {
    if (!edit.title) {
      // Cleared in the form. Only ever removes a service the form was showing.
      if (i < base.length) next[i] = null;
      return;
    }
    // Spread first: price, duration and bookingUrl live on these objects and
    // have no input here. A "90 min" balayage at $350 must not come back as a
    // campaign pillar because someone edited its description.
    next[i] = { ...(base[i] || {}), title: edit.title, description: edit.description };
  });
  return next.filter(Boolean) as ServiceItem[];
}

function mergeTestimonials(base: TestimonialItem[], form: InstantFormData): TestimonialItem[] {
  const edits = [
    { quote: form.endorsement1quote, author: form.endorsement1author, role: form.endorsement1role },
    { quote: form.endorsement2quote, author: form.endorsement2author, role: form.endorsement2role },
    { quote: form.endorsement3quote, author: form.endorsement3author, role: form.endorsement3role },
  ];
  const next: (TestimonialItem | null)[] = [...base];
  edits.forEach((edit, i) => {
    if (!edit.author) {
      if (i < base.length) next[i] = null;
      return;
    }
    // Typed here means typed by the operator, not confirmed by the person
    // quoted. This used to stamp verified: true and rating: 5 on every one.
    next[i] = { ...(base[i] || {}), quote: edit.quote, author: edit.author, role: edit.role };
  });
  return next.filter(Boolean) as TestimonialItem[];
}

function mergeBadges(base: string[], form: InstantFormData): string[] {
  const next = [...base];
  [form.badge1, form.badge2, form.badge3, form.badge4].forEach((badge, i) => { next[i] = badge; });
  return next.filter(Boolean);
}

function buildSnapshot(
  form: InstantFormData,
  base?: ProjectSnapshot
): Omit<ProjectSnapshot, 'id' | 'prompt' | 'timestamp'> {
  const baseProfile = (base?.profile || {}) as Partial<BusinessProfile>;

  const profile: BusinessProfile = {
    // Everything the form has no field for — bookingUrl, faviconUrl,
    // galleryImages — survives because it is spread in first.
    ...(baseProfile as BusinessProfile),
    name: form.name || 'Campaign Name',
    tagline: form.tagline,
    description: form.description,
    phone: form.phone,
    email: form.email,
    address: form.address,
    hours: form.hours,
    heroImage: form.heroImage,
    logoUrl: form.logoUrl,
    logoScale: Number(form.logoScale) > 0 ? Number(form.logoScale) : 1,
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
    ...(base || {}),
    profile,
    services: mergeServices(Array.isArray(base?.services) ? base!.services : [], form),
    testimonials: mergeTestimonials(Array.isArray(base?.testimonials) ? base!.testimonials : [], form),
    theme: form.theme,
    heroVariant: form.heroVariant,
    badges: mergeBadges(Array.isArray(base?.badges) ? base!.badges : [], form),
    proofBadgeText: form.proofBadgeText,
    seo: { title: `${form.name} — ${form.tagline}`, description: form.description },
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

/**
 * The form primitives live out here, not inside the panel.
 *
 * They were defined in its body, which meant a new function identity on
 * every render — and React compares component types by identity. A different
 * type is not a re-render, it is a different component: the old tree is
 * unmounted and a new one mounted in its place, so the actual <input> DOM
 * node was destroyed and rebuilt after every keystroke. It lost focus, the
 * page jumped to wherever the replacement landed, and typing a name meant
 * clicking back into the field for each letter.
 *
 * None of them closed over anything; every value they use arrives as a prop.
 * So they simply belong at module scope, where their identity is stable and
 * React can see they are the same component as last time.
 */

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

/**
 * A URL field that also accepts a file.
 *
 * The Studio only ever took a URL, while the intake form had an upload
 * button — so the natural move, uploading a photo where the upload button is,
 * put it on the dossier and never on the site. Two stores for the same field
 * and only one way in.
 *
 * Resized on the way in, unlike the intake's version, which runs a raw
 * FileReader and drops a full-size phone photo into the blueprint. That
 * blueprint is injected verbatim into the deployed HTML, so an unresized
 * upload adds megabytes to every visitor's page load.
 */
const PhotoField = ({ label, id, value, onChange, hint }: {
  label: string; id: string; value: string; onChange: (v: string) => void; hint?: string;
}) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between">
      <label htmlFor={id} className="block text-[11px] font-bold text-stone-300 uppercase tracking-wider">
        {label}
      </label>
      {value.trim() && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Populated" />}
    </div>
    <div className="flex items-center gap-2">
      <input
        id={id}
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="https://... or upload"
        className="flex-1 min-w-0 px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-[#C5A059]/60 text-[11px] font-mono"
      />
      <label className="px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-bold cursor-pointer border border-stone-700 flex items-center gap-1.5 flex-shrink-0">
        <UploadIcon className="w-3.5 h-3.5 text-[#C5A059]" />
        <span>Upload</span>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async e => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (!file) return;
            try {
              onChange(await resizeImage(file, 1600));
            } catch {
              alert('That image could not be read. Please try a different one.');
            }
          }}
        />
      </label>
    </div>
    {value.trim() && (
      <div className="flex items-center gap-2">
        <img src={value} alt="" className="w-16 h-16 rounded-lg object-cover border border-stone-800" />
        <button type="button" onClick={() => onChange('')} className="text-[11px] text-stone-500 hover:text-red-400">
          Remove
        </button>
      </div>
    )}
    {hint && <p className="text-[10px] text-stone-600">{hint}</p>}
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
    onBuild(buildSnapshot(form, activeSnapshot));
  };

  const isCampaign = form.theme === 'campaign-navy' || form.theme === 'campaign-judicial';

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
          {/* The logo had no field at all. It could only be set by merging an
              intake submission or editing blueprint JSON, so a Studio blueprint
              without one showed the first-letter avatar with no way to fix it —
              and no indication that a logo was even a thing the site supported. */}
          <PhotoField
            label="Logo"
            id="logoUrl"
            value={form.logoUrl}
            onChange={v => set('logoUrl', v)}
            hint="Shown in the navbar. Without one the site falls back to the first letter of the business name."
          />

          {/* How big it renders is a property of the file, not of the design.
              A wordmark that fills its canvas and a mark sitting in a wide
              margin of transparent pixels need very different heights to read
              as the same size on the page, and no single number in the template
              can be right for both. */}
          {form.logoUrl && (
            <div className="space-y-1.5 -mt-1">
              <div className="flex items-center justify-between">
                <label htmlFor="logoScale" className="text-[11px] font-bold text-stone-400">
                  Logo size
                </label>
                <span className="text-[11px] font-mono text-stone-500">
                  {Math.round(Number(form.logoScale || 1) * 100)}%
                </span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  id="logoScale"
                  type="range"
                  min="0.6"
                  max="1.6"
                  step="0.05"
                  value={form.logoScale || '1'}
                  onChange={e => set('logoScale', e.target.value)}
                  className="flex-1 accent-[#C5A059]"
                />
                <button
                  type="button"
                  onClick={() => set('logoScale', '1')}
                  className="text-[11px] font-bold text-stone-500 hover:text-stone-300"
                >
                  Reset
                </button>
              </div>
              <p className="text-[10px] text-stone-600 leading-snug">
                If it still looks small at the maximum, the file itself has empty
                space around the mark — crop that off and it will fill the space
                it is given.
              </p>
            </div>
          )}

          <PhotoField
            label="Hero Photo"
            id="heroImage"
            value={form.heroImage}
            onChange={v => set('heroImage', v)}
            hint="The large photo in the hero. For a salon this is usually her work, not her face."
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
          <PhotoField
            label="Owner / Stylist Photo"
            id="ownerPhoto"
            value={form.ownerPhoto}
            onChange={v => set('ownerPhoto', v)}
            hint="Shown on the card over the hero, with the name below. Leave empty for no card."
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
