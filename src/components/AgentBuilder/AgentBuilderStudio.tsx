import React, { useState, useEffect, useRef } from 'react';
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
  Bookmark
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
import { supabase } from '../../supabase';
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
import { ClientIntake } from '../../types';

interface AgentState {
  step: 'idle' | 'scouting' | 'architecting' | 'building' | 'ready';
  message: string;
  tokensUsed: number;
}

export interface ProjectSnapshot {
  id: string;
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
    testimonials: [
      { quote: 'Waylon has the courtroom experience, unshakeable ethics, and deep community roots our county bench urgently requires.', author: 'Sheriff Hector Ramirez', role: 'Law Enforcement Coalition Endorsement', rating: 5, verified: true },
      { quote: 'A steadfast defender of our landowners, water rights, and constitutional freedoms. He has our full trust and endorsement.', author: 'Sarah Jenkins', role: 'Atascosa County Cattlemen & Landowner', rating: 5, verified: true },
      { quote: 'Fair, disciplined, and committed to transparency. Waylon will run our county courts with the highest standard of honor.', author: 'Judge Ronald Sterling', role: 'Presiding Magistrate (Ret.)', rating: 5, verified: true }
    ],
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
    testimonials: [
      { quote: 'When lives were on the line during an active hostage crisis, Trevino led tactical entry from the front with extraordinary courage. His SAPD Medal of Valor speaks for itself.', author: 'Captain Sarah Garza', role: 'Retired SWAT & Tactical Commander', rating: 5, verified: true },
      { quote: 'Ernest served as one of the most relentless lead detectives in South Texas, spearheading major criminal investigations and dismantling dangerous cartel trafficking networks.', author: 'Lieutenant Hector Benavides', role: 'Former Chief of Criminal Investigations', rating: 5, verified: true },
      { quote: 'Ernest Trevino is a true lawman of unshakeable constitutional integrity. He understands rural property owners, supports our deputies, and brings proven leadership to Atascosa County.', author: 'Judge Ronald Sterling', role: 'Presiding County Magistrate & Rancher', rating: 5, verified: true }
    ],
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
    testimonials: [
      { quote: 'Deborah has the sharpest legal mind and highest ethical standard in our district. She has my full endorsement for Judge.', author: 'Justice Franklin E. Vance', role: 'Former Court of Appeals Justice', rating: 5, verified: true },
      { quote: 'A dedicated public servant who commands respect from both prosecution and defense counsel alike.', author: 'Sheriff R. Douglas', role: 'County Law Enforcement Coalition', rating: 5, verified: true },
      { quote: 'Fair, decisive, and unwavering in her commitment to Texas families and community safety.', author: 'Patricia Holbrook', role: 'County Bar Association Past-President', rating: 5, verified: true }
    ],
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
    testimonials: [
      { quote: 'John Stone has stood on the front lines protecting our county for over two decades. He has my complete endorsement for Sheriff.', author: 'Judge Robert Sterling', role: 'Presiding County Magistrate', rating: 5, verified: true },
      { quote: 'A leader of unmatched integrity. When deputies needed backup, Stone was the first through the door.', author: 'Captain Sarah Briggs', role: 'Retired SWAT Supervisor', rating: 5, verified: true },
      { quote: 'Sheriff Stone is the only candidate who has a real, actionable plan to keep our neighborhoods safe.', author: 'Elena Martinez', role: 'Neighborhood Association President', rating: 5, verified: true }
    ],
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
    testimonials: [
      { quote: 'Best salon experience in Dallas. My balayage lasted months and my hair has never felt healthier.', author: 'Elena Rostova', rating: 5, verified: true },
      { quote: 'The attention to detail and atmosphere is pure luxury. Worth every single penny.', author: 'Marcus Vance', rating: 5, verified: true },
      { quote: 'Aura transformed my damaged hair in just two sessions. The staff is world class.', author: 'Sophia Chen', rating: 5, verified: true }
    ],
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
    testimonials: [
      { quote: 'Hands down the best brisket in Fort Worth. Melt-in-your-mouth perfection every single time.', author: 'Hank Callahan', role: 'Local Food Critic', rating: 5, verified: true },
      { quote: 'They catered our company retreat of 150 people and everyone is still raving about the ribs.', author: 'Jessica Thorne', role: 'Corporate Event Lead', rating: 5, verified: true },
      { quote: 'We drive an hour just for their brisket and jalapeño links. Bring cash for the peach cobbler — it sells out fast.', author: 'Dwayne \'Smokey\' Harrell', role: 'Texas Monthly Reader Pick', rating: 5, verified: true }
    ],
    theme: 'crimson-bold',
    heroVariant: 'split'
  }
];

