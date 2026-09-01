import React, { useState, useEffect, useRef, useMemo } from 'react';
import { apiFetch } from '../../api';
import { findBlueprintIssues, summariseIssues } from '../../utils/blueprintHealth';
import type { SiteSection } from '../../templates/sections';
import { SiteRenderer } from '../../templates/SiteRenderer';
import { PreviewFrame } from './PreviewFrame';
import { mergeClientMedia, type ClientMediaRow } from '../../../lib/clientMedia';
import {
  listBlueprints, saveBlueprint, removeBlueprint, cachedBlueprints, saveProject, recordEvent,
  loadCurrentProject, loadHistory, saveCurrentProject, saveHistory, cachedHistory,
  cachedCurrentProject,
} from '../../store';
import { 
  Bot, 
  Sparkles, 
  Play, 
  RotateCcw, 
  Monitor, 
  Tablet, 
  Smartphone, 
  Code2, 
  Eye, 
  Send, 
  CheckCircle2, 
  Layers, 
  Download, 
  UploadCloud, 
  MousePointer, 
  Wand2, 
  Sliders,
  Flame,
  Check,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Loader2,
  Maximize2,
  Minimize2,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  Plus,
  X,
  Image as ImageIcon,
  UserCheck,
  Vote,
  FileText,
  Save,
  Trash2,
  Palette,
  ShieldAlert,
  Settings2,
  LayoutDashboard,
  Camera,
  FolderCheck,
  Cpu,
  DollarSign,
  ShieldCheck,
  Terminal,
  Search,
  Bell,
  Bookmark,
  Zap,
  Globe,
  History,
  Building2,
  CalendarCheck,
  Copy,
  Info,
  Share2
} from 'lucide-react';
import { 
  NavbarBlock, 
  HeroBlock, 
  CampaignHeroBlock,
  ServicesBlock, 
  TestimonialsBlock, 
  BookingBlock, 
  FooterBlock, 
  IndustryAdminBlock,
  VotingBannerBlock,
  VotingPageBlock,
  EventsBlock,
  WriteInGuideBlock,
  BusinessProfile, 
  ServiceItem, 
  TestimonialItem,
  EventItem 
} from '../../templates/blocks';
import { buildThemeVars } from '../../templates/blocks/theme';

import { ModelSettingsModal } from './ModelSettingsModal';
import { PlanHandoffModal } from './PlanHandoffModal';
import { SiteAuditModal } from './SiteAuditModal';
import { ProjectProposalModal } from '../ProjectProposalModal';
import { 
  getStoredModel, 
  setStoredModel, 
  getSessionUsage, 
  recordUsage, 
  resetSessionUsage, 
  SUPPORTED_MODELS, 
  SessionUsageStats 
} from './aiModelConfig';
import PhotoScannerModal from '../PhotoScannerModal';
import { ClientIntake, Project } from '../../types';
import BlueprintFormPanel from './BlueprintFormPanel';
import CustomDomainModal from '../CustomDomainModal';
import DeploymentHistoryModal from '../DeploymentHistoryModal';

interface AgentState {
  step: 'idle' | 'scouting' | 'architecting' | 'building' | 'ready';
  message: string;
  tokensUsed: number;
}

export interface ProjectSnapshot {
  id: string;
  /**
   * The client_intakes row this was built from, when it came from an intake.
   *
   * Absent on projects created before 2026-08-30 and on anything started from
   * scratch, so treat it as a hint rather than a guarantee — an intake and its
   * project used to share nothing but a business name.
   */
  intakeId?: string;
  prompt: string;
  timestamp: string;
  profile: BusinessProfile;
  services: ServiceItem[];
  testimonials: TestimonialItem[];
  events?: EventItem[];
  theme: 'dark' | 'light' | 'luxury' | 'campaign-navy' | 'campaign-judicial' | 'crimson-bold' | 'emerald-gold' | 'custom';
  heroVariant: 'split' | 'bento' | 'centered';
  badges?: string[];
  proofBadgeText?: string;
  seo?: { title: string; description: string };
  uploadedImages?: string[];
  /** Paired before/after images, for transformation-led verticals. */
  beforeAfter?: import('../../templates/blocks/types').BeforeAfterItem[];
  /** Retail products, for verticals that sell take-home items. */
  products?: import('../../templates/blocks/types').ProductItem[];
  /**
   * Page composition. When absent, ClientApp falls back to an archetype chosen
   * by vertical — which is what every site deployed before this existed does,
   * so their layout is unchanged.
   */
  sections?: SiteSection[];
}

interface PresetBlueprint {
  id: string;
  title: string;
  category: string;
  prompt: string;
  profile: BusinessProfile;
  services: ServiceItem[];
  testimonials: TestimonialItem[];
  events?: EventItem[];
  theme: 'dark' | 'light' | 'luxury' | 'campaign-navy' | 'campaign-judicial' | 'crimson-bold' | 'emerald-gold' | 'custom';
  heroVariant: 'split' | 'bento' | 'centered';
  badges?: string[];
  proofBadgeText?: string;
  isCustom?: boolean;
  seo?: { title: string; description: string };
}

