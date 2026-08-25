import React, { useState } from 'react';
import {
  Zap, Layers, ChevronDown, ChevronRight, Sparkles, ShieldCheck,
  Flame, Camera, Terminal, X, Plus, Trash2, Check,
  Wand2, Users, Briefcase, UtensilsCrossed, Heart
} from 'lucide-react';
import type { ProjectSnapshot } from './AgentBuilderStudio';
import type { BusinessProfile, ServiceItem, TestimonialItem } from '../../templates/blocks';

// ── Vertical preset config ────────────────────────────────────────────────────
const VERTICALS = [
  { id: 'campaign', label: 'Campaign & Political', icon: ShieldCheck, theme: 'campaign-navy' as const, accentColor: '#C5A059', primaryColor: '#00081e' },
  { id: 'trades', label: 'Commercial Trades', icon: Briefcase, theme: 'dark' as const, accentColor: '#f97316', primaryColor: '#0c0a09' },
  { id: 'beauty', label: 'Luxury Beauty', icon: Heart, theme: 'luxury' as const, accentColor: '#d97706', primaryColor: '#1c1917' },
  { id: 'bbq', label: 'BBQ & Smokehouse', icon: UtensilsCrossed, theme: 'crimson-bold' as const, accentColor: '#dc2626', primaryColor: '#2b0c0d' },
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
  title: '', category: 'Campaign & Leadership', name: '', tagline: '', description: '',
  phone: '', email: '', address: '', hours: '', heroImage: '',
  theme: 'campaign-navy', primaryColor: '#00081e', accentColor: '#C5A059',
  treasurerName: '', heroVariant: 'split',
  pillar1title: '', pillar1desc: '', pillar2title: '', pillar2desc: '', pillar3title: '', pillar3desc: '',
  badge1: '', badge2: '', badge3: '', badge4: '', proofBadgeText: '',
  endorsement1quote: '', endorsement1author: '', endorsement1role: '',
  endorsement2quote: '', endorsement2author: '', endorsement2role: '',
  endorsement3quote: '', endorsement3author: '', endorsement3role: '',
};

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

  return { profile, services, testimonials, theme: form.theme, heroVariant: form.heroVariant, badges, proofBadgeText: form.proofBadgeText, seo: { title: `${form.name} — ${form.tagline}`, description: form.description } };
}

// ── Component ────────────────────────────────────────────────────────────────
interface BlueprintFormPanelProps {
  onBuild: (snapshot: Omit<ProjectSnapshot, 'id' | 'prompt' | 'timestamp'>) => void;
  onOpenScanner: () => void;
  onOpenHandoff: () => void;
  onOpenAudit: () => void;
  onOpenProposal: () => void;
  isBusy: boolean;
}