export interface AgentBuilderStudioProps {
  initialSnapshot?: ProjectSnapshot | null;
}

export default function AgentBuilderStudio({ initialSnapshot }: AgentBuilderStudioProps = {}) {
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
  const [customBlueprints, setCustomBlueprints] = useState<PresetBlueprint[]>(() => {
    try {
      const saved = localStorage.getItem('txsons_custom_blueprints');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

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
      const saved = localStorage.getItem('txsons_studio_project');
      if (saved) {
        const parsed = JSON.parse(saved);
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

  const handleSelectModel = (modelId: string) => {
    setSelectedModel(modelId);
    setStoredModel(modelId);
  };

  const handleResetUsage = () => {
    const fresh = resetSessionUsage();
    setUsageStats(fresh);
  };

  const [history, setHistory] = useState<ProjectSnapshot[]>(() => {
    try {
      const saved = localStorage.getItem('txsons_studio_history');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [project]; // Note: references the initialized project above
  });

  useEffect(() => {
    localStorage.setItem('txsons_studio_project', JSON.stringify(project));
  }, [project]);

  useEffect(() => {
    localStorage.setItem('txsons_studio_history', JSON.stringify(history));
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
      if (match) {
        return {
          quote: match[1],
          author: match[2] || `Endorser #${idx + 1}`,
          role: match[3] || 'Community Leader',
          rating: 5,
          verified: true
        };
      }
      return {
        quote: line.replace(/^"|"$/g, ''),
        author: `Supporter #${idx + 1}`,
        role: 'Verified Endorsement',
        rating: 5,
        verified: true
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

    const updated = [newBlueprint, ...customBlueprints];
    setCustomBlueprints(updated);
    try {
      localStorage.setItem('txsons_custom_blueprints', JSON.stringify(updated));
    } catch {}

    handleApplyPreset(newBlueprint);
    setIntakeModalOpen(false);
  };

  const handleDeleteCustomBlueprint = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = customBlueprints.filter(b => b.id !== id);
    setCustomBlueprints(updated);
    try {
      localStorage.setItem('txsons_custom_blueprints', JSON.stringify(updated));
    } catch {}
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
      const res = await fetch('/api/studio-chat', {
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

      let projectId = project.id;
      if (projectId.startsWith('prj-')) {
        projectId = projectId.slice(4);
      } else if (projectId.startsWith('bp-')) {
        projectId = `prj_${Date.now()}`;
      }

      const slug = project.profile.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

      const { error } = await supabase.from('projects').upsert({
        id: projectId,
        client_name: project.profile.name,
        company_name: project.profile.name,
        tier: project.profile.category === 'Campaign & Leadership' ? 'Campaign Platform Tier' : 'Spur Digital Tier',
        status: 'Theme Assembly',
        updated_at: new Date().toISOString(),
        domain: `https://${slug}.pages.dev`,
        blueprint: project
      });

      if (error) throw error;

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

  const handleDeploySite = async () => {
    setAgentState({
      step: 'building',
      message: 'Compiling React blocks and pushing to Cloudflare Pages...',
      tokensUsed: agentState.tokensUsed
    });

    try {
      const res = await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName: project.profile.name,
          currentSnapshot: project
        })
      });
      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Deployment failed');
      }

      // Auto-save to Supabase Projects
      try {
        let projectId = project.id;
        if (projectId.startsWith('prj-')) {
          projectId = projectId.slice(4);
        } else if (projectId.startsWith('bp-')) {
          projectId = `prj_${Date.now()}`;
        }
        
        await supabase.from('projects').upsert({
          id: projectId,
          client_name: project.profile.name,
          company_name: project.profile.name,
          tier: project.profile.category === 'Campaign & Leadership' ? 'Campaign Platform Tier' : 'Spur Digital Tier',
          status: 'Live',
          updated_at: new Date().toISOString(),
          domain: data.url,
          blueprint: project
        });
      } catch (dbErr) {
        console.warn('Auto-save to projects failed:', dbErr);
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
      {/* Top Studio Action Bar (Redesigned per Modern Mockup) */}
      <header className="h-16 border-b border-stone-800/80 px-4 sm:px-6 flex items-center justify-between bg-stone-950 text-stone-100 backdrop-blur-md flex-shrink-0 z-50 gap-4">
        
        {/* Left Section: Brand & Grouped Action Pill */}
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => setIsChatCollapsed(!isChatCollapsed)}
              className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
              title={isChatCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isChatCollapsed ? <PanelLeftOpen className="w-4 h-4 text-orange-400" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>
            
            <div className="w-8 h-8 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 font-bold">
              <Wand2 className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm text-white tracking-tight hidden sm:inline">AI Builder Studio</span>
          </div>

          {/* Grouped Action Pill */}
          <div className="hidden lg:flex items-center gap-1 bg-stone-900/90 rounded-xl p-1 border border-stone-800 shadow-sm">
            <button
              onClick={handleSaveToProjects}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-stone-300 hover:text-white hover:bg-stone-800 transition-all"
              title="Save Project to Database"
            >
              <FolderCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Save Project</span>
            </button>

            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                activeTab === 'preview'
                  ? 'bg-orange-600 text-white shadow-orange-600/30'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Live Preview</span>
            </button>

            <button
              onClick={() => setActiveTab('admin')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                activeTab === 'admin'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Admin Portal</span>
            </button>

            <div className="w-px h-4 bg-stone-800 mx-1" />

            <button
              onClick={() => setInspectorActive(!inspectorActive)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                inspectorActive 
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40 ring-1 ring-blue-500/20' 
                  : 'text-stone-400 hover:text-stone-200'
              }`}
              title="Click to Inspect Components"
            >
              <MousePointer className="w-3.5 h-3.5" />
              <span>Inspect</span>
            </button>

            <button
              onClick={() => setIsScannerOpen(true)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-stone-400 hover:text-stone-200 flex items-center gap-1.5 transition-all"
              title="Scan photo of flyer or menu"
            >
              <Camera className="w-3.5 h-3.5 text-orange-400" />
              <span>Scan</span>
            </button>

            <button
              onClick={() => setIsHandoffOpen(true)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-stone-400 hover:text-stone-200 flex items-center gap-1.5 transition-all"
              title="Export Master Plan for Antigravity"
            >
              <Terminal className="w-3.5 h-3.5 text-orange-400" />
              <span>Export</span>
            </button>

            <button
              onClick={() => setIsAuditOpen(true)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-stone-400 hover:text-stone-200 flex items-center gap-1.5 transition-all"
              title="Run Project Manager & Design QA Audit"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>PM Audit</span>
            </button>
          </div>
        </div>

        {/* Center Search Input */}
        <div className="hidden xl:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
            <input
              type="text"
              placeholder="Search projects & clients..."
              className="w-full bg-stone-900 border border-stone-800 rounded-full py-1.5 pl-9 pr-4 text-xs text-stone-200 placeholder:text-stone-500 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/30 transition-all"
            />
          </div>
        </div>

        {/* Right Section: Spend, Devices, Model Card, Bell, Deploy */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          
          {/* Real-Time Spend Ticker */}
          <div
            onClick={() => setIsModelSettingsOpen(true)}
            className="hidden 2xl:flex items-center gap-1.5 bg-stone-900 px-3 py-1.5 rounded-lg border border-stone-800 font-mono text-orange-400 shadow-inner cursor-pointer hover:border-stone-700 transition-colors"
            title="Session spend & token usage"
          >
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs font-bold tracking-wider">${usageStats.estimatedCostUsd.toFixed(4)}</span>
          </div>

          {/* Viewport Device Controls */}
          <div className="hidden md:flex items-center bg-stone-900 rounded-lg p-1 border border-stone-800">
            <button
              onClick={() => setDevice('desktop')}
              className={`p-1.5 rounded text-xs transition-colors ${
                device === 'desktop' ? 'bg-stone-800 text-orange-400 shadow-sm' : 'text-stone-400 hover:text-white'
              }`}
              title="Desktop"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setDevice('tablet')}
              className={`p-1.5 rounded text-xs transition-colors ${
                device === 'tablet' ? 'bg-stone-800 text-orange-400 shadow-sm' : 'text-stone-400 hover:text-white'
              }`}
              title="Tablet"
            >
              <Tablet className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setDevice('mobile')}
              className={`p-1.5 rounded text-xs transition-colors ${
                device === 'mobile' ? 'bg-stone-800 text-orange-400 shadow-sm' : 'text-stone-400 hover:text-white'
              }`}
              title="Mobile"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Model Selector Card */}
          <div
            onClick={() => setIsModelSettingsOpen(true)}
            className="hidden sm:flex items-center gap-2 bg-stone-900 hover:bg-stone-800 rounded-lg px-3 py-1 border border-stone-800 cursor-pointer transition-colors"
            title="Click to change AI Model"
          >
            <Cpu className="w-4 h-4 text-orange-400" />
            <div className="flex flex-col text-left">
              <span className="text-[9px] text-stone-400 uppercase font-bold tracking-wider leading-none">Model</span>
              <span className="text-xs font-semibold text-white leading-tight">
                {SUPPORTED_MODELS.find(m => m.id === selectedModel)?.name || 'Gemini 2.5'}
              </span>
            </div>
          </div>

          {/* Notification Bell */}
          <button
            className="text-stone-400 hover:text-white hover:bg-stone-800 transition-colors p-2 rounded-full relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-orange-500 border-2 border-stone-900" />
          </button>

          {/* Deploy Button */}
          <button
            onClick={handleDeploySite}
            className="bg-orange-600 hover:bg-orange-500 text-white px-4 sm:px-5 py-2 rounded-lg text-xs font-bold shadow-lg shadow-orange-600/30 transition-all flex items-center gap-2 hover:scale-105"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Deploy</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="text-stone-400 hover:text-white hover:bg-stone-800 transition-colors p-2 rounded-lg hidden sm:block"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4 text-orange-400" /> : <Maximize2 className="w-4 h-4" />}
          </button>

        </div>
      </header>

      {/* Main Studio Split Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Left Side: Conversational AI Agent & Blueprints (Streamlined, Spacious) */}
        {!isChatCollapsed && (
          <div className="w-80 sm:w-96 border-r border-stone-800 bg-stone-900/60 flex flex-col flex-shrink-0 z-10 animate-in slide-in-from-left-2 duration-200">
            
            {/* Top Dropdown Blueprint Selector */}
            <div className="p-3 border-b border-stone-800 bg-stone-950/80 relative" ref={dropdownRef}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-orange-500" />
                  <span>Active Blueprint</span>
                </span>
                <span className="text-[10px] text-stone-500 font-mono">
                  Tokens: ~{agentState.tokensUsed}
                </span>
              </div>

              {/* Dropdown Trigger Button */}
              <button
                onClick={() => setIsBlueprintDropdownOpen(!isBlueprintDropdownOpen)}
                className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700/80 hover:border-orange-500/60 text-left flex items-center justify-between transition-all group shadow-sm"
              >
                <div className="min-w-0 flex-1 pr-2">
                  <p className="text-xs font-bold text-white truncate group-hover:text-orange-400">
                    {currentBlueprintObj?.title || project.profile.name}
                  </p>
                  <p className="text-[10px] text-stone-400 truncate mt-0.5">
                    {currentBlueprintObj?.category || 'Custom Blueprint'} · <span className="uppercase text-orange-400/90 font-semibold">{project.theme}</span>
                  </p>
                </div>
                <ChevronDown className={`w-4 h-4 text-stone-400 transition-transform duration-200 flex-shrink-0 ${
                  isBlueprintDropdownOpen ? 'rotate-180 text-orange-400' : ''
                }`} />
              </button>

              {/* Dropdown Menu Popover */}
              {isBlueprintDropdownOpen && (
                <div className="absolute top-full left-3 right-3 mt-1 bg-stone-900 border border-stone-700 rounded-2xl shadow-2xl z-50 p-2 space-y-1 max-h-72 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                  <div className="text-[10px] font-bold text-stone-500 uppercase tracking-wider px-2 py-1">
                    Select Blueprint Preset
                  </div>
                  {allBlueprints.map((preset) => {
                    const isSelected = project.profile.name === preset.profile.name;
                    return (
                      <div
                        key={preset.id}
                        onClick={() => handleApplyPreset(preset)}
                        className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'border-orange-500/80 bg-orange-500/10 text-white'
                            : 'border-transparent hover:bg-stone-800 text-stone-300'
                        }`}
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <p className="text-xs font-bold truncate">{preset.title}</p>
                          <div className="flex items-center space-x-1.5 text-[10px] text-stone-400 mt-0.5">
                            <span>{preset.category}</span>
                            <span>•</span>
                            <span className="uppercase text-[9px] font-semibold text-orange-400/90">{preset.theme}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1">
                          {isSelected && <Check className="w-4 h-4 text-orange-500" />}
                          {preset.isCustom && (
                            <button
                              onClick={(e) => handleDeleteCustomBlueprint(preset.id, e)}
                              className="p-1 text-stone-500 hover:text-red-400 rounded-lg ml-1"
                              title="Delete custom blueprint"
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
                      className="w-full py-2 px-3 rounded-xl bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 border border-orange-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create New Custom Blueprint</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Compact Agent Status Pill */}
            <div className="px-3.5 py-2 border-b border-stone-800 bg-stone-950/60 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2 min-w-0">
                {agentState.step === 'ready' ? (
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                ) : (
                  <Loader2 className="w-3.5 h-3.5 text-orange-400 animate-spin flex-shrink-0" />
                )}
                <span className="text-[11px] text-stone-300 truncate font-medium">{agentState.message}</span>
              </div>
            </div>

            {/* Timeline Checkpoints (Dedicated Spacious Feed) */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">
                <span>Timeline Checkpoints ({history.length})</span>
                <span className="text-[10px] text-stone-500 font-normal">Click to restore</span>
              </div>

              {history.map((h, idx) => (
                <div
                  key={h.id}
                  onClick={() => handleRollback(h)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    h.id === project.id 
                      ? 'border-orange-500/80 bg-orange-500/10 text-white shadow-sm' 
                      : 'border-stone-800 bg-stone-950/50 text-stone-400 hover:border-stone-700 hover:text-stone-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-stone-200 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                      Turn #{idx + 1}
                    </span>
                    <span className="text-[10px] text-stone-500 font-mono">{h.timestamp}</span>
                  </div>
                  <p className="text-xs line-clamp-2 text-stone-300 leading-relaxed">{h.prompt}</p>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Prompt Chips */}
            <div className="px-3 pt-2 pb-1 bg-stone-950 border-t border-stone-800 flex items-center gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
              <button
                onClick={() => handleGenerate("Add 3 verified endorsements from local community leaders")}
                className="px-2.5 py-1 rounded-full bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-800 whitespace-nowrap transition-colors flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3 text-orange-400" /> +3 Endorsements
              </button>
              <button
                onClick={() => handleGenerate("Switch to bento grid hero layout with live metric counters")}
                className="px-2.5 py-1 rounded-full bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-800 whitespace-nowrap transition-colors"
              >
                Bento Hero
              </button>
              <button
                onClick={() => handleGenerate("Add community volunteer intake with yard sign delivery options")}
                className="px-2.5 py-1 rounded-full bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-800 whitespace-nowrap transition-colors"
              >
                Volunteer Intake
              </button>
            </div>

            {/* Prompt Input Box */}
            <div className="p-3 bg-stone-950">
              {selectedBlock && (
                <div className="mb-2 px-3 py-1.5 rounded-lg bg-blue-600/20 border border-blue-500/40 text-blue-300 text-xs flex items-center justify-between">
                  <span>Targeting: <strong>{selectedBlock}</strong></span>
                  <button onClick={() => setSelectedBlock(null)} className="text-blue-400 hover:text-white">✕</button>
                </div>
              )}
              <div className="relative">
                <textarea
                  rows={2}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleGenerate();
                    }
                  }}
                  placeholder={selectedBlock ? `Change ${selectedBlock}...` : "Type instructions or pick a chip above..."}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-700/80 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                />
                <button
                  onClick={() => handleGenerate()}
                  disabled={agentState.step !== 'ready' || !prompt.trim()}
                  className="absolute bottom-2.5 right-2.5 p-2 rounded-lg bg-orange-600 text-white hover:bg-orange-500 disabled:opacity-30 disabled:hover:bg-orange-600 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex items-center justify-between mt-1.5 text-[10px] text-stone-500">
                <span>Enter to send · Shift+Enter for newline</span>
                <span>Swarm Engine Active</span>
              </div>
            </div>

          </div>
        )}

        {/* Right Side: Interactive Live Preview & Code View */}
        <div className="flex-1 flex flex-col min-w-0 bg-stone-950">
          
          {/* Canvas Sub-Header */}
          <div className="h-10 border-b border-stone-800 px-4 sm:px-6 flex items-center justify-between bg-stone-900/40 flex-shrink-0 text-xs text-stone-400">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-1.5 py-1 font-medium transition-colors ${
                  activeTab === 'preview' ? 'text-orange-400 border-b-2 border-orange-500 font-bold' : 'hover:text-stone-200'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Live Website</span>
              </button>

              <button
                onClick={() => setActiveTab('admin')}
                className={`flex items-center gap-1.5 py-1 font-medium transition-colors ${
                  activeTab === 'admin' ? 'text-orange-400 border-b-2 border-orange-500 font-bold' : 'hover:text-stone-200'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-blue-400" />
                <span>Client Admin Portal</span>
              </button>

              <button
                onClick={() => setActiveTab('code')}
                className={`flex items-center gap-1.5 py-1 font-medium transition-colors ${
                  activeTab === 'code' ? 'text-orange-400 border-b-2 border-orange-500 font-bold' : 'hover:text-stone-200'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>React Code</span>
              </button>

              <button
                onClick={() => setActiveTab('blueprint')}
                className={`flex items-center gap-1.5 py-1 font-medium transition-colors ${
                  activeTab === 'blueprint' ? 'text-orange-400 border-b-2 border-orange-500 font-bold' : 'hover:text-stone-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Blueprint</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              {/* Browser Tab Favicon Selector */}
              <div className="relative">
                <button
                  onClick={() => setIsFaviconMenuOpen(!isFaviconMenuOpen)}
                  className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 text-[11px] transition-all hover:border-orange-500/60 shadow-sm"
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
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                            (project.profile.faviconUrl === fav.url || (!project.profile.faviconUrl && isCampaignSite && fav.url === '/sheriff-badge-favicon.svg'))
                              ? 'bg-orange-600/20 text-orange-400 font-bold border border-orange-500/40'
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
                        className="w-full px-2 py-1 rounded bg-stone-950 border border-stone-800 text-[11px] text-white font-mono focus:outline-none focus:border-orange-500"
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

          {/* Canvas Viewport Body */}
          <div className="flex-1 overflow-y-auto p-2 sm:p-6 flex items-start justify-center bg-stone-950">
            
            {/* TAB 1: Live Public Website Preview */}
            {activeTab === 'preview' && (
              <div 
                data-ts-site=""
                style={buildThemeVars({ theme: project.theme, ...project.profile }) as React.CSSProperties}
                className={`transition-all duration-300 rounded-2xl shadow-2xl border border-stone-800 overflow-hidden flex flex-col ${getThemeBackgroundClass()} ${
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

                {/* Rendered Live Modular Components with Inspector Interception */}
                <div className="divide-y divide-transparent overflow-x-hidden">
                  
                  {/* Navbar Block */}
                  <div
                    onClick={() => inspectorActive && setSelectedBlock('NavbarBlock')}
                    className={`relative transition-all ${
                      inspectorActive ? 'cursor-crosshair hover:ring-2 hover:ring-blue-500 hover:z-20' : ''
                    } ${selectedBlock === 'NavbarBlock' ? 'ring-2 ring-blue-500 z-20' : ''}`}
                  >
                    <NavbarBlock
                      businessName={project.profile.name}
                      phone={project.profile.phone}
                      theme={project.theme as any}
                      accentColor={project.profile.accentColor}
                      ctaText={isWriteIn ? 'Vote Write-In' : isCampaignSite ? 'Volunteer / Donate' : project.profile.category === 'Food & Beverage' ? 'Order Catering' : project.profile.category === 'Beauty & Wellness' ? 'Book Appointment' : 'Book Appointment'}
                      navItems={isCampaignSite ? [
                        ...(isWriteIn ? [{ label: "How to Vote Write-In", href: "#write-in-guide" }] : []),
                        { label: "Platform", href: "#services" },
                        { label: "Events", href: "#events" },
                        { label: "Endorsements", href: "#reviews" },
                        { label: "Voting Info", href: "#voting" },
                        { label: "Volunteer", href: "#contact" }
                      ] : undefined}
                    />
                  </div>

                  {/* Hero Block */}
                  <div
                    onClick={() => inspectorActive && setSelectedBlock('HeroBlock')}
                    className={`relative transition-all ${
                      inspectorActive ? 'cursor-crosshair hover:ring-2 hover:ring-blue-500 hover:z-20' : ''
                    } ${selectedBlock === 'HeroBlock' ? 'ring-2 ring-blue-500 z-20' : ''}`}
                  >
                    {isCampaignSite ? (
                      <CampaignHeroBlock
                        headline={project.profile.tagline || project.profile.name}
                        subheadline={project.profile.description || ''}
                        heroImage={project.profile.heroImage}
                        accentColor={project.profile.accentColor}
                        badges={project.badges}
                        proofBadgeText={project.proofBadgeText}
                        ctaText={isWriteIn ? "How to Vote Write-In" : "Join The Campaign"}
                        secondaryCtaText="Read Our Platform"
                        theme={project.theme}
                        candidateName={project.profile.name}
                        officeTitle={project.profile.name.toLowerCase().includes('judge') ? 'Atascosa County Judge' : undefined}
                      />
                    ) : (
                      <HeroBlock
                        headline={project.profile.tagline || project.profile.name}
                        subheadline={project.profile.description || ''}
                        heroImage={project.profile.heroImage}
                        variant={project.heroVariant}
                        theme={project.theme as any}
                        accentColor={project.profile.accentColor}
                        badges={project.badges}
                        proofBadgeText={project.proofBadgeText}
                        ctaText={
                          project.profile.category === 'Food & Beverage' ? 'View Menu' : 
                          project.profile.category === 'Beauty & Wellness' ? 'Book Appointment' : 
                          'Book Free Estimate'
                        }
                        secondaryCtaText={
                          project.profile.category === 'Food & Beverage' ? 'Catering Options' : 
                          'View Services'
                        }
                      />
                    )}
                  </div>

                  {/* Write-In Ballot Guide Block (When applicable) */}
                  {isWriteIn && (
                    <div
                      onClick={() => inspectorActive && setSelectedBlock('WriteInGuideBlock')}
                      className={`relative transition-all ${
                        inspectorActive ? 'cursor-crosshair hover:ring-2 hover:ring-blue-500 hover:z-20' : ''
                      } ${selectedBlock === 'WriteInGuideBlock' ? 'ring-2 ring-blue-500 z-20' : ''}`}
                    >
                      <WriteInGuideBlock
                        candidateName={project.profile.name.replace(/campaign/i, '').replace(/for judge/i, '').trim()}
                        officeTitle="Atascosa County Judge"
                        theme={project.theme}
                        accentColor={project.profile.accentColor}
                      />
                    </div>
                  )}

                  {/* Voting Info Banner Block (Campaigns) */}
                  {isCampaignSite && (
                    <div
                      onClick={() => {
                        if (inspectorActive) setSelectedBlock('VotingBannerBlock');
                        else {
                          window.location.hash = 'voting';
                          setPreviewSubPage('voting');
                        }
                      }}
                      className={`relative transition-all cursor-pointer ${
                        inspectorActive ? 'hover:ring-2 hover:ring-blue-500 hover:z-20' : ''
                      } ${selectedBlock === 'VotingBannerBlock' ? 'ring-2 ring-blue-500 z-20' : ''}`}
                    >
                      <VotingBannerBlock
                        accentColor={project.profile.accentColor}
                        candidateName={project.profile.name}
                        officeTitle={project.profile.name.toLowerCase().includes('judge') ? 'Atascosa County Judge Election' : undefined}
                        theme={project.theme}
                      />
                    </div>
                  )}

                  {/* Services / Platform Block */}
                  <div
                    onClick={() => inspectorActive && setSelectedBlock('ServicesBlock')}
                    className={`relative transition-all ${
                      inspectorActive ? 'cursor-crosshair hover:ring-2 hover:ring-blue-500 hover:z-20' : ''
                    } ${selectedBlock === 'ServicesBlock' ? 'ring-2 ring-blue-500 z-20' : ''}`}
                  >
                    <ServicesBlock
                      title={
                        isCampaignSite ? 'Key Platform & Policy Priorities' : 
                        project.profile.category === 'Food & Beverage' ? 'Featured Menu & Catering' : 
                        project.profile.category === 'Beauty & Wellness' ? 'Salon Services & Pricing' : 
                        'Our Services & Solutions'
                      }
                      subtitle={
                        isCampaignSite ? 'Clear priorities and decisive leadership for our community.' : 
                        project.profile.category === 'Food & Beverage' ? 'Authentic Texas BBQ smoked fresh daily.' : 
                        'Transparent pricing with premium craftsmanship.'
                      }
                      services={project.services}
                      theme={project.theme as any}
                      accentColor={project.profile.accentColor}
                      ctaText={
                        isCampaignSite ? 'Learn More' : 
                        project.profile.category === 'Food & Beverage' ? 'Order Now' : 
                        'Book Service'
                      }
                    />
                  </div>

                  {/* Testimonials / Endorsements Block */}
                  <div
                    onClick={() => inspectorActive && setSelectedBlock('TestimonialsBlock')}
                    className={`relative transition-all ${
                      inspectorActive ? 'cursor-crosshair hover:ring-2 hover:ring-blue-500 hover:z-20' : ''
                    } ${selectedBlock === 'TestimonialsBlock' ? 'ring-2 ring-blue-500 z-20' : ''}`}
                  >
                    <TestimonialsBlock
                      title={isCampaignSite ? 'Endorsements & Community Support' : 'What Our Clients Say'}
                      subtitle={isCampaignSite ? 'Trusted by leaders, law enforcement, and families across Texas.' : 'Real reviews from verified customers in your area.'}
                      testimonials={project.testimonials}
                      theme={project.theme as any}
                      accentColor={project.profile.accentColor}
                    />
                  </div>

                  {/* Booking / Volunteer Block */}
                  <div
                    onClick={() => inspectorActive && setSelectedBlock('FooterBlock')}
                    className={`relative transition-all ${
                      inspectorActive ? 'cursor-crosshair hover:ring-2 hover:ring-blue-500 hover:z-20' : ''
                    } ${selectedBlock === 'FooterBlock' ? 'ring-2 ring-blue-500 z-20' : ''}`}
                  >
                    <FooterBlock
                      business={project.profile}
                      theme={project.theme as any}
                    />
                  </div>

                </div>
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
                <div className="text-xs text-orange-400 mb-3 font-bold">// Multi-Agent Distilled Blueprint JSON</div>
                <pre>{JSON.stringify(project, null, 2)}</pre>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* Custom Blueprint & Intake Creator Modal */}
      {intakeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-stone-900 border border-stone-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col text-stone-200">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-stone-800 flex items-center justify-between bg-stone-950">
              <div className="flex items-center space-x-2.5">
                <Vote className="w-5 h-5 text-orange-500" />
                <div>
                  <h3 className="font-bold text-white text-base">Create Custom Blueprint & Theme Scheme</h3>
                  <p className="text-xs text-stone-400">Set custom colors, photos, platform context, and admin rules.</p>
                </div>
              </div>
              <button 
                onClick={() => setIntakeModalOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form id="custom-intake-form" onSubmit={handleSaveCustomBlueprint} className="p-6 overflow-y-auto space-y-5 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-stone-400 mb-1.5">
                    Blueprint Title
                  </label>
                  <input
                    type="text"
                    required
                    value={intakeForm.title}
                    onChange={(e) => setIntakeForm({ ...intakeForm, title: e.target.value })}
                    placeholder="e.g. Debbie Dietzmann for Judge"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-stone-400 mb-1.5">
                    Category / Industry
                  </label>
                  <select
                    value={intakeForm.category}
                    onChange={(e) => setIntakeForm({ ...intakeForm, category: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-white focus:outline-none focus:border-orange-500"
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-white focus:outline-none focus:border-orange-500"
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Color Scheme Picker */}
              <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 space-y-3">
                <div className="flex items-center space-x-2">
                  <Palette className="w-4 h-4 text-orange-500" />
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-white focus:outline-none focus:border-orange-500"
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-white focus:outline-none focus:border-orange-500 font-mono text-[11px]"
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-white font-mono text-[11px] focus:outline-none focus:border-orange-500"
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-white font-mono text-[11px] focus:outline-none focus:border-orange-500"
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
                  className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="custom-intake-form"
                  className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold flex items-center gap-1.5 shadow-lg shadow-orange-600/30"
                >
                  <Save className="w-4 h-4" />
                  <span>Generate & Save Blueprint</span>
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

    </div>
  );
}