const DEFAULT_BLUEPRINTS: PresetBlueprint[] = [
  {
    id: 'bp-waylon-rogers',
    title: 'Waylon Rogers for County Judge',
    category: 'Campaign & Leadership',
    prompt: 'Build an authoritative, conservative judicial campaign website for Waylon Rogers for Atascosa County Judge 2026. Official Write-In Candidate, courtroom integrity, protecting rural Texas landowners, strict fiscal responsibility, and step-by-step voting machine guide.',
    badges: ['Official Write-In Candidate', 'Judicial Integrity', 'Rural Property Advocate', 'Fiscal Responsibility'],
    proofBadgeText: 'Write-In Waylon Rogers for County Judge · Atascosa County',
    events: [
      { id: '1', name: 'Atascosa County Courtroom Integrity Forum', date: 'Oct 28, 2026', time: '6:30 PM', location: 'Pleasanton Community Center', rsvpCount: 185 },
      { id: '2', name: 'Rural Landowners & Water Rights Town Hall', date: 'Nov 04, 2026', time: '7:00 PM', location: 'Jourdanton Civic Center', rsvpCount: 220 },
      { id: '3', name: 'Meet Waylon Rogers & Write-In Voting Demo', date: 'Nov 12, 2026', time: '5:30 PM', location: 'Poteet Volunteer Fire Hall', rsvpCount: 164 }
    ],
    profile: {
      name: 'Waylon Rogers for County Judge',
      tagline: 'A Lifetime of Service. A Commitment to Justice.',
      description: 'Official Write-In Candidate for Atascosa County Judge. Restoring judicial integrity, protecting rural property owners, and bringing transparent fiscal stewardship to county government.',
      phone: '(830) 555-1234',
      email: 'campaign@waylonrogers.com',
      address: 'Campaign HQ: 104 N Smith St, Jourdanton, TX 78026',
      hours: 'Volunteer Office: Mon - Sat: 9:00 AM - 6:00 PM',
      heroImage: '/images/candidates/waylon-rogers.png',
      category: 'Campaign & Leadership',
      theme: 'campaign-judicial',
      primaryColor: '#0a1f44',
      accentColor: '#C5A059',
      fontFamily: 'serif',
      treasurerName: 'Sarah Jenkins',
      faviconUrl: '/justice-scales-favicon.svg'
    },
    services: [
      { title: 'Restoring Judicial Integrity & Speedy Dockets', description: 'Eliminating case backlogs, upholding constitutional rule of law, and ensuring fair, impartial justice in Atascosa County courts.', duration: 'Judicial Pillar #1', highlight: true },
      { title: 'Protecting Rural Landowners & Property Rights', description: 'Defending agricultural tax exemptions, private groundwater rights, and ensuring county zoning respects generational family lands.', duration: 'Judicial Pillar #2' },
      { title: 'Transparent County Budgets & Fiscal Stewardship', description: 'Demanding zero wasteful taxpayer expenditures and providing line-item transparency for every county department.', duration: 'Judicial Pillar #3' }
    ],
    // Testimonials removed. Each preset shipped three five-star reviews
    // attributed to named people — "Judge Ronald Sterling", "Captain Sarah
    // Garza" — and flagged verified: true. Starting any client from a
    // template put invented endorsements on their site under real-sounding
    // names. The block renders nothing when handed nothing.
    testimonials: [],
    theme: 'campaign-judicial',
    heroVariant: 'split'
  },
  {
    id: 'bp-sheriff-trevino',
    title: 'Ernest Trevino for Sheriff',
    category: 'Campaign & Leadership',
    prompt: 'Build a conservative, high-authority political campaign website for Ernest Trevino for Atascosa County Sheriff 2026. 28+ years Texas law enforcement, Medal of Valor recipient, proactive crime interdiction, school safety, and constitutional leadership.',
    badges: ['28+ Years Texas Law Enforcement', 'Medal of Valor Recipient', 'Certified Master Peace Officer', 'Lifelong Atascosa County Resident'],
    proofBadgeText: 'Official 2026 Endorsements · Law Enforcement Verified',
    events: [
      { id: '1', name: 'Jourdanton Community Town Hall & Meet-and-Greet', date: 'Oct 24, 2026', time: '6:30 PM', location: 'Atascosa County Courthouse Annex', rsvpCount: 142 },
      { id: '2', name: 'Sheriff Campaign Rally & BBQ Fundraiser', date: 'Nov 02, 2026', time: '7:00 PM', location: 'Pleasanton Civic Center Plaza', rsvpCount: 215 },
      { id: '3', name: 'Rural Landowners & Public Safety Forum', date: 'Nov 14, 2026', time: '5:30 PM', location: 'Poteet Community Hall', rsvpCount: 98 }
    ],
    profile: {
      name: 'Ernest Trevino for Atascosa County Sheriff',
      tagline: 'A Lifetime of Dedicated Service & Law Enforcement Leadership',
      description: 'With over 28 years in Texas law enforcement, Medal of Valor recipient Ernest Trevino brings proven command leadership, proactive crime reduction, and steadfast community trust to Atascosa County.',
      phone: '(830) 555-VOTE',
      email: 'campaign@trevinoforsheriff.com',
      address: 'Campaign HQ: Jourdanton, TX 78026',
      hours: 'Campaign Office: Mon - Sat: 9:00 AM - 6:00 PM',
      heroImage: '/images/candidates/trevino.jpg',
      category: 'Campaign & Leadership',
      theme: 'campaign-navy',
      primaryColor: '#00081e',
      accentColor: '#C5A059',
      fontFamily: 'serif',
      treasurerName: 'Joseph S. Boyle'
    },
    services: [
      { title: 'Violent Crime & Narcotics Interdiction', description: 'Expanding proactive rural highway patrols and joint task forces targeting cartel narcotics trafficking and property theft networks.', duration: 'Pillar #1', highlight: true },
      { title: 'School & Campus Safety Taskforce', description: 'Placing certified School Resource Deputies in every county campus and conducting active threat readiness training.', duration: 'Pillar #2' },
      { title: 'Fiscal Transparency & Modernized Jail Ops', description: 'Eliminating administrative waste, modernizing detention facilities, and ensuring every taxpayer dollar is accounted for.', duration: 'Pillar #3' },
    ],
    // Testimonials removed. Each preset shipped three five-star reviews
    // attributed to named people — "Judge Ronald Sterling", "Captain Sarah
    // Garza" — and flagged verified: true. Starting any client from a
    // template put invented endorsements on their site under real-sounding
    // names. The block renders nothing when handed nothing.
    testimonials: [],
    theme: 'campaign-navy',
    heroVariant: 'split'
  },
  {
    id: 'bp-judge-debbie',
    title: 'Deborah Dietzmann for Judge',
    category: 'Campaign & Leadership',
    prompt: 'Create an authoritative presidential campaign website for Deborah Dietzmann for County District Judge. 28 years legal experience, courtroom integrity, constitutional defense, and deep Texas roots.',
    badges: ['28+ Years Trial Experience', 'Endorsed by Law Enforcement', 'Preserving the Constitution', 'Lifelong Texan'],
    proofBadgeText: 'Official 2026 Endorsements · Texas Bar Association Verified',
    profile: {
      name: 'Deborah Dietzmann for Judge',
      tagline: 'Equal Justice. Constitutional Integrity. Experienced Courtroom Leadership.',
      description: 'Over 28 years of trusted legal counsel, felony trial prosecution, and judicial excellence dedicated to upholding the Texas Constitution and protecting our families.',
      phone: '(512) 555-4601',
      email: 'debbie@dietzmannforjudge.com',
      address: 'Campaign HQ: 300 W 6th St, Austin, TX 78701',
      hours: 'Volunteer Office: Mon - Sat: 9:00 AM - 5:00 PM',
      heroImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=1200',
      category: 'Campaign & Leadership',
      theme: 'campaign-navy',
      primaryColor: '#00081e',
      accentColor: '#C5A059',
      fontFamily: 'serif'
    },
    services: [
      { title: 'Courtroom & Constitutional Rule of Law', description: 'Applying the law as written with zero political bias, upholding constitutional precedent, and ensuring speedy trial rights.', duration: 'Pillar #1', highlight: true },
      { title: 'Youth Intervention & Diversion Programs', description: 'Expanding non-violent first-time offender rehabilitation while maintaining strict accountability for violent repeat offenders.', duration: 'Pillar #2' },
      { title: 'Docket Efficiency & Taxpayer Savings', description: 'Eliminating case backlogs with modern digital courtroom scheduling to save county taxpayers millions annually.', duration: 'Pillar #3' },
    ],
    // Testimonials removed. Each preset shipped three five-star reviews
    // attributed to named people — "Judge Ronald Sterling", "Captain Sarah
    // Garza" — and flagged verified: true. Starting any client from a
    // template put invented endorsements on their site under real-sounding
    // names. The block renders nothing when handed nothing.
    testimonials: [],
    theme: 'campaign-navy',
    heroVariant: 'split'
  },
  {
    id: 'bp-sheriff',
    title: 'Sheriff John Stone Campaign',
    category: 'Campaign & Leadership',
    prompt: 'Build a conservative, high-authority political campaign website for Sheriff John Stone 2026. 24 years law enforcement experience, crime reduction, community policing, and backing the blue.',
    badges: ['24+ Years Law Enforcement', 'Decorated SWAT Commander', 'Protecting Texas Families', 'Constitutional Conservative'],
    proofBadgeText: 'Official 2026 Endorsements · Back The Blue Coalition',
    profile: {
      name: 'Sheriff John Stone 2026',
      tagline: 'Proven Leadership. Dedicated Service. Protecting Texas Families.',
      description: 'Over 24 years in Texas law enforcement—former SWAT commander, decorated patrol captain, and lifelong constitutional conservative dedicated to county safety and school security.',
      phone: '(512) 555-VOTE',
      email: 'campaign@stoneforsheriff.com',
      address: 'Campaign HQ: 100 Congress Ave, Suite 400, Austin, TX',
      hours: 'Volunteer Office: Mon - Sat: 9:00 AM - 6:00 PM',
      heroImage: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&q=80&w=1200',
      category: 'Campaign & Leadership',
      theme: 'campaign-navy',
      primaryColor: '#00081e',
      accentColor: '#C5A059'
    },
    services: [
      { title: 'Violent Crime Reduction', description: 'Expanding proactive street patrols and targeting narcotics trafficking networks with specialized task forces.', duration: 'Pillar #1', highlight: true },
      { title: 'School Safety Taskforce', description: 'Placing certified School Resource Deputies in every county campus and conducting active threat readiness training.', duration: 'Pillar #2' },
      { title: 'Fiscal & Jail Transparency', description: 'Eliminating administrative waste, modernizing detention facilities, and ensuring every taxpayer dollar is accounted for.', duration: 'Pillar #3' },
    ],
    // Testimonials removed. Each preset shipped three five-star reviews
    // attributed to named people — "Judge Ronald Sterling", "Captain Sarah
    // Garza" — and flagged verified: true. Starting any client from a
    // template put invented endorsements on their site under real-sounding
    // names. The block renders nothing when handed nothing.
    testimonials: [],
    theme: 'campaign-navy',
    heroVariant: 'split'
  },
  {
    id: 'bp-salon',
    title: 'Aura Luxury Salon & Spa',
    category: 'Beauty & Wellness',
    prompt: 'Create a high-end, dark-gold luxury hair salon & spa website for Aura Studios in Dallas. Offer balayage, keratin treatments, and bridal styling.',
    badges: ['Master Colorists', 'Organic Botanical Products', 'Beverly Hills Trained', 'Private Suite Booking'],
    proofBadgeText: '4.9 Stars (240+ Verified Reviews)',
    profile: {
      name: 'Aura Luxury Salon & Spa',
      tagline: "Dallas's Premier Luxury Hair & Wellness Studio",
      description: 'Award-winning stylists specializing in precision cuts, custom color artistry, and restorative scalp therapies.',
      phone: '(214) 555-0192',
      email: 'concierge@aurasalon.com',
      address: '2400 McKinney Ave, Dallas, TX 75201',
      hours: 'Tue - Sat: 9:00 AM - 7:00 PM | Sun - Mon: Closed',
      heroImage: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=1200',
      category: 'Beauty & Wellness',
      theme: 'luxury',
      primaryColor: '#1c1917',
      accentColor: '#d97706'
    },
    services: [
      { title: 'Couture Balayage & Gloss', description: 'Hand-painted dimensional highlighting with custom bonding treatment.', price: 'From $285', duration: '3.5 hrs', highlight: true },
      { title: 'Precision Silk Press', description: 'Organic botanical wash, deep hydration mask, and thermal finish.', price: 'From $110', duration: '1.5 hrs' },
      { title: 'Bridal & Editorial Styling', description: 'Full trial session, bespoke veil placement, and all-day styling package.', price: 'From $450', duration: '4 hrs' },
    ],
    // Testimonials removed. Each preset shipped three five-star reviews
    // attributed to named people — "Judge Ronald Sterling", "Captain Sarah
    // Garza" — and flagged verified: true. Starting any client from a
    // template put invented endorsements on their site under real-sounding
    // names. The block renders nothing when handed nothing.
    testimonials: [],
    theme: 'luxury',
    heroVariant: 'split'
  },
  {
    id: 'bp-smokehouse',
    title: 'The Rustic Oak Smokehouse & Bar',
    category: 'Food & Beverage',
    prompt: 'Create a warm, authentic Texas BBQ Smokehouse & Craft Bar website in Fort Worth with slow-smoked brisket, bourbon cocktails, live music calendar, and catering orders.',
    badges: ['16-Hour Post Oak Smoked', 'Central Texas Heritage', 'Family Owned & Operated', 'Full Smoker Rig Catering'],
    proofBadgeText: 'Top 50 Texas BBQ Pick · Reader Favorite',
    profile: {
      name: 'The Rustic Oak Smokehouse & Bar',
      tagline: 'Authentic Hill Country BBQ & Small-Batch Bourbons',
      description: 'Prime Texas briskets smoked low and slow over native post oak for 16 hours. Family recipes, house pickles, and ice-cold Texas brews.',
      phone: '(817) 555-BEEF',
      email: 'catering@therusticoakbbq.com',
      address: '412 Main St, Fort Worth, TX 76102',
      hours: 'Wed - Sun: 11:00 AM - 10:00 PM (Or until sold out)',
      heroImage: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=1200',
      category: 'Food & Beverage',
      theme: 'crimson-bold',
      primaryColor: '#2b0c0d',
      accentColor: '#dc2626'
    },
    services: [
      { title: '16-Hour Smoked Prime Brisket', description: 'Signature black pepper bark, rendered fat cap, sliced to order by the half pound.', price: '$18 / half lb', duration: 'Signature Plate', highlight: true },
      { title: 'Jalapeño Cheddar Sausage Links', description: 'Hand-stuffed house links bursting with sharp cheddar and fresh jalapeños.', price: '$9 / link', duration: 'House Special' },
      { title: 'Full County Event Catering', description: 'Mobile smoker rig delivered with hot sides, cobblers, and pitmasters on-site.', price: 'From $24 / person', duration: 'Min 25 guests' },
    ],
    // Testimonials removed. Each preset shipped three five-star reviews
    // attributed to named people — "Judge Ronald Sterling", "Captain Sarah
    // Garza" — and flagged verified: true. Starting any client from a
    // template put invented endorsements on their site under real-sounding
    // names. The block renders nothing when handed nothing.
    testimonials: [],
    theme: 'crimson-bold',
    heroVariant: 'split'
  }
];

export interface AgentBuilderStudioProps {
  initialSnapshot?: ProjectSnapshot | null;
  onOpenAppNav?: () => void;
}