export default function BlueprintFormPanel({
  onBuild, onOpenScanner, onOpenHandoff, onOpenAudit, onOpenProposal, isBusy
}: BlueprintFormPanelProps) {
  const [form, setForm] = useState<InstantFormData>(DEFAULT_FORM);
  const [openSection, setOpenSection] = useState<string>('identity');

  const set = (key: keyof InstantFormData, val: string) =>
    setForm(prev => ({ ...prev, [key]: val }));

  const applyVertical = (v: typeof VERTICALS[number]) => {
    setForm(prev => ({
      ...prev,
      theme: v.theme,
      primaryColor: v.primaryColor,
      accentColor: v.accentColor,
      category: v.label === 'Campaign & Political' ? 'Campaign & Leadership' : v.label,
    }));
  };

  const handleBuild = () => {
    const snap = buildSnapshot(form);
    onBuild(snap);
  };

  const isCampaign = form.theme === 'campaign-navy' || form.theme === 'campaign-judicial';

  const Section = ({ id, label, children }: { id: string; label: string; children: React.ReactNode }) => (
    <div className="border border-stone-800 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpenSection(openSection === id ? '' : id)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-bold text-stone-200 bg-stone-900/80 hover:bg-stone-800/80 transition-colors"
      >
        {label}
        <ChevronDown className={`w-3.5 h-3.5 text-stone-500 transition-transform duration-200 ${openSection === id ? 'rotate-180 text-orange-400' : ''}`} />
      </button>
      {openSection === id && (
        <div className="p-3.5 space-y-3 bg-stone-950/60 animate-in fade-in duration-150">
          {children}
        </div>
      )}
    </div>
  );

  const Field = ({ label, id, placeholder, value, onChange, type = 'text' }: {
    label: string; id: string; placeholder?: string; value: string; onChange: (v: string) => void; type?: string;
  }) => (
    <div>
      <label htmlFor={id} className="block text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1">{label}</label>
      <input
        id={id} type={type} value={value} placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-1.5 rounded-lg bg-stone-900 border border-stone-700/80 text-xs text-stone-100 placeholder-stone-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 transition-all"
      />
    </div>
  );

  const TextArea = ({ label, id, placeholder, value, onChange }: {
    label: string; id: string; placeholder?: string; value: string; onChange: (v: string) => void;
  }) => (
    <div>
      <label htmlFor={id} className="block text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1">{label}</label>
      <textarea
        id={id} rows={2} value={value} placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-1.5 rounded-lg bg-stone-900 border border-stone-700/80 text-xs text-stone-100 placeholder-stone-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 transition-all resize-none"
      />
    </div>
  );

  return (
    <div className="flex flex-col h-full overflow-y-auto space-y-3 px-3.5 py-3">

      {/* ── Vertical Preset Tiles ────────────────────────────────────────── */}
      <div>
        <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Zap className="w-3 h-3 text-orange-500" /> Quick Vertical
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {VERTICALS.map(v => {
            const active = form.theme === v.theme;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => applyVertical(v)}
                className={`flex items-center gap-2 px-2.5 py-2 rounded-xl border text-xs font-semibold transition-all ${
                  active
                    ? 'border-orange-500 bg-orange-500/10 text-orange-300 shadow-sm shadow-orange-500/20'
                    : 'border-stone-800 bg-stone-900/60 text-stone-400 hover:border-stone-700 hover:text-stone-200'
                }`}
              >
                <v.icon className={`w-3.5 h-3.5 flex-shrink-0 ${active ? 'text-orange-400' : 'text-stone-500'}`} />
                <span className="truncate">{v.label}</span>
                {active && <Check className="w-3 h-3 ml-auto text-orange-400 flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Identity Section ─────────────────────────────────────────────── */}
      <Section id="identity" label="👤 Identity & Brand">
        <Field label="Candidate / Business Name" id="name" placeholder="Ernest Trevino for Sheriff" value={form.name} onChange={v => set('name', v)} />
        <Field label="Tagline / Slogan" id="tagline" placeholder="A Lifetime of Dedicated Service" value={form.tagline} onChange={v => set('tagline', v)} />
        <TextArea label="About (1–2 sentences)" id="description" placeholder="Tell us about the candidate or business..." value={form.description} onChange={v => set('description', v)} />
        <Field label="Phone" id="phone" placeholder="(830) 555-VOTE" value={form.phone} onChange={v => set('phone', v)} />
        <Field label="Email" id="email" placeholder="campaign@example.com" value={form.email} onChange={v => set('email', v)} />
        <Field label="Address / HQ Location" id="address" placeholder="Jourdanton, TX 78026" value={form.address} onChange={v => set('address', v)} />
        <Field label="Hours / Office Hours" id="hours" placeholder="Mon – Sat: 9AM – 6PM" value={form.hours} onChange={v => set('hours', v)} />
        <Field label="Hero Image URL (optional)" id="heroImage" placeholder="https://..." value={form.heroImage} onChange={v => set('heroImage', v)} />
      </Section>

      {/* ── Platform Pillars / Services ──────────────────────────────────── */}
      <Section id="pillars" label="🏛️ Platform Pillars / Services">
        <div className="space-y-2">
          {([
            ['pillar1title', 'pillar1desc', 'Pillar 1'],
            ['pillar2title', 'pillar2desc', 'Pillar 2'],
            ['pillar3title', 'pillar3desc', 'Pillar 3'],
          ] as const).map(([tk, dk, label]) => (
            <div key={tk} className="p-2.5 bg-stone-900/40 rounded-lg border border-stone-800 space-y-2">
              <Field label={`${label} Title`} id={tk} placeholder="e.g. Violent Crime Interdiction" value={form[tk]} onChange={v => set(tk, v)} />
              <TextArea label={`${label} Description`} id={dk} placeholder="What this pillar or service delivers..." value={form[dk]} onChange={v => set(dk, v)} />
            </div>
          ))}
        </div>
      </Section>

      {/* ── Proof Badges ─────────────────────────────────────────────────── */}
      <Section id="badges" label="🏅 Proof Badges & Credentials">
        <div className="grid grid-cols-2 gap-2">
          {(['badge1', 'badge2', 'badge3', 'badge4'] as const).map((bk, i) => (
            <div key={bk}>
              <Field label={`Badge ${i + 1}`} id={bk} placeholder={`e.g. 28+ Years Experience`} value={form[bk]} onChange={v => set(bk, v)} />
            </div>
          ))}
        </div>
        <Field label="Proof Banner Text" id="proofBadgeText" placeholder="Official 2026 Endorsements · Law Enforcement Verified" value={form.proofBadgeText} onChange={v => set('proofBadgeText', v)} />
      </Section>

      {/* ── Endorsements ─────────────────────────────────────────────────── */}
      <Section id="endorsements" label="💬 Endorsements / Testimonials">
        <div className="space-y-3">
          {([
            ['endorsement1quote', 'endorsement1author', 'endorsement1role'],
            ['endorsement2quote', 'endorsement2author', 'endorsement2role'],
            ['endorsement3quote', 'endorsement3author', 'endorsement3role'],
          ] as const).map(([qk, ak, rk], i) => (
            <div key={qk} className="p-2.5 bg-stone-900/40 rounded-lg border border-stone-800 space-y-2">
              <TextArea label={`Quote ${i + 1}`} id={qk} placeholder={`"A leader of unmatched integrity..."`} value={form[qk]} onChange={v => set(qk, v)} />
              <div className="grid grid-cols-2 gap-2">
                <Field label="Author" id={ak} placeholder="Judge Ronald Sterling" value={form[ak]} onChange={v => set(ak, v)} />
                <Field label="Role / Affiliation" id={rk} placeholder="Presiding County Magistrate" value={form[rk]} onChange={v => set(rk, v)} />
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Campaign Legal (only for campaign vertical) ───────────────────── */}
      {isCampaign && (
        <Section id="legal" label="⚖️ Campaign Legal (Required)">
          <Field label="Campaign Treasurer Name" id="treasurerName" placeholder="Joseph S. Boyle" value={form.treasurerName} onChange={v => set('treasurerName', v)} />
          <p className="text-[10px] text-stone-500 leading-relaxed">Required for campaign legal disclosure in site footer and voting guide.</p>
        </Section>
      )}

      {/* ── Theme Fine-Tuning ─────────────────────────────────────────────── */}
      <Section id="theme" label="🎨 Theme & Layout">
        <div>
          <label className="block text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5">Theme</label>
          <select
            value={form.theme}
            onChange={e => set('theme', e.target.value as InstantFormData['theme'])}
            className="w-full px-3 py-1.5 rounded-lg bg-stone-900 border border-stone-700 text-xs text-stone-100 focus:outline-none focus:border-orange-500"
          >
            <option value="campaign-navy">Campaign Navy (Sheriff/County)</option>
            <option value="campaign-judicial">Campaign Judicial (Judge)</option>
            <option value="luxury">Luxury Dark Gold (Salon/Spa)</option>
            <option value="crimson-bold">Crimson Bold (BBQ/Restaurant)</option>
            <option value="emerald-gold">Emerald Gold (Premium)</option>
            <option value="dark">Dark Stone (General Business)</option>
            <option value="light">Light Clean (Professional)</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5">Hero Layout</label>
          <div className="flex gap-2">
            {(['split', 'bento', 'centered'] as const).map(hv => (
              <button key={hv} type="button" onClick={() => set('heroVariant', hv)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all capitalize ${form.heroVariant === hv ? 'bg-orange-600 border-orange-500 text-white' : 'border-stone-700 text-stone-400 hover:border-stone-600 hover:text-stone-200'}`}
              >{hv}</button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1">Primary Color</label>
            <div className="flex items-center gap-2">
              <input type="color" value={form.primaryColor} onChange={e => set('primaryColor', e.target.value)}
                className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent" />
              <span className="text-xs text-stone-400 font-mono">{form.primaryColor}</span>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1">Accent Color</label>
            <div className="flex items-center gap-2">
              <input type="color" value={form.accentColor} onChange={e => set('accentColor', e.target.value)}
                className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent" />
              <span className="text-xs text-stone-400 font-mono">{form.accentColor}</span>
            </div>
          </div>
        </div>
      </Section>

      {/* ── Action Buttons ────────────────────────────────────────────────── */}
      <div className="space-y-2 pt-1 pb-4">
        {/* Primary Build */}
        <button
          type="button"
          onClick={handleBuild}
          disabled={isBusy || !form.name.trim()}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-40 text-white text-sm font-bold shadow-lg shadow-orange-600/30 transition-all hover:scale-[1.01] active:scale-100"
        >
          <Zap className="w-4 h-4" />
          ⚡ Build Instant Preview
        </button>

        {/* Secondary row */}
        <div className="grid grid-cols-3 gap-1.5">
          <button type="button" onClick={onOpenAudit}
            className="flex flex-col items-center gap-1 py-2 rounded-xl border border-stone-800 bg-stone-900/50 hover:bg-stone-800 text-stone-300 text-[10px] font-semibold transition-all"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Auto-QC
          </button>
          <button type="button" onClick={onOpenProposal}
            className="flex flex-col items-center gap-1 py-2 rounded-xl border border-stone-800 bg-stone-900/50 hover:bg-stone-800 text-stone-300 text-[10px] font-semibold transition-all"
          >
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            Proposal
          </button>
          <button type="button" onClick={onOpenScanner}
            className="flex flex-col items-center gap-1 py-2 rounded-xl border border-stone-800 bg-stone-900/50 hover:bg-stone-800 text-stone-300 text-[10px] font-semibold transition-all"
          >
            <Camera className="w-3.5 h-3.5 text-orange-400" />
            Scan Photo
          </button>
        </div>

        {/* AI Brainstorm toggle */}
        <button type="button" onClick={onOpenHandoff}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-stone-800 bg-stone-900/30 hover:bg-stone-800 text-stone-400 text-xs transition-all"
        >
          <Wand2 className="w-3.5 h-3.5 text-orange-400" />
          AI Brainstorm / Export Plan
        </button>
      </div>
    </div>
  );
}