export const Squiggle = ({ className = "w-8 h-1.5 text-[#C5A059]" }: { className?: string }) => (
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

export default function AgentBuilderStudio({ initialSnapshot, onOpenAppNav }: AgentBuilderStudioProps = {}) {
  const [prompt, setPrompt] = useState('');
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [activeTab, setActiveTab] = useState<'preview' | 'admin' | 'code' | 'blueprint'>('preview');
  const [inspectorActive, setInspectorActive] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [previewSubPage, setPreviewSubPage] = useState<'main' | 'voting'>('main');

  useEffect(() => {
    const handleHash = () => {
      if (window.location.hash === '#voting') {
        setPreviewSubPage('voting');
      } else if (window.location.hash === '#admin') {
        setActiveTab('admin');
      } else if (!window.location.hash || window.location.hash === '#') {
        setPreviewSubPage('main');
      }
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);
  const [isMobileDirectorOpen, setIsMobileDirectorOpen] = useState(false);
  const [isMobileQuickMenuOpen, setIsMobileQuickMenuOpen] = useState(false);
  const [outlawMode, setOutlawMode] = useState(true);

  // Blueprint Dropdown State
  const [isBlueprintDropdownOpen, setIsBlueprintDropdownOpen] = useState(false);
  const [dropdownSearch, setDropdownSearch] = useState('');
  const [previewMode, setPreviewMode] = useState<'site' | 'admin' | 'code'>('site');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);

  // Preset Favicons for Studio Selection
  const PRESET_FAVICONS = [
    { id: 'shield', label: 'Gold Shield (Site Icon)', icon: '🛡️', url: '/sheriff-badge-favicon.svg', category: 'Campaign & Sheriff' },
    { id: 'justice', label: 'Scales of Justice', icon: '⚖️', url: '/justice-scales-favicon.svg', category: 'Judicial & Legal' },
    { id: 'smokehouse', label: 'Smokehouse Flame', icon: '🥩', url: '/smokehouse-flame-favicon.svg', category: 'BBQ & Dining' },
    { id: 'classic', label: 'Texas Sons Gold', icon: '🏢', url: '/favicon.png', category: 'Classic Business' },
  ];

  const [isFaviconMenuOpen, setIsFaviconMenuOpen] = useState(false);

  // Custom Intake Modal State
  const [intakeModalOpen, setIntakeModalOpen] = useState(false);
  // Cache first so the Studio paints instantly; Supabase reconciles below.
  const [customBlueprints, setCustomBlueprints] = useState<PresetBlueprint[]>(
    () => cachedBlueprints() as PresetBlueprint[]
  );

  useEffect(() => {
    (async () => {
      const stored = await listBlueprints();
      if (stored.length) setCustomBlueprints(stored as PresetBlueprint[]);
    })();
  }, []);

  // Custom Intake Form Fields
  const [intakeForm, setIntakeForm] = useState({
    title: '',
    category: 'Campaign & Leadership' as PresetBlueprint['category'],
    name: '',
    tagline: '',
    description: '',
    phone: '',
    email: '',
    address: '',
    heroImage: '',
    faviconUrl: '/sheriff-badge-favicon.svg',
    theme: 'campaign-navy' as PresetBlueprint['theme'],
    primaryColor: '#00081e',
    accentColor: '#C5A059',
    heroVariant: 'split' as 'split' | 'bento' | 'centered',
    servicesText: 'Courtroom & Constitutional Integrity | Upholding the rule of law without political bias\nYouth Intervention & Diversion | Early rehabilitation for first-time offenders\nDocket Efficiency & Taxpayer Savings | Modernizing scheduling to eliminate backlog',
    testimonialsText: '"Deborah has the highest ethical standard in our district." — Justice Franklin Vance (Court of Appeals)\n"Fair, decisive, and dedicated to Texas safety." — Patricia Holbrook (Bar Association)'
  });

  // Active Project Data
  const [project, setProject] = useState<ProjectSnapshot>(() => {
    try {
      const parsed = cachedCurrentProject();
      if (parsed) {
        if (parsed.profile?.name?.toLowerCase().includes('waylon')) {
          if (!parsed.profile.heroImage || parsed.profile.heroImage.includes('unsplash.com/photo-1589829545856')) {
            parsed.profile.heroImage = '/images/candidates/waylon-rogers.png';
          }
          if (parsed.services?.some((s: any) => s.title?.toLowerCase().startsWith('step ') || s.title?.toLowerCase().includes('write-in'))) {
            parsed.services = DEFAULT_BLUEPRINTS[0].services;
          }
        }
        return parsed;
      }
    } catch {}
    return {
      id: 'prj-initial',
      prompt: 'Initial Template',
      timestamp: new Date().toLocaleTimeString(),
      profile: DEFAULT_BLUEPRINTS[0].profile,
      services: DEFAULT_BLUEPRINTS[0].services,
      testimonials: DEFAULT_BLUEPRINTS[0].testimonials,
      theme: DEFAULT_BLUEPRINTS[0].theme,
      heroVariant: DEFAULT_BLUEPRINTS[0].heroVariant,
      badges: DEFAULT_BLUEPRINTS[0].badges,
      proofBadgeText: DEFAULT_BLUEPRINTS[0].proofBadgeText
    };
  });

    // Multi-Model & Cost Tracking State
  const [selectedModel, setSelectedModel] = useState<string>(getStoredModel);
  const [usageStats, setUsageStats] = useState<SessionUsageStats>(getSessionUsage);
  const [isModelSettingsOpen, setIsModelSettingsOpen] = useState(false);
  const [isHandoffOpen, setIsHandoffOpen] = useState(false);
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [isCustomDomainOpen, setIsCustomDomainOpen] = useState(false);
  const [isDeploymentHistoryOpen, setIsDeploymentHistoryOpen] = useState(false);
  const [activeDeployedUrl, setActiveDeployedUrl] = useState<string>(() => {
    const slug = project.profile?.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || '';
    return slug ? `https://${slug}.pages.dev` : '';
  });

  const handleSelectModel = (modelId: string) => {
    setSelectedModel(modelId);
    setStoredModel(modelId);
  };

  const handleResetUsage = () => {
    const fresh = resetSessionUsage();
    setUsageStats(fresh);
  };

  const [history, setHistory] = useState<ProjectSnapshot[]>(() => {
    const cached = cachedHistory();
    return cached.length ? (cached as ProjectSnapshot[]) : [project];
  });

  // Reconcile both from Supabase once on mount, so the Studio picks up work
  // started on another device.
  useEffect(() => {
    (async () => {
      if (initialSnapshot) return;
      const [storedProject, storedHistory] = await Promise.all([
        loadCurrentProject(),
        loadHistory(),
      ]);
      if (storedProject) setProject(storedProject as ProjectSnapshot);
      if (storedHistory.length) setHistory(storedHistory as ProjectSnapshot[]);
    })();
  }, [initialSnapshot]);

  // These write to cache synchronously and debounce the database write, so
  // dragging a color picker doesn't fire a round-trip per frame.
  useEffect(() => {
    saveCurrentProject(project);
  }, [project]);

  useEffect(() => {
    saveHistory(history);
  }, [history]);
  const [agentState, setAgentState] = useState<AgentState>({
    step: 'ready',
    message: 'Swarm Ready: Debbie Dietzmann Presidential Theme Loaded',
    tokensUsed: 380
  });

  const chatEndRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const allBlueprints = [...DEFAULT_BLUEPRINTS, ...customBlueprints];

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsBlueprintDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync initialSnapshot when launched from Client Intake Vault
  useEffect(() => {
    if (initialSnapshot) {
      setProject(initialSnapshot);
      setHistory(prev => [initialSnapshot, ...prev]);
      setActiveTab('preview');
      setAgentState({
        step: 'ready',
        message: `Intake Loaded: ${initialSnapshot.profile.name} (${initialSnapshot.theme})`,
        tokensUsed: 340
      });
    }
  }, [initialSnapshot]);

  // Auto-upgrade and heal legacy candidate image paths
  useEffect(() => {
    if (project.profile?.name?.toLowerCase().includes('waylon')) {
      if (!project.profile.heroImage || project.profile.heroImage.includes('unsplash.com/photo-1589829545856') || project.profile.heroImage.includes('example.com')) {
        setProject(prev => ({
          ...prev,
          profile: {
            ...prev.profile,
            heroImage: '/images/candidates/waylon-rogers.png'
          }
        }));
      }
    }
  }, [project.profile?.name, project.profile?.heroImage]);

  const handleApplyPreset = (preset: PresetBlueprint) => {
    const newSnapshot: ProjectSnapshot = {
      id: `prj-${Date.now()}`,
      prompt: preset.prompt,
      timestamp: new Date().toLocaleTimeString(),
      profile: preset.profile,
      services: preset.services,
      testimonials: preset.testimonials,
      theme: preset.theme,
      heroVariant: preset.heroVariant,
      badges: preset.badges,
      proofBadgeText: preset.proofBadgeText
    };
    setProject(newSnapshot);
    setHistory(prev => [...prev, newSnapshot]);
    setAgentState({
      step: 'ready',
      message: `Loaded ${preset.title} blueprint with custom theme harmony.`,
      tokensUsed: 350
    });
    setIsBlueprintDropdownOpen(false);
  };

  const handleApplyFromScanner = (dossier: Partial<ClientIntake>, primaryImageUrl?: string, allImages?: string[]) => {
    const newSnapshot: ProjectSnapshot = {
      id: `prj-${Date.now()}`,
      prompt: `Scanned from photo: ${dossier.businessName || 'Business Asset'}`,
      timestamp: new Date().toLocaleTimeString(),
      profile: {
        ...project.profile,
        name: dossier.businessName || project.profile.name,
        tagline: dossier.tagline || project.profile.tagline,
        description: dossier.description || project.profile.description,
        phone: dossier.phone || project.profile.phone,
        email: dossier.email || project.profile.email,
        address: dossier.address || project.profile.address,
        hours: dossier.hours || project.profile.hours,
        heroImage: primaryImageUrl || dossier.heroImage || project.profile.heroImage,
        category: dossier.category || project.profile.category,
        theme: (dossier.theme as any) || project.theme,
        primaryColor: dossier.primaryColor || project.profile.primaryColor,
        accentColor: dossier.accentColor || project.profile.accentColor
      },
      services: (dossier.services && dossier.services.length > 0) ? dossier.services : project.services,
      testimonials: (dossier.testimonials && dossier.testimonials.length > 0) ? dossier.testimonials : project.testimonials,
      theme: (dossier.theme as any) || project.theme,
      heroVariant: 'split',
      badges: dossier.badges && dossier.badges.length > 0 ? dossier.badges : project.badges,
      proofBadgeText: dossier.proofBadgeText || project.proofBadgeText,
      seo: {
        title: `${dossier.businessName || project.profile.name} — ${dossier.tagline || project.profile.tagline || 'Local Business'}`,
        description: dossier.description || project.profile.description || '',
      },
      uploadedImages: allImages || project.uploadedImages || []
    };

    setProject(newSnapshot);
    setHistory(prev => [newSnapshot, ...prev]);
    setIsScannerOpen(false);
    setActiveTab('preview');
    setAgentState({
      step: 'ready',
      message: `Photo Scanned: Loaded ${newSnapshot.profile.name} with ${newSnapshot.services.length} items`,
      tokensUsed: 360
    });
  };

  const handleSaveCustomBlueprint = (e: React.FormEvent) => {
    e.preventDefault();

    const parsedServices: ServiceItem[] = intakeForm.servicesText.split('\n').filter(Boolean).map((line, idx) => {
      const parts = line.split('|').map(s => s.trim());
      return {
        title: parts[0] || `Initiative #${idx + 1}`,
        description: parts[1] || 'Dedicated initiative for our community.',
        duration: `Pillar #${idx + 1}`,
        highlight: idx === 0
      };
    });

    const parsedTestimonials: TestimonialItem[] = intakeForm.testimonialsText.split('\n').filter(Boolean).map((line, idx) => {
      const match = line.match(/^"?(.*?)"?\s*—\s*(.*?)(?:\s*\((.*?)\))?$/);
      // verified is false and the author is not invented.
      //
      // These quotes are typed by the operator, which makes the words real. The
      // rest was not: every one was stamped verified: true by a system that
      // verifies nothing, and an unattributed line became "Supporter #2,
      // Verified Endorsement" — a person and a credential conjured to fill a
      // field. An anonymous quote is fine; a fabricated endorser is not.
      if (match) {
        return {
          quote: match[1],
          author: match[2] || '',
          role: match[3] || '',
          rating: 5,
          verified: false
        };
      }
      return {
        quote: line.replace(/^"|"$/g, ''),
        author: '',
        role: '',
        rating: 5,
        verified: false
      };
    });

    const newBlueprint: PresetBlueprint = {
      id: `custom-bp-${Date.now()}`,
      title: intakeForm.title || intakeForm.name || 'Custom Blueprint',
      category: intakeForm.category,
      prompt: `Custom blueprint for ${intakeForm.name}`,
      profile: {
        name: intakeForm.name || 'Campaign Name',
        tagline: intakeForm.tagline || 'Dedicated Leadership for Texas',
        description: intakeForm.description || 'Experienced leadership and proven community results.',
        phone: intakeForm.phone || '(555) 000-0000',
        email: intakeForm.email || 'contact@example.com',
        address: intakeForm.address || 'Texas, USA',
        heroImage: intakeForm.heroImage || 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&q=80&w=1200',
        category: intakeForm.category,
        theme: intakeForm.theme,
        primaryColor: intakeForm.primaryColor,
        accentColor: intakeForm.accentColor
      },
      services: parsedServices.length ? parsedServices : DEFAULT_BLUEPRINTS[0].services,
      testimonials: parsedTestimonials.length ? parsedTestimonials : DEFAULT_BLUEPRINTS[0].testimonials,
      theme: intakeForm.theme,
      heroVariant: intakeForm.heroVariant,
      isCustom: true
    };

    setCustomBlueprints([newBlueprint, ...customBlueprints]);
    saveBlueprint(newBlueprint).catch(err => {
      console.error('Failed to save blueprint:', err);
      alert(err instanceof Error ? err.message : 'Blueprint saved locally but not synced.');
    });

    handleApplyPreset(newBlueprint);
    setIntakeModalOpen(false);
  };

  /**
   * Writes the current Studio project into the Projects table. Shared by the
   * "save" and "deploy" paths, which previously carried two near-identical
   * copies of this id-normalisation and tier logic.
   */
  /**
   * The projects-table id for this snapshot.
   *
   * The snapshot carries 'prj-<n>' while the row is keyed on '<n>'. Deploy and
   * save both need the row id and must agree on it: they disagreed until
   * 2026-08-31, so the deploy could not record what it had published and a
   * client's photo upload later republished a stale blueprint over her site.
   */
  /**
   * The client's own uploads, merged into the preview and nowhere else.
   *
   * /api/deploy folds client_media into the blueprint on the way out, and the
   * Studio did not, so every photo, transformation and product a client added
   * through her portal was live on her site and invisible here. The preview
   * showed strictly less than the thing it was previewing, which is the exact
   * failure SiteRenderer was built to end — one renderer, two datasets.
   *
   * Held separately and merged for display only. It must never reach `project`:
   * the Studio saves that object wholesale, so folding her media in would write
   * her photos onto the operator's blueprint, and the next Studio save would own
   * content she is supposed to control. Keeping the two apart is the entire
   * reason client_media is its own table.
   */
  const [clientMedia, setClientMedia] = useState<ClientMediaRow[]>([]);

  useEffect(() => {
    const rowId = project.id.startsWith('prj-') ? project.id.slice(4) : project.id;
    if (!rowId || rowId.startsWith('bp-')) { setClientMedia([]); return; }
    let live = true;
    apiFetch(`/api/client/${encodeURIComponent(rowId)}/media`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (live && d?.success) setClientMedia(d.media || []); })
      // A preview without her media is worse than this one, but neither is
      // worth an error banner over the editor.
      .catch(() => {});
    return () => { live = false; };
  }, [project.id]);

  const previewProject = useMemo(
    () => mergeClientMedia(project, clientMedia).blueprint,
    [project, clientMedia]
  );

  const projectRowId = () => {
    const id = project.id;
    if (id.startsWith('prj-')) return id.slice(4);
    if (id.startsWith('bp-')) return `prj_${Date.now()}`;
    return id;
  };

  const persistProject = async (status: Project['status'], domain: string) => {
    const projectId = projectRowId();

    await saveProject({
      id: projectId,
      clientName: project.profile.name,
      companyName: project.profile.name,
      tier: project.profile.category === 'Campaign & Leadership' ? 'Campaign Platform Tier' : 'Spur Digital Tier',
      status,
      updatedAt: new Date().toISOString(),
      domain,
      ownerId: '',
      blueprint: project,
    });
  };

  const handleDeleteCustomBlueprint = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const previous = customBlueprints;
    setCustomBlueprints(previous.filter(b => b.id !== id));
    removeBlueprint(id).catch(err => {
      console.error('Failed to delete blueprint:', err);
      setCustomBlueprints(previous);
      alert(err instanceof Error ? err.message : 'Could not delete the blueprint.');
    });
  };

  const handleGenerate = async (customTextPrompt?: string) => {
    const textToRun = customTextPrompt || prompt;
    if (!textToRun.trim()) return;

    if (!customTextPrompt) setPrompt('');

    // Step 1: Scout
    setAgentState({
      step: 'scouting',
      message: 'Agent 1 (Scout): Extracting parameters & assets...',
      tokensUsed: 120
    });

    await new Promise(r => setTimeout(r, 500));

    // Step 2: Architect
    setAgentState({
      step: 'architecting',
      message: 'Agent 2 (Architect): Synthesizing component layout...',
      tokensUsed: 280
    });

    await new Promise(r => setTimeout(r, 600));

    // Step 3: Builder
    setAgentState({
      step: 'building',
      message: 'Agent 3 (Builder): Assembling React modules with zero errors...',
      tokensUsed: 520
    });

    try {
      const res = await apiFetch('/api/studio-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToRun,
          currentSnapshot: project
        })
      });

      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to update blueprint');
      }

      const updatedSnapshot: ProjectSnapshot = {
        ...data.snapshot,
        id: `prj-${Date.now()}`,
        prompt: textToRun,
        timestamp: new Date().toLocaleTimeString(),
      };

      setProject(updatedSnapshot);
      setHistory(prev => [...prev, updatedSnapshot]);
      setAgentState({
        step: 'ready',
        message: 'Build successful! Components updated with zero errors.',
        tokensUsed: 640
      });
    } catch (err: any) {
      setAgentState({
        step: 'ready',
        message: `Agent update error: ${err.message || 'Failed to modify blueprint'}`,
        tokensUsed: agentState.tokensUsed
      });
    }
  };

  const handleRollback = (snapshot: ProjectSnapshot) => {
    setProject(snapshot);
    setAgentState({
      step: 'ready',
      message: `Rolled back to checkpoint (${snapshot.timestamp}).`,
      tokensUsed: snapshot.prompt.length * 2
    });
  };

  const handleSaveToProjects = async () => {
    try {
      setAgentState({
        step: 'building',
        message: 'Saving site to Supabase active projects...',
        tokensUsed: agentState.tokensUsed
      });

      const slug = project.profile.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      await persistProject('Theme Assembly', `https://${slug}.pages.dev`);

      setAgentState({
        step: 'ready',
        message: `Saved! "${project.profile.name}" is now tracked in your Projects tab.`,
        tokensUsed: agentState.tokensUsed
      });
    } catch (err: any) {
      console.error("Save Project error:", err);
      setAgentState({
        step: 'ready',
        message: `Saved locally! (${err.message || 'Supabase sync'})`,
        tokensUsed: agentState.tokensUsed
      });
    }
  };


  const [isHealthDropdownOpen, setIsHealthDropdownOpen] = useState(false);
  const healthIssues = findBlueprintIssues(project);
  const healthSummary = summariseIssues(healthIssues);

  const handleDeploySite = async () => {
    if (healthIssues.length > 0) {
      const msg = "This site has placeholders that a client should not see:\n\n" + 
        healthIssues.map(i => "- " + i.message).join('\n') + 
        "\n\nDeploy anyway?";
      if (!window.confirm(msg)) return;
    }

    setAgentState({
      step: 'building',
      message: 'Compiling React blocks and pushing to Cloudflare Pages...',
      tokensUsed: agentState.tokensUsed
    });

    try {
      const res = await apiFetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName: project.profile.name,
          currentSnapshot: project,
          // Lets the server merge this client's uploaded media into the deploy,
          // and record what went live so her next upload republishes THIS.
          projectId: projectRowId()
        })
      });
      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Deployment failed');
      }

      recordEvent({
        kind: 'demo_deployed',
        projectId: project.id,
        vertical: project.profile.category,
        data: { url: data.url, businessName: project.profile.name },
      });

      // Auto-save the now-live project
      try {
        await persistProject('Live', data.url);
      } catch (dbErr) {
        console.warn('Auto-save to projects failed:', dbErr);
      }

      if (data.url) {
        setActiveDeployedUrl(data.url);
      }

      setAgentState({
        step: 'ready',
        message: `Deployed successfully! Live at: ${data.url}`,
        tokensUsed: agentState.tokensUsed
      });
      
      // Optionally open in new tab
      window.open(data.url, '_blank');
    } catch (e: any) {
      setAgentState({
        step: 'ready',
        message: `Deployment error: ${e.message}. Did you set Cloudflare credentials?`,
        tokensUsed: agentState.tokensUsed
      });
    }
  };

  // Centralized campaign detection — uses category field for reliability with custom blueprints
  const isCampaignSite = project.profile.category === 'Campaign & Leadership' || project.theme === 'campaign-navy' || project.theme === 'campaign-judicial';
  const isWriteIn = isCampaignSite && (
    (project.proofBadgeText && project.proofBadgeText.toLowerCase().includes('write-in')) ||
    project.badges?.some(b => b.toLowerCase().includes('write-in')) ||
    project.profile.name.toLowerCase().includes('waylon')
  );

  const getThemeBackgroundClass = () => {
    switch (project.theme) {
      case 'campaign-judicial':
        return 'bg-white text-stone-900';
      case 'campaign-navy':
        return 'bg-[#00081e] text-white';
      case 'crimson-bold':
        return 'bg-[#180507] text-white';
      case 'emerald-gold':
        return 'bg-[#041a14] text-white';
      case 'luxury':
        return 'bg-[#1c1917] text-white';
      case 'light':
        return 'bg-stone-50 text-stone-900';
      default:
        return 'bg-stone-950 text-white';
    }
  };

  const currentBlueprintObj = allBlueprints.find(b => b.profile.name === project.profile.name) || allBlueprints[0];

  return (
    <div className={`w-full flex flex-col bg-stone-950 text-stone-100 ${
      isFullscreen ? 'fixed inset-0 z-50 h-screen w-screen' : 'h-full flex-1 overflow-hidden'
    }`}>
      {/* ── MOBILE: Stitch-Style Gold Header ────────────────────────── */}
      <header className="md:hidden h-14 border-b border-stone-800/80 px-4 flex items-center justify-between bg-stone-950 flex-shrink-0 z-30">
        {/* Hamburger */}
        {onOpenAppNav && (
          <button
            onClick={onOpenAppNav}
            className="p-2 rounded-[14px_6px_16px_8px/8px_16px_6px_14px] bg-stone-900 border border-stone-800 text-stone-400 hover:text-white cursor-pointer active:scale-95 transition-all"
          >
            <Menu className="w-4 h-4 text-[#C5A059]" />
          </button>
        )}

        {/* Center: TEXAS SONS + Project Switcher */}
        <button
          onClick={() => setIsBlueprintDropdownOpen(!isBlueprintDropdownOpen)}
          className="flex items-center gap-2 cursor-pointer group"
          title="Switch client"
        >
          <span className="text-sm font-black text-[#C5A059] uppercase tracking-widest font-mono">TEXAS SONS</span>
          <div className="flex items-center gap-1 bg-stone-900 border border-stone-800 rounded-lg px-2 py-0.5">
            <span className="text-[10px] font-mono text-stone-400">Project:</span>
            <span className="text-[10px] font-bold text-stone-200 truncate max-w-[60px]">
              {(currentBlueprintObj?.title || project.profile.name).split(' ')[0]}
            </span>
            <ChevronDown className={`w-3 h-3 text-stone-500 transition-transform ${isBlueprintDropdownOpen ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {/* Right: Status dot */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-stone-900 border border-stone-800">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[9px] font-mono text-stone-400">LIVE</span>
        </div>

        {/* Blueprint dropdown (mobile) */}
        {isBlueprintDropdownOpen && (
          <div className="absolute top-14 left-0 right-0 z-50 mx-3 bg-stone-900 border border-stone-700 rounded-2xl shadow-2xl p-2 space-y-1 max-h-72 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150" ref={dropdownRef}>
            <div className="text-[10px] font-bold text-stone-500 uppercase tracking-wider px-2 py-1">Select Client Experience</div>
            {allBlueprints.map((preset) => {
              const isSelected = project.profile.name === preset.profile.name;
              return (
                <div
                  key={preset.id}
                  onClick={() => { handleApplyPreset(preset); setIsBlueprintDropdownOpen(false); }}
                  className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    isSelected ? 'border-[#C5A059]/60 bg-[#C5A059]/10 text-white' : 'border-transparent hover:bg-stone-800 text-stone-300'
                  }`}
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="text-xs font-bold truncate">{preset.title}</p>
                    <p className="text-[10px] text-stone-500 mt-0.5">{preset.category}</p>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-[#C5A059]" />}
                </div>
              );
            })}
            <div className="pt-2 border-t border-stone-800">
              <button onClick={() => { setIsBlueprintDropdownOpen(false); setIntakeModalOpen(true); }}
                className="w-full py-2 px-3 rounded-[14px_6px_16px_8px/8px_16px_6px_14px] bg-[#C5A059]/10 hover:bg-[#C5A059]/20 text-[#C5A059] border border-[#C5A059]/30 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer">
                <Plus className="w-3.5 h-3.5" />New Client Experience
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ── DESKTOP: Full Master Action Bar ─────────────────────────── */}
      {/* Everything in this row is flex-shrink-0 and it does not wrap, so the
          budget is fixed and each label has to earn its width. Below roughly
          1500px the right-hand end — Deploy among it — used to leave the screen
          entirely, with no scrollbar and nothing to drag.

          Labels now drop to icons as space runs out, worst-earning first, and
          every button keeps its title attribute so the icon is still
          identifiable. Deploy never loses its label: it is the primary action
          and the one that went missing. */}
      <header className="hidden md:flex h-16 border-b border-stone-800/80 px-3 sm:px-4 items-center justify-between bg-stone-950 text-stone-100 backdrop-blur-md flex-shrink-0 z-30 gap-2 sm:gap-3">
        
        {/* Left Section: Mobile App Navigation Hamburger, Director / Sidebar Toggle, Active Experience Pill */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {/* Mobile App Navigation Hamburger Button */}
          {onOpenAppNav && (
            <button
              onClick={onOpenAppNav}
              className="md:hidden p-2 rounded-[14px_6px_16px_8px/8px_16px_6px_14px] bg-stone-900 border border-stone-800 text-stone-300 hover:text-white hover:border-[#C5A059]/40 cursor-pointer active:scale-95 transition-all shadow-sm"
              title="Open Texas Sons App Menu"
            >
              <Menu className="w-4 h-4 text-[#C5A059]" />
            </button>
          )}

          <button
            onClick={() => {
              if (window.innerWidth < 768) {
                setIsMobileDirectorOpen(true);
              } else {
                setIsChatCollapsed(!isChatCollapsed);
              }
            }}
            className="p-2 rounded-[14px_6px_16px_8px/8px_16px_6px_14px] text-stone-400 hover:text-white bg-stone-900/60 md:bg-transparent hover:bg-stone-900 border border-stone-800/80 md:border-transparent hover:border-stone-800 transition-all flex-shrink-0 cursor-pointer active:scale-95"
            title={isChatCollapsed ? "Expand Configurator" : "Collapse Configurator"}
          >
            {isChatCollapsed ? <PanelLeftOpen className="w-4 h-4 text-[#C5A059]" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>

          {/* Active Client Experience Switcher Pill */}
          <div className="relative flex-shrink-0" ref={dropdownRef}>
            <button
              onClick={() => setIsBlueprintDropdownOpen(!isBlueprintDropdownOpen)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-[14px_6px_16px_8px/8px_16px_6px_14px] bg-stone-900/90 hover:bg-stone-900 border border-stone-800 hover:border-stone-700 transition-all shadow-sm group text-left cursor-pointer max-w-[150px] sm:max-w-[200px]"
              title="Click to Switch Client Brand Experience"
            >
              <div className="w-6 h-6 rounded-lg bg-[#C5A059]/20 border border-[#C5A059]/30 flex items-center justify-center text-[#C5A059] font-bold flex-shrink-0">
                <Zap className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                {/* One line. The old second line read "Client Experience" for
                    anything without a category, which is true of every row in
                    the app and therefore told you nothing, while costing the
                    chip vertical space and the toolbar horizontal space. */}
                <p className="text-xs font-bold text-white truncate group-hover:text-[#C5A059]">
                  {currentBlueprintObj?.title || project.profile.name}
                </p>
                {currentBlueprintObj?.category && (
                  <p className="text-[10px] text-stone-400 truncate">
                    {currentBlueprintObj.category}
                  </p>
                )}
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-stone-500 transition-transform duration-200 flex-shrink-0 ${
                isBlueprintDropdownOpen ? 'rotate-180 text-[#C5A059]' : ''
              }`} />
            </button>

            {/* Dropdown Menu Popover */}
            {isBlueprintDropdownOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-80 bg-stone-900 border border-stone-700 rounded-2xl shadow-2xl z-50 p-2 space-y-1 max-h-80 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                <div className="text-[10px] font-bold text-stone-500 uppercase tracking-wider px-2 py-1 flex items-center justify-between">
                  <span>Select Client Experience</span>
                  <span className="text-[#C5A059] font-mono text-[9px]">1-Click Ready</span>
                </div>
                {allBlueprints.map((preset) => {
                  const isSelected = project.profile.name === preset.profile.name;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => {
                        handleApplyPreset(preset);
                        setIsBlueprintDropdownOpen(false);
                      }}
                      className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                        isSelected
                          ? 'border-[#C5A059]/80 bg-[#C5A059]/10 text-white'
                          : 'border-transparent hover:bg-stone-800 text-stone-300'
                      }`}
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="text-xs font-bold truncate">{preset.title}</p>
                        <div className="flex items-center space-x-1.5 text-[10px] text-stone-400 mt-0.5">
                          <span>{preset.category}</span>
                          <span>•</span>
                          <span className="uppercase text-[9px] font-semibold text-[#C5A059]/90">{preset.theme}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1">
                        {isSelected && <Check className="w-4 h-4 text-[#C5A059]" />}
                        {preset.isCustom && (
                          <button
                            onClick={(e) => handleDeleteCustomBlueprint(preset.id, e)}
                            className="p-1 text-stone-500 hover:text-red-400 rounded-[14px_6px_16px_8px/8px_16px_6px_14px] ml-1"
                            title="Delete custom experience"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                <div className="pt-2 border-t border-stone-800 mt-1">
                  <button
                    onClick={() => {
                      setIsBlueprintDropdownOpen(false);
                      setIntakeModalOpen(true);
                    }}
                    className="w-full py-2 px-3 rounded-[14px_6px_16px_8px/8px_16px_6px_14px] bg-[#C5A059]/20 hover:bg-[#C5A059]/30 text-[#C5A059] border border-[#C5A059]/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create New Client Experience</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Studio Tools (Desktop 2XL) */}
          <div className="hidden 2xl:flex items-center gap-1 bg-stone-900/80 rounded-xl p-1 border border-stone-800 flex-shrink-0">
            <button
              onClick={handleSaveToProjects}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[14px_6px_16px_8px/8px_16px_6px_14px] text-xs font-semibold text-stone-300 hover:text-white hover:bg-stone-800 transition-all cursor-pointer"
              title="Save Project to Database"
            >
              <FolderCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Save</span>
            </button>
            <button
              onClick={() => setIsHandoffOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[14px_6px_16px_8px/8px_16px_6px_14px] text-xs font-semibold text-[#C5A059] hover:text-[#C5A059] hover:bg-[#C5A059]/10 transition-all cursor-pointer"
              title="Get Antigravity AI Master Plan Prompt"
            >
              <Terminal className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>AGY Prompt</span>
            </button>
            <button
              onClick={() => setIsScannerOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[14px_6px_16px_8px/8px_16px_6px_14px] text-xs font-semibold text-stone-300 hover:text-white hover:bg-stone-800 transition-all cursor-pointer"
              title="Scan photo of flyer or menu"
            >
              <Camera className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Scan</span>
            </button>
            <button
              onClick={() => setIsAuditOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[14px_6px_16px_8px/8px_16px_6px_14px] text-xs font-semibold text-stone-300 hover:text-white hover:bg-stone-800 transition-all cursor-pointer"
              title="Run Design & QA Audit"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Audit</span>
            </button>
            <button
              onClick={() => setIsProposalModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[14px_6px_16px_8px/8px_16px_6px_14px] text-xs font-semibold text-stone-300 hover:text-white hover:bg-stone-800 transition-all cursor-pointer"
              title="Generate Client Proposal"
            >
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>Proposal</span>
            </button>
          </div>
        </div>

        {/* Center: Main Workspace View Switcher (Desktop/Tablet) + Outlaw Swagger Pill (Mobile) */}
        <div className="hidden md:flex items-center p-1 bg-stone-900/90 rounded-2xl border border-stone-800 shadow-inner flex-shrink-0 mx-1 sm:mx-2">
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-1.5 rounded-[14px_6px_16px_8px/8px_16px_6px_14px] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'preview'
                ? 'bg-[#C5A059] text-white shadow-md shadow-[#C5A059]/30'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden 2xl:inline">Live Website</span>
            <span className="2xl:hidden">Live</span>
          </button>

          <button
            onClick={() => setActiveTab('admin')}
            className={`px-3 py-1.5 rounded-[14px_6px_16px_8px/8px_16px_6px_14px] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'admin'
                ? 'bg-[#C5A059] text-white shadow-md shadow-[#C5A059]/30'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span className="hidden 2xl:inline">Client Admin</span>
            <span className="2xl:hidden">Admin</span>
          </button>

          <button
            onClick={() => setActiveTab('code')}
            className={`px-2.5 py-1.5 rounded-[14px_6px_16px_8px/8px_16px_6px_14px] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'code'
                ? 'bg-[#C5A059] text-white shadow-md shadow-[#C5A059]/30'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span className="hidden 2xl:inline">React Code</span>
            <span className="2xl:hidden">Code</span>
          </button>
        </div>

        {/* Mobile Center Status Pill */}
        <div className="flex md:hidden items-center gap-1.5 px-2.5 py-1 rounded-xl bg-stone-900/90 border border-stone-800 text-[10px] font-mono text-stone-300 flex-shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-bold text-stone-200 truncate max-w-[100px]">{project.profile.name}</span>
        </div>

        {/* Right Section: Devices, Live Status Badge, Custom Domain, Deploy, Model */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          
          {/* Viewport Device Controls */}
          <div className="hidden lg:flex items-center bg-stone-900 rounded-xl p-1 border border-stone-800 flex-shrink-0">
            <button
              onClick={() => setDevice('desktop')}
              className={`p-1.5 rounded-[14px_6px_16px_8px/8px_16px_6px_14px] text-xs transition-colors cursor-pointer ${
                device === 'desktop' ? 'bg-stone-800 text-[#C5A059] shadow-sm' : 'text-stone-400 hover:text-white'
              }`}
              title="Desktop View"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setDevice('tablet')}
              className={`p-1.5 rounded-[14px_6px_16px_8px/8px_16px_6px_14px] text-xs transition-colors cursor-pointer ${
                device === 'tablet' ? 'bg-stone-800 text-[#C5A059] shadow-sm' : 'text-stone-400 hover:text-white'
              }`}
              title="Tablet View"
            >
              <Tablet className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setDevice('mobile')}
              className={`p-1.5 rounded-[14px_6px_16px_8px/8px_16px_6px_14px] text-xs transition-colors cursor-pointer ${
                device === 'mobile' ? 'bg-stone-800 text-[#C5A059] shadow-sm' : 'text-stone-400 hover:text-white'
              }`}
              title="Mobile View"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Live Deployment Status Badge */}
          <button
            type="button"
            onClick={() => setIsDeploymentHistoryOpen(true)}
            className="hidden xl:flex items-center gap-2 bg-stone-900 hover:bg-stone-800 border border-stone-800 hover:border-stone-700 px-3 py-1.5 rounded-[14px_6px_16px_8px/8px_16px_6px_14px] cursor-pointer transition-all group flex-shrink-0"
            title="View Live Deployment Status & History"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-xs font-mono font-bold text-stone-200 group-hover:text-white truncate max-w-[120px] 2xl:max-w-[160px]">
              {activeDeployedUrl.replace(/^https?:\/\//, '') || `${project.profile.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pages.dev`}
            </span>
            <History className="w-3 h-3 text-stone-500 group-hover:text-[#C5A059] transition-colors" />
          </button>

          {/* AGY Prompt Shortcut (Visible on medium/large screens) */}
          <button
            type="button"
            onClick={() => setIsHandoffOpen(true)}
            className="hidden md:flex 2xl:hidden items-center gap-1 px-2.5 py-1.5 rounded-[14px_6px_16px_8px/8px_16px_6px_14px] border border-[#C5A059]/30 bg-[#C5A059]/10 hover:bg-[#C5A059]/20 text-[#C5A059] text-xs font-bold transition-all cursor-pointer flex-shrink-0"
            title="Get Antigravity AI Master Plan Prompt"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">AGY Prompt</span>
          </button>

          {/* Custom Domain Shortcut */}
          <button
            type="button"
            onClick={() => setIsCustomDomainOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-[14px_6px_16px_8px/8px_16px_6px_14px] border border-stone-800 bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white text-xs font-semibold transition-all cursor-pointer flex-shrink-0"
            title="Connect Namecheap or Custom Domain"
          >
            <Globe className="w-3.5 h-3.5 text-[#C5A059]" />
            <span className="hidden 2xl:inline">Custom Domain</span>
          </button>

          {/* Deploy Button */}
          <button
            onClick={handleDeploySite}
            disabled={agentState.step === 'building'}
            className="bg-[#C5A059] hover:bg-[#C5A059] disabled:opacity-50 text-white px-3.5 sm:px-4 py-1.5 rounded-[14px_6px_16px_8px/8px_16px_6px_14px] text-xs font-black shadow-lg shadow-[#C5A059]/30 transition-all flex items-center gap-1.5 hover:scale-105 cursor-pointer flex-shrink-0"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>{agentState.step === 'building' ? 'Deploying...' : 'Deploy'}</span>
          </button>

          {/* Model Selector Card */}
          <div
            onClick={() => setIsModelSettingsOpen(true)}
            className="hidden 2xl:flex items-center gap-2 bg-stone-900 hover:bg-stone-800 rounded-xl px-2.5 py-1 border border-stone-800 cursor-pointer transition-colors flex-shrink-0"
            title="Click to change AI Model"
          >
            <Cpu className="w-3.5 h-3.5 text-[#C5A059]" />
            <div className="flex flex-col text-left">
              <span className="text-[8px] text-stone-400 uppercase font-bold tracking-wider leading-none">Model</span>
              <span className="text-[11px] font-semibold text-white leading-tight">
                {SUPPORTED_MODELS.find(m => m.id === selectedModel)?.name || 'Claude 3.7'}
              </span>
            </div>
          </div>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="text-stone-400 hover:text-white hover:bg-stone-800 transition-colors p-2 rounded-[14px_6px_16px_8px/8px_16px_6px_14px] hidden sm:block cursor-pointer flex-shrink-0"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4 text-[#C5A059]" /> : <Maximize2 className="w-4 h-4" />}
          </button>

        </div>
      </header>

      {/* Main Studio Split Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Left Side: Desktop 1-Click Instant Builder Panel (Dedicated Pure Configurator) */}
        {!isChatCollapsed && (
          <div className="hidden md:flex w-80 lg:w-96 border-r border-stone-800 bg-stone-900/60 flex-col flex-shrink-0 z-10 animate-in slide-in-from-left-2 duration-200">
            <div className="flex-1 overflow-y-auto">
              <BlueprintFormPanel
                activeSnapshot={project}
                isBusy={agentState.step !== 'ready'}
                selectedModel={selectedModel}
                onSelectModel={handleSelectModel}
                onOpenScanner={() => setIsScannerOpen(true)}
                onOpenHandoff={() => setIsHandoffOpen(true)}
                onOpenAudit={() => setIsAuditOpen(true)}
                onOpenProposal={() => setIsProposalModalOpen(true)}
                onBuild={(snap) => {
                  const newSnapshot: ProjectSnapshot = {
                    id: `prj-${Date.now()}`,
                    prompt: `1-Click Build: ${snap.profile.name}`,
                    timestamp: new Date().toLocaleTimeString(),
                    ...snap,
                  };
                  setProject(newSnapshot);
                  setHistory(prev => [newSnapshot, ...prev]);
                  setActiveTab('preview');
                  setAgentState({ step: 'ready', message: `⚡ Instant build ready: ${snap.profile.name}`, tokensUsed: 0 });
                }}
              />
            </div>
          </div>
        )}

        {/* Mobile Full-Screen Slide-Up Experience Director Drawer */}
        {isMobileDirectorOpen && (
          <div className="fixed inset-0 z-50 md:hidden bg-black/80 backdrop-blur-xl flex flex-col justify-end animate-in fade-in duration-200">
            <div className="bg-stone-950 border-t border-[#C5A059]/40 rounded-t-3xl shadow-2xl flex flex-col h-[92vh] overflow-hidden">
              {/* Drawer Tactile Drag Header */}
              <div className="pt-2 pb-3 px-4 border-b border-stone-800 bg-stone-950 flex flex-col flex-shrink-0">
                {/* Drag handle pill */}
                <div className="w-10 h-1 rounded-full bg-stone-700 mx-auto mb-2.5" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-xl bg-[#C5A059]/20 border border-[#C5A059]/30 flex items-center justify-center text-[#C5A059] font-bold">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-black text-white uppercase tracking-wider">Experience Director</h3>
                        <Squiggle className="w-6 h-1.5 text-[#C5A059]/80" />
                      </div>
                      <p className="text-[10px] text-stone-400">Brand DNA · Archetypes · Signature Features</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsMobileDirectorOpen(false)}
                    className="p-1.5 rounded-[14px_6px_16px_8px/8px_16px_6px_14px] bg-stone-900 border border-stone-800 text-stone-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Drawer Scrollable Content */}
              <div className="flex-1 overflow-y-auto pb-24 bg-stone-950">
                <BlueprintFormPanel
                  activeSnapshot={project}
                  isBusy={agentState.step !== 'ready'}
                  selectedModel={selectedModel}
                  onSelectModel={handleSelectModel}
                  onOpenScanner={() => { setIsScannerOpen(true); setIsMobileDirectorOpen(false); }}
                  onOpenHandoff={() => { setIsHandoffOpen(true); setIsMobileDirectorOpen(false); }}
                  onOpenAudit={() => { setIsAuditOpen(true); setIsMobileDirectorOpen(false); }}
                  onOpenProposal={() => { setIsProposalModalOpen(true); setIsMobileDirectorOpen(false); }}
                  onBuild={(snap) => {
                    const newSnapshot: ProjectSnapshot = {
                      id: `prj-${Date.now()}`,
                      prompt: `1-Click Build: ${snap.profile.name}`,
                      timestamp: new Date().toLocaleTimeString(),
                      ...snap,
                    };
                    setProject(newSnapshot);
                    setHistory(prev => [newSnapshot, ...prev]);
                    setActiveTab('preview');
                    setIsMobileDirectorOpen(false);
                    setAgentState({ step: 'ready', message: `⚡ Instant build ready: ${snap.profile.name}`, tokensUsed: 0 });
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Right Side: Interactive Live Preview & Code View */}
        <div className="flex-1 flex flex-col min-w-0 bg-stone-950">
          
          {/* Canvas Sub-Header: In-Canvas Contextual Controls */}
          <div className="h-10 border-b border-stone-800/80 px-4 sm:px-6 flex items-center justify-between bg-stone-900/40 flex-shrink-0 text-xs text-stone-400">
            <div className="flex items-center space-x-3">
              {/* Component Inspector Button */}
              <button
                onClick={() => setInspectorActive(!inspectorActive)}
                className={`px-2.5 py-1 rounded-[14px_6px_16px_8px/8px_16px_6px_14px] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  inspectorActive 
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40 ring-1 ring-blue-500/20' 
                    : 'text-stone-400 hover:text-stone-200 bg-stone-900/60 border border-stone-800'
                }`}
                title="Click to Inspect Components"
              >
                <MousePointer className="w-3.5 h-3.5" />
                <span>{inspectorActive ? 'Inspecting On' : 'Inspect'}</span>
              </button>

              {/* Theme Harmony Quick Indicator */}
              <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-stone-400 bg-stone-900/60 px-2.5 py-1 rounded-lg border border-stone-800">
                <Palette className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>Theme:</span>
                <span className="font-bold text-stone-200 uppercase">{project.theme}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Browser Tab Favicon Selector */}
              <div className="relative">
                <button
                  onClick={() => setIsFaviconMenuOpen(!isFaviconMenuOpen)}
                  className="flex items-center gap-1.5 px-2 py-0.5 rounded-[14px_6px_16px_8px/8px_16px_6px_14px] bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 text-[11px] transition-all hover:border-[#C5A059]/60 shadow-sm"
                  title="Change Browser Tab Icon"
                >
                  <img
                    src={project.profile.faviconUrl || (isCampaignSite ? '/sheriff-badge-favicon.svg' : '/favicon.png')}
                    className="w-3.5 h-3.5 object-contain rounded"
                    alt="Icon"
                  />
                  <span className="font-semibold hidden sm:inline">Tab Icon</span>
                  <ChevronDown className="w-3 h-3 text-stone-500" />
                </button>

                {isFaviconMenuOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-64 p-2.5 bg-stone-900 border border-stone-700 rounded-xl shadow-2xl z-50 animate-in fade-in-50 zoom-in-95">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 px-1 py-0.5 flex items-center justify-between border-b border-stone-800 mb-1.5">
                      <span>Browser Tab Icon</span>
                      <button onClick={() => setIsFaviconMenuOpen(false)} className="text-stone-500 hover:text-white">✕</button>
                    </div>
                    <div className="space-y-1">
                      {PRESET_FAVICONS.map((fav) => (
                        <button
                          key={fav.id}
                          onClick={() => {
                            setProject(prev => ({
                              ...prev,
                              profile: { ...prev.profile, faviconUrl: fav.url }
                            }));
                            setIsFaviconMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[14px_6px_16px_8px/8px_16px_6px_14px] text-xs transition-colors ${
                            (project.profile.faviconUrl === fav.url || (!project.profile.faviconUrl && isCampaignSite && fav.url === '/sheriff-badge-favicon.svg'))
                              ? 'bg-[#C5A059]/20 text-[#C5A059] font-bold border border-[#C5A059]/40'
                              : 'text-stone-300 hover:bg-stone-800'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <img src={fav.url} className="w-4 h-4 object-contain rounded" />
                            <span>{fav.label}</span>
                          </div>
                          <span className="text-[10px] text-stone-500 font-normal">{fav.category}</span>
                        </button>
                      ))}
                    </div>

                    <div className="mt-2 pt-2 border-t border-stone-800">
                      <label className="block text-[10px] font-semibold text-stone-400 mb-1">Custom Icon URL / SVG</label>
                      <input
                        type="url"
                        placeholder="https://.../icon.svg or /favicon.png"
                        value={project.profile.faviconUrl || ''}
                        onChange={(e) => setProject(prev => ({
                          ...prev,
                          profile: { ...prev.profile, faviconUrl: e.target.value }
                        }))}
                        className="w-full px-2 py-1 rounded bg-stone-950 border border-stone-800 text-[11px] text-white font-mono focus:outline-none focus:border-[#C5A059]"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-stone-500 hidden md:inline">Theme:</span>
                <span className="capitalize text-stone-300 font-semibold px-2 py-0.5 rounded-md bg-stone-800 border border-stone-700 text-[11px]">
                  {project.theme}
                </span>
              </div>
            </div>
          </div>

          {/* Canvas Viewport Body with Edgy Color Blocking & Dot Matrix */}
          <div className="flex-1 overflow-y-auto p-2 sm:p-6 pb-28 md:pb-6 flex items-start justify-center bg-stone-950 bg-[radial-gradient(#262626_1px,transparent_1px)] [background-size:20px_20px]">
            
            {/* TAB 1: Live Public Website Preview */}
            {activeTab === 'preview' && (
              <div 
                data-ts-site=""
                style={buildThemeVars({ theme: project.theme, ...project.profile }) as React.CSSProperties}
                className={`transition-all duration-300 rounded-2xl shadow-2xl border border-stone-800/80 overflow-hidden flex flex-col ${getThemeBackgroundClass()} ${
                  device === 'desktop' ? 'w-full max-w-full' : device === 'tablet' ? 'w-[768px]' : 'w-[375px]'
                }`}
              >
                {/* Simulated Browser Top Frame */}
                <div className="h-9 bg-stone-900/90 border-b border-stone-800 px-4 flex items-center justify-between text-xs text-stone-400 select-none flex-shrink-0">
                  <div className="flex items-center space-x-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  </div>
                  <div className="px-3 py-0.5 rounded-md bg-stone-950 border border-stone-800 text-[11px] text-stone-400 font-mono truncate max-w-[280px] sm:max-w-md flex items-center gap-2">
                    <img
                      src={project.profile.faviconUrl || (isCampaignSite ? '/sheriff-badge-favicon.svg' : '/favicon.png')}
                      className="w-3.5 h-3.5 object-contain rounded flex-shrink-0"
                      alt="Favicon"
                    />
                    <span className="truncate">https://{project.profile.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pages.dev</span>
                  </div>
                  <div className="w-10" />
                </div>

                {/* One renderer, shared with ClientApp.
                    This used to be a hardcoded list of nine blocks, so anything
                    added to the deployed site — gallery, before/after, products —
                    was invisible here and the preview lied about what the client
                    would receive. */}
                {/* Inside an iframe so the breakpoints are real.
                    The device buttons used to change only the width of this box
                    while the page inside kept rendering the desktop layout,
                    because a media query measures the window and not the box.
                    The frame has its own viewport, so the phone button now shows
                    what a phone shows. */}
                <PreviewFrame
                  title="Live site preview"
                  className="w-full flex-1 min-h-[600px] border-0 bg-[color:var(--ts-bg)]"
                  bodyStyle={buildThemeVars({ theme: project.theme, ...project.profile }) as React.CSSProperties}
                  bodyClassName="divide-y divide-transparent overflow-x-hidden"
                >
                  <SiteRenderer
                    project={previewProject}
                    onSelectBlock={kind => inspectorActive && setSelectedBlock(kind)}
                    selectedBlock={selectedBlock}
                  />
                </PreviewFrame>
              </div>
            )}


            {/* TAB 2: Industry-Specific Client Admin Portal */}
            {activeTab === 'admin' && (
              <div className="w-full max-w-5xl">
                <IndustryAdminBlock
                  business={project.profile}
                  services={project.services}
                  testimonials={project.testimonials}
                />
              </div>
            )}

            {/* TAB 3: Compiled Code */}
            {activeTab === 'code' && (
              <div className="w-full max-w-5xl bg-stone-900 rounded-2xl border border-stone-800 p-6 font-mono text-xs text-stone-300 overflow-x-auto shadow-2xl">
                <pre>{`// Texas Sons Generated App - Full Modular React/Vite Output
import React from 'react';
import { 
  NavbarBlock, 
  HeroBlock, 
  CampaignHeroBlock,
  ServicesBlock, 
  TestimonialsBlock, 
  BookingBlock, 
  FooterBlock 
} from './templates/blocks';

export default function ClientSite() {
  const profile = ${JSON.stringify(project.profile, null, 2)};
  const services = ${JSON.stringify(project.services, null, 2)};
  const testimonials = ${JSON.stringify(project.testimonials, null, 2)};

  return (
    <div className="w-full min-h-screen bg-[color:var(--ts-bg)] text-[color:var(--ts-text)] font-sans">
      <NavbarBlock 
        businessName={profile.name} 
        phone={profile.phone} 
        theme="${project.theme}" 
      />
      ${isCampaignSite ? `
      <CampaignHeroBlock 
        headline={profile.tagline || profile.name} 
        subheadline={profile.description} 
        heroImage={profile.heroImage} 
        accentColor={profile.accentColor}
        badges={${JSON.stringify(project.badges)}}
        proofBadgeText="${project.proofBadgeText || ''}"
      />` : `
      <HeroBlock 
        headline={profile.tagline || profile.name} 
        subheadline={profile.description} 
        heroImage={profile.heroImage} 
        variant="${project.heroVariant}" 
        theme="${project.theme}" 
      />`}
      <ServicesBlock 
        services={services} 
        theme="${project.theme}" 
        title="${isCampaignSite ? 'Campaign Platform & Priorities' : 'Our Services'}"
        subtitle="${isCampaignSite ? 'Our commitment to the community and our plan for the future.' : 'Professional, reliable, and tailored to your needs.'}"
      />
      <TestimonialsBlock 
        testimonials={testimonials} 
        theme="${project.theme}" 
        title="${isCampaignSite ? 'Endorsements & Community Support' : 'What Our Clients Say'}"
        subtitle="${isCampaignSite ? 'Trusted by leaders, law enforcement, and families across Texas.' : 'Real reviews from verified customers in your area.'}"
      />
      <BookingBlock 
        phone={profile.phone} 
        services={services} 
        theme="${project.theme}"
        title="${isCampaignSite ? 'Volunteer & Request Yard Signs' : 'Request a Free Consultation'}"
      />
      <FooterBlock business={profile} theme="${project.theme}" />
    </div>
  );
}`}</pre>
              </div>
            )}

            {/* TAB 4: Blueprint JSON Schema */}
            {activeTab === 'blueprint' && (
              <div className="w-full max-w-5xl bg-stone-900 rounded-2xl border border-stone-800 p-6 font-mono text-xs text-stone-300 overflow-x-auto shadow-2xl">
                <div className="text-xs text-[#C5A059] mb-3 font-bold">// Multi-Agent Distilled Blueprint JSON</div>
                <pre>{JSON.stringify(project, null, 2)}</pre>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* Custom Experience & Brand Creator Modal */}
      {intakeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-stone-900 border border-stone-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col text-stone-200">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-stone-800 flex items-center justify-between bg-stone-950">
              <div className="flex items-center space-x-2.5">
                <Vote className="w-5 h-5 text-[#C5A059]" />
                <div>
                  <h3 className="font-bold text-white text-base">Create New Client Brand Experience</h3>
                  <p className="text-xs text-stone-400">Configure brand identity, spatial layout archetype, and signature interactive features.</p>
                </div>
              </div>
              <button 
                onClick={() => setIntakeModalOpen(false)}
                className="p-1.5 rounded-[14px_6px_16px_8px/8px_16px_6px_14px] text-stone-400 hover:text-white hover:bg-stone-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form id="custom-intake-form" onSubmit={handleSaveCustomBlueprint} className="p-6 overflow-y-auto space-y-5 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-stone-400 mb-1.5">
                    Experience Title
                  </label>
                  <input
                    type="text"
                    required
                    value={intakeForm.title}
                    onChange={(e) => setIntakeForm({ ...intakeForm, title: e.target.value })}
                    placeholder="e.g. Debbie Dietzmann for Judge"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-white focus:outline-none focus:border-[#C5A059]"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-stone-400 mb-1.5">
                    Category / Industry
                  </label>
                  <select
                    value={intakeForm.category}
                    onChange={(e) => setIntakeForm({ ...intakeForm, category: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-white focus:outline-none focus:border-[#C5A059]"
                  >
                    <option value="Campaign & Leadership">Campaign & Political Leadership</option>
                    <option value="Beauty & Wellness">Beauty & Wellness (Salons & Spas)</option>
                    <option value="Food & Beverage">Food & Beverage (Restaurants & BBQ)</option>
                    <option value="Home Services">Home Services & Contractors</option>
                    <option value="Professional & Legal">Professional & Legal Services</option>
                    <option value="General">Custom Application</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-stone-400 mb-1.5">
                    Candidate / Business Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={intakeForm.name}
                    onChange={(e) => setIntakeForm({ ...intakeForm, name: e.target.value })}
                    placeholder="e.g. Deborah Dietzmann for Judge"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-white focus:outline-none focus:border-[#C5A059]"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-stone-400 mb-1.5">
                    Slogan / Core Headline
                  </label>
                  <input
                    type="text"
                    value={intakeForm.tagline}
                    onChange={(e) => setIntakeForm({ ...intakeForm, tagline: e.target.value })}
                    placeholder="e.g. Equal Justice. Constitutional Integrity."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-white focus:outline-none focus:border-[#C5A059]"
                  />
                </div>
              </div>

              {/* Color Scheme Picker */}
              <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 space-y-3">
                <div className="flex items-center space-x-2">
                  <Palette className="w-4 h-4 text-[#C5A059]" />
                  <span className="font-semibold uppercase tracking-wider text-stone-300 text-xs">Color Scheme & Aesthetic Harmony</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-stone-400 mb-1">Preset Palette</label>
                    <select
                      value={intakeForm.theme}
                      onChange={(e) => {
                        const val = e.target.value as any;
                        let p = '#00081e';
                        let a = '#C5A059';
                        if (val === 'luxury') { p = '#1c1917'; a = '#d97706'; }
                        if (val === 'crimson-bold') { p = '#2b0c0d'; a = '#dc2626'; }
                        if (val === 'emerald-gold') { p = '#041a14'; a = '#fbbf24'; }
                        if (val === 'light') { p = '#ffffff'; a = '#2563eb'; }
                        if (val === 'campaign-judicial') { p = '#0f172a'; a = '#991b1b'; }
                        setIntakeForm({ ...intakeForm, theme: val, primaryColor: p, accentColor: a });
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-white text-xs focus:outline-none"
                    >
                      <option value="campaign-navy">Presidential Navy & Heritage Gold (Debbie Style)</option>
                      <option value="campaign-judicial">Judicial Light (Navy & Crimson)</option>
                      <option value="luxury">Luxury Onyx & Warm Gold</option>
                      <option value="crimson-bold">Texas Crimson & Smoked Charcoal</option>
                      <option value="emerald-gold">Deep Emerald & Warm Brass</option>
                      <option value="light">Clean Light Slate & Modern Blue</option>
                      <option value="dark">Dark Minimalist</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-stone-400 mb-1">Primary Color (Hex)</label>
                    <input
                      type="text"
                      value={intakeForm.primaryColor}
                      onChange={(e) => setIntakeForm({ ...intakeForm, primaryColor: e.target.value })}
                      placeholder="#00081e"
                      className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-white font-mono text-xs focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-stone-400 mb-1">Accent Gold/Color (Hex)</label>
                    <input
                      type="text"
                      value={intakeForm.accentColor}
                      onChange={(e) => setIntakeForm({ ...intakeForm, accentColor: e.target.value })}
                      placeholder="#C5A059"
                      className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-white font-mono text-xs focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-stone-400 mb-1.5">
                  Bio / Experience / Career History (Context)
                </label>
                <textarea
                  rows={3}
                  value={intakeForm.description}
                  onChange={(e) => setIntakeForm({ ...intakeForm, description: e.target.value })}
                  placeholder="Paste background, 28 years legal counsel, felony trial prosecution, courtroom integrity, judicial achievements..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-white focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-stone-400 mb-1.5">
                  Candidate Headshot / Hero Image URL
                </label>
                <input
                  type="url"
                  value={intakeForm.heroImage}
                  onChange={(e) => setIntakeForm({ ...intakeForm, heroImage: e.target.value })}
                  placeholder="https://images.unsplash.com/... or hosted portrait URL"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-white focus:outline-none focus:border-[#C5A059] font-mono text-[11px]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-stone-400 mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={intakeForm.phone}
                    onChange={(e) => setIntakeForm({ ...intakeForm, phone: e.target.value })}
                    placeholder="(512) 555-4601"
                    className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-stone-400 mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    value={intakeForm.email}
                    onChange={(e) => setIntakeForm({ ...intakeForm, email: e.target.value })}
                    placeholder="debbie@dietzmannforjudge.com"
                    className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-stone-400 mb-1.5">
                    HQ / Address
                  </label>
                  <input
                    type="text"
                    value={intakeForm.address}
                    onChange={(e) => setIntakeForm({ ...intakeForm, address: e.target.value })}
                    placeholder="Austin, TX"
                    className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-stone-400 mb-1.5">
                  Platform Pillars / Services (One per line: Title | Description)
                </label>
                <textarea
                  rows={3}
                  value={intakeForm.servicesText}
                  onChange={(e) => setIntakeForm({ ...intakeForm, servicesText: e.target.value })}
                  placeholder="Courtroom Rule of Law | Applying the law as written without political bias&#10;Youth Diversion Programs | Early intervention for non-violent offenders&#10;Docket Efficiency | Eliminating backlogs to save taxpayer funds"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-white font-mono text-[11px] focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-stone-400 mb-1.5">
                  Endorsements / Reviews (One per line: "Quote" — Author (Role))
                </label>
                <textarea
                  rows={3}
                  value={intakeForm.testimonialsText}
                  onChange={(e) => setIntakeForm({ ...intakeForm, testimonialsText: e.target.value })}
                  placeholder={`"Deborah has the highest ethical standard in our district." — Justice Franklin Vance (Appeals Court)&#10;"Fair, decisive, and dedicated to Texas families." — Sheriff Douglas (Law Enforcement Coalition)`}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-white font-mono text-[11px] focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-stone-400 mb-1.5">
                    Hero Layout
                  </label>
                  <select
                    value={intakeForm.heroVariant}
                    onChange={(e) => setIntakeForm({ ...intakeForm, heroVariant: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white focus:outline-none"
                  >
                    <option value="split">Split Layout (Candidate Photo + Bio)</option>
                    <option value="bento">Bento Grid (Key Metrics + Badges)</option>
                    <option value="centered">Centered Headline & Dual CTA</option>
                  </select>
                </div>
              </div>

            </form>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-stone-800 bg-stone-950 flex items-center justify-between">
              <span className="text-[11px] text-stone-500">
                Saves locally into your permanent Blueprints registry ($0 API Cost).
              </span>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setIntakeModalOpen(false)}
                  className="px-4 py-2 rounded-[14px_6px_16px_8px/8px_16px_6px_14px] bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="custom-intake-form"
                  className="px-5 py-2 rounded-[14px_6px_16px_8px/8px_16px_6px_14px] bg-[#C5A059] hover:bg-[#C5A059] text-white font-bold flex items-center gap-1.5 shadow-lg shadow-[#C5A059]/30"
                >
                  <Save className="w-4 h-4" />
                  <span>Generate & Save Experience</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* AI Multimodal Photo Scanner Modal */}
      <ModelSettingsModal
        isOpen={isModelSettingsOpen}
        onClose={() => setIsModelSettingsOpen(false)}
        selectedModel={selectedModel}
        onSelectModel={handleSelectModel}
        usageStats={usageStats}
        onResetUsage={handleResetUsage}
      />

      <PlanHandoffModal
        isOpen={isHandoffOpen}
        onClose={() => setIsHandoffOpen(false)}
        project={project}
        selectedModel={selectedModel}
      />

      <SiteAuditModal
        isOpen={isAuditOpen}
        onClose={() => setIsAuditOpen(false)}
        project={project}
        selectedModel={selectedModel}
        onOpenHandoff={() => setIsHandoffOpen(true)}
        onApplyFixes={(updated) => setProject(updated)}
        onSelectModel={handleSelectModel}
      />

      <PhotoScannerModal 
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onApplyDossier={handleApplyFromScanner}
        existingImages={project.uploadedImages}
      />

      <ProjectProposalModal
        isOpen={isProposalModalOpen}
        onClose={() => setIsProposalModalOpen(false)}
        snapshot={project}
        onApplySnapshot={(updatedSnapshot) => setProject(updatedSnapshot)}
      />

      <CustomDomainModal
        isOpen={isCustomDomainOpen}
        onClose={() => setIsCustomDomainOpen(false)}
        projectName={project.profile.name}
        currentDomain={activeDeployedUrl}
        onDomainUpdated={(domain) => {
          if (domain) setActiveDeployedUrl(`https://${domain}`);
        }}
      />

      <DeploymentHistoryModal
        isOpen={isDeploymentHistoryOpen}
        onClose={() => setIsDeploymentHistoryOpen(false)}
        projectName={project.profile.name}
        activeUrl={activeDeployedUrl}
        onOpenCustomDomains={() => setIsCustomDomainOpen(true)}
        onRedeploy={handleDeploySite}
        isDeploying={agentState.step === 'building'}
      />

      {/* ── MOBILE STITCH-STYLE 5-TAB BOTTOM DOCK ───────────────────── */}
      <div className="fixed bottom-0 inset-x-0 z-40 md:hidden">
        {/* ── Tools Slide-Up Sheet (shown when Tools tab active on mobile) ── */}
        {isMobileQuickMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden bg-black/70 backdrop-blur-lg flex flex-col justify-end animate-in fade-in duration-150">
            <div className="bg-stone-950 border-t border-stone-800 rounded-t-3xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden">
              {/* Sheet Header */}
              <div className="pt-2.5 pb-3 px-5 border-b border-stone-800/80 flex-shrink-0">
                <div className="w-10 h-1 rounded-full bg-stone-700 mx-auto mb-3" />
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-[#C5A059] uppercase tracking-widest font-mono">STUDIO TOOLS</h3>
                  </div>
                  <button onClick={() => setIsMobileQuickMenuOpen(false)} className="p-1.5 rounded-[14px_6px_16px_8px/8px_16px_6px_14px] bg-stone-900 border border-stone-800 text-stone-400 cursor-pointer active:scale-95">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {/* Tool tabs */}
                <div className="flex gap-5 mt-3">
                  <button className="flex items-center gap-1.5 text-[11px] font-bold text-[#C5A059] border-b-2 border-[#C5A059] pb-1">
                    <Layers className="w-3.5 h-3.5" />ARCHETYPES
                  </button>
                  <button className="flex items-center gap-1.5 text-[11px] font-bold text-stone-500 pb-1 border-b-2 border-transparent">
                    <Sliders className="w-3.5 h-3.5" />FEATURES
                  </button>
                </div>
              </div>
              {/* Sheet Content */}
              <div className="flex-1 overflow-y-auto px-4 py-4 pb-8 space-y-3">
                {/* Quick Actions Row */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => { setIsScannerOpen(true); setIsMobileQuickMenuOpen(false); }}
                    className="p-3 rounded-[14px_6px_16px_8px/8px_16px_6px_14px] bg-stone-900 border border-stone-800 flex items-center gap-2.5 text-stone-300 hover:text-[#C5A059] cursor-pointer active:scale-95 transition-all"
                  >
                    <div className="w-8 h-8 rounded-[14px_6px_16px_8px/8px_16px_6px_14px] bg-[#C5A059]/10 border border-[#C5A059]/30 flex items-center justify-center flex-shrink-0">
                      <Camera className="w-4 h-4 text-[#C5A059]" />
                    </div>
                    <div className="text-left">
                      <div className="text-[11px] font-black text-stone-200">Scan Flyer</div>
                      <div className="text-[9px] text-stone-500">Photo intake</div>
                    </div>
                  </button>
                  <button
                    onClick={() => { setIsAuditOpen(true); setIsMobileQuickMenuOpen(false); }}
                    className="p-3 rounded-[14px_6px_16px_8px/8px_16px_6px_14px] bg-stone-900 border border-stone-800 flex items-center gap-2.5 text-stone-300 hover:text-emerald-400 cursor-pointer active:scale-95 transition-all"
                  >
                    <div className="w-8 h-8 rounded-[14px_6px_16px_8px/8px_16px_6px_14px] bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="text-left">
                      <div className="text-[11px] font-black text-stone-200">QA Audit</div>
                      <div className="text-[9px] text-stone-500">PM review</div>
                    </div>
                  </button>
                  <button
                    onClick={() => { setIsCustomDomainOpen(true); setIsMobileQuickMenuOpen(false); }}
                    className="p-3 rounded-[14px_6px_16px_8px/8px_16px_6px_14px] bg-stone-900 border border-stone-800 flex items-center gap-2.5 text-stone-300 hover:text-blue-400 cursor-pointer active:scale-95 transition-all"
                  >
                    <div className="w-8 h-8 rounded-[14px_6px_16px_8px/8px_16px_6px_14px] bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <Globe className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="text-left">
                      <div className="text-[11px] font-black text-stone-200">Domain</div>
                      <div className="text-[9px] text-stone-500">Custom URL</div>
                    </div>
                  </button>
                  <button
                    onClick={() => { setIsHandoffOpen(true); setIsMobileQuickMenuOpen(false); }}
                    className="p-3 rounded-[14px_6px_16px_8px/8px_16px_6px_14px] bg-stone-900 border border-stone-800 flex items-center gap-2.5 text-stone-300 hover:text-[#C5A059] cursor-pointer active:scale-95 transition-all"
                  >
                    <div className="w-8 h-8 rounded-[14px_6px_16px_8px/8px_16px_6px_14px] bg-[#C5A059]/10 border border-[#C5A059]/30 flex items-center justify-center flex-shrink-0">
                      <Terminal className="w-4 h-4 text-[#C5A059]" />
                    </div>
                    <div className="text-left">
                      <div className="text-[11px] font-black text-stone-200">AGY Spec</div>
                      <div className="text-[9px] text-stone-500">AI prompt</div>
                    </div>
                  </button>
                </div>

                {/* Archetype Cards */}
                <div className="text-[10px] font-black text-stone-500 uppercase tracking-widest mt-2 px-0.5">Archetypes</div>
                {[
                  { id: 'ID-01', name: 'The Outlaw', desc: 'High risk, high reward behavioral matrix. Prioritizes aggressive problem solving and unconventional paths.', icon: Flame, traits: [{label:'Aggression', val:90},{label:'Stealth',val:40}] },
                  { id: 'ID-02', name: 'The Sheriff', desc: 'Disciplined, authoritative framework. Enforces standards and maintains system stability under stress.', icon: ShieldCheck, traits: [{label:'Authority', val:95},{label:'Precision',val:80}], active: true },
                ].map(arch => (
                  <div key={arch.id} className={`p-4 rounded-2xl border flex flex-col gap-3 ${arch.active ? 'border-[#C5A059]/40 bg-stone-900' : 'border-stone-800 bg-stone-900/60'}`}>
                    <div className="flex items-start justify-between">
                      <div className="w-9 h-9 rounded-[14px_6px_16px_8px/8px_16px_6px_14px] bg-[#C5A059]/10 border border-[#C5A059]/30 flex items-center justify-center flex-shrink-0">
                        <arch.icon className="w-4.5 h-4.5 text-[#C5A059]" />
                      </div>
                      <div className="flex items-center gap-2">
                        {arch.active && <span className="text-[9px] font-black text-[#C5A059] border border-[#C5A059]/40 rounded-full px-2 py-0.5">● ACTIVE</span>}
                        <span className="text-[9px] font-mono text-stone-600 border border-stone-800 rounded px-1.5 py-0.5">{arch.id}</span>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-stone-100 mb-1">{arch.name}</h4>
                      <p className="text-[11px] text-stone-400 leading-relaxed">{arch.desc}</p>
                    </div>
                    <div className="space-y-2">
                      {arch.traits.map(t => (
                        <div key={t.label} className="flex items-center gap-2">
                          <span className="text-[10px] text-stone-500 w-16 flex-shrink-0">{t.label}</span>
                          <div className="flex-1 h-1 bg-stone-800 rounded-full overflow-hidden">
                            <div className="h-full bg-[#C5A059] rounded-full" style={{width:`${t.val}%`}} />
                          </div>
                        </div>
                      ))}
                    </div>
                    <button className="w-full py-2.5 rounded-[14px_6px_16px_8px/8px_16px_6px_14px] border border-stone-700 text-[11px] font-black text-stone-300 hover:border-[#C5A059]/60 hover:text-[#C5A059] transition-all cursor-pointer active:scale-98 flex items-center justify-center gap-1.5">
                      CONFIGURE <Sliders className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1" onClick={() => setIsMobileQuickMenuOpen(false)} />
          </div>
        )}

        {/* ── Deploy Tab Overlay (shown when Deploy tapped) ────── */}
        {activeTab === 'blueprint' && (
          <div className="fixed inset-0 z-50 md:hidden bg-stone-950 flex flex-col overflow-y-auto pb-20">
            {/* Deploy Header */}
            <div className="px-5 pt-5 pb-4 flex items-center justify-between flex-shrink-0 border-b border-stone-800/60">
              <div>
                <h2 className="text-lg font-bold text-stone-100">Deploy</h2>
                <p className="text-[11px] text-stone-500 font-mono">Push live to production</p>
              </div>
              <button onClick={() => setActiveTab('preview')} className="p-1.5 rounded-[14px_6px_16px_8px/8px_16px_6px_14px] bg-stone-900 border border-stone-800 text-stone-400 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 px-4 py-4 space-y-4">
              {/* System Status */}
              <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800">
                <h3 className="text-sm font-bold text-stone-100 mb-3">System Status</h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Environment', val: 'Production', highlight: true },
                    { label: 'Target Node', val: 'us-west-frontier' },
                    { label: 'Build Cache', val: 'Optimized', highlight: true },
                    { label: 'Latency', val: '24ms' },
                  ].map(s => (
                    <div key={s.label} className="p-2.5 rounded-xl bg-stone-950 border border-stone-800">
                      <div className="text-[9px] font-mono text-stone-500 uppercase tracking-wider mb-1">{s.label}</div>
                      <div className={`text-xs font-bold ${s.highlight ? 'text-[#C5A059]' : 'text-stone-200'}`}>{s.val}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Deployment Logs */}
              <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-stone-100">Deployment Logs</h3>
                  <span className="text-[9px] font-mono text-stone-500 border border-stone-700 rounded-lg px-2 py-0.5">
                    {agentState.step === 'building' ? 'BUILDING...' : 'Awaiting Command'}
                  </span>
                </div>
                <div className="bg-stone-950 rounded-xl p-3 font-mono text-[11px] space-y-1.5">
                  <div><span className="text-stone-500">[SYS]</span><span className="text-stone-300 ml-2">Initializing deployment sequence...</span></div>
                  <div><span className="text-blue-400">[CHK]</span><span className="text-stone-300 ml-2">Verifying frontier nodes...</span></div>
                  <div><span className="text-emerald-400">[OK]</span><span className="text-stone-300 ml-2">All systems nominal. Ready for launch.</span></div>
                  {agentState.step === 'building' && (
                    <div><span className="text-[#C5A059]">[LIVE]</span><span className="text-stone-300 ml-2 animate-pulse">Deploying...</span></div>
                  )}
                  <div className="text-stone-600">...</div>
                </div>
              </div>

              {/* Initiate Launch */}
              <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800 flex flex-col items-center text-center gap-3">
                <div className="w-16 h-16 rounded-full bg-stone-800 border border-stone-700 flex items-center justify-center">
                  <UploadCloud className="w-7 h-7 text-[#C5A059]" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-stone-100">Initiate Launch</h4>
                  <p className="text-[11px] text-stone-500 mt-0.5">Deploy current build to production servers.</p>
                </div>
                <button
                  onClick={handleDeploySite}
                  disabled={agentState.step === 'building'}
                  className="w-full py-3 rounded-[14px_6px_16px_8px/8px_16px_6px_14px] bg-[#C5A059]/80 hover:bg-[#C5A059] disabled:opacity-50 text-stone-950 text-xs font-black uppercase tracking-widest transition-all cursor-pointer active:scale-98 shadow-lg shadow-[#C5A059]/20 flex items-center justify-center gap-2"
                >
                  {agentState.step === 'building' ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> DEPLOYING...</> : 'DEPLOY SITE'}
                </button>
              </div>

              {/* Custom Domain + History */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setIsCustomDomainOpen(true)}
                  className="p-3.5 rounded-[14px_6px_16px_8px/8px_16px_6px_14px] bg-stone-900 border border-stone-800 flex flex-col items-center gap-2 text-stone-400 hover:text-[#C5A059] cursor-pointer active:scale-95 transition-all"
                >
                  <Globe className="w-5 h-5" />
                  <span className="text-[10px] font-black">Custom Domain</span>
                </button>
                <button
                  onClick={() => setIsDeploymentHistoryOpen(true)}
                  className="p-3.5 rounded-[14px_6px_16px_8px/8px_16px_6px_14px] bg-stone-900 border border-stone-800 flex flex-col items-center gap-2 text-stone-400 hover:text-[#C5A059] cursor-pointer active:scale-95 transition-all"
                >
                  <History className="w-5 h-5" />
                  <span className="text-[10px] font-black">History</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── The Actual Flat Tab Bar ─────────────────────────────────── */}
        <div
          className="bg-stone-950/98 border-t border-stone-800/80 backdrop-blur-xl px-2 pt-2 pb-safe flex items-center justify-around"
          style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
        >
          {([
            { id: 'preview' as const, label: 'Live', Icon: Eye },
            { id: 'admin' as const, label: 'Admin', Icon: LayoutDashboard },
            { id: 'director' as const, label: 'Director', Icon: Sparkles },
            { id: 'tools' as const, label: 'Tools', Icon: Sliders },
            { id: 'deploy' as const, label: 'Deploy', Icon: UploadCloud },
          ] as {id: 'preview'|'admin'|'director'|'tools'|'deploy', label: string, Icon: React.ComponentType<{className?: string}>}[]).map(({ id, label, Icon }) => {
            const isActive = id === 'director'
              ? isMobileDirectorOpen
              : id === 'tools'
              ? isMobileQuickMenuOpen
              : id === 'deploy'
              ? activeTab === 'blueprint'
              : (activeTab === id && !isMobileDirectorOpen && !isMobileQuickMenuOpen && activeTab !== 'blueprint');

            return (
              <button
                key={id}
                onClick={() => {
                  if (id === 'director') {
                    setIsMobileDirectorOpen(true);
                    setIsMobileQuickMenuOpen(false);
                    setActiveTab('preview');
                  } else if (id === 'tools') {
                    setIsMobileQuickMenuOpen(true);
                    setIsMobileDirectorOpen(false);
                    setActiveTab('preview');
                  } else if (id === 'deploy') {
                    setActiveTab('blueprint');
                    setIsMobileDirectorOpen(false);
                    setIsMobileQuickMenuOpen(false);
                  } else {
                    setActiveTab(id as 'preview' | 'admin');
                    setIsMobileDirectorOpen(false);
                    setIsMobileQuickMenuOpen(false);
                  }
                }}
                className={
                  id === 'director'
                    ? "flex flex-col items-center justify-center gap-1 w-14 h-14 -mt-5 rounded-[14px_6px_16px_8px/8px_16px_6px_14px] transition-all cursor-pointer shadow-lg shadow-[#C5A059]/20 bg-[#C5A059] text-stone-950 font-black"
                    : `flex flex-col items-center gap-1 px-3 py-1.5 rounded-[14px_6px_16px_8px/8px_16px_6px_14px] transition-all cursor-pointer active:scale-95 min-w-[52px] ${
                        isActive ? 'text-[#C5A059]' : 'text-stone-500 hover:text-stone-300'
                      }`
                }
              >
                <Icon className="w-5 h-5" />
                <span className={`text-[10px] font-bold ${id === 'director' ? 'text-stone-950' : isActive ? 'text-[#C5A059]' : ''}`}>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}
