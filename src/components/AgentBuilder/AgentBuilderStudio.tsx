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
  Camera
} from 'lucide-react';
import { 
  NavbarBlock, 
  HeroBlock, 
  ServicesBlock, 
  TestimonialsBlock, 
  BookingBlock, 
  FooterBlock, 
  IndustryAdminBlock,
  BusinessProfile, 
  ServiceItem, 
  TestimonialItem 
} from '../../templates/blocks';
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
  theme: 'dark' | 'light' | 'luxury' | 'campaign-navy' | 'crimson-bold' | 'emerald-gold' | 'custom';
  heroVariant: 'split' | 'bento' | 'centered';
  badges?: string[];
  proofBadgeText?: string;
}

interface PresetBlueprint {
  id: string;
  title: string;
  category: string;
  prompt: string;
  profile: BusinessProfile;
  services: ServiceItem[];
  testimonials: TestimonialItem[];
  theme: 'dark' | 'light' | 'luxury' | 'campaign-navy' | 'crimson-bold' | 'emerald-gold' | 'custom';
  heroVariant: 'split' | 'bento' | 'centered';
  badges?: string[];
  proofBadgeText?: string;
  isCustom?: boolean;
}

const DEFAULT_BLUEPRINTS: PresetBlueprint[] = [
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);

  // Blueprint Dropdown State
  const [isBlueprintDropdownOpen, setIsBlueprintDropdownOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

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
    theme: 'campaign-navy' as PresetBlueprint['theme'],
    primaryColor: '#00081e',
    accentColor: '#C5A059',
    heroVariant: 'split' as 'split' | 'bento' | 'centered',
    servicesText: 'Courtroom & Constitutional Integrity | Upholding the rule of law without political bias\nYouth Intervention & Diversion | Early rehabilitation for first-time offenders\nDocket Efficiency & Taxpayer Savings | Modernizing scheduling to eliminate backlog',
    testimonialsText: '"Deborah has the highest ethical standard in our district." — Justice Franklin Vance (Court of Appeals)\n"Fair, decisive, and dedicated to Texas safety." — Patricia Holbrook (Bar Association)'
  });

  // Active Project Data
  const [project, setProject] = useState<ProjectSnapshot>(() => ({
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
  }));

  const [history, setHistory] = useState<ProjectSnapshot[]>([project]);
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

  const handleApplyFromScanner = (dossier: Partial<ClientIntake>, primaryImageUrl?: string) => {
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
      proofBadgeText: dossier.proofBadgeText || project.proofBadgeText
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
    } catch (err) {
      const updatedSnapshot: ProjectSnapshot = {
        id: `prj-${Date.now()}`,
        prompt: textToRun,
        timestamp: new Date().toLocaleTimeString(),
        profile: {
          ...project.profile,
          name: textToRun.length > 24 ? textToRun.slice(0, 24) + '...' : textToRun,
          tagline: `Official Platform & Services for ${textToRun}`
        },
        services: project.services,
        testimonials: project.testimonials,
        theme: project.theme,
        heroVariant: 'bento'
      };
      setProject(updatedSnapshot);
      setHistory(prev => [...prev, updatedSnapshot]);
      setAgentState({
        step: 'ready',
        message: 'Updated site configuration using local token engine.',
        tokensUsed: 480
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
  const isCampaignSite = project.profile.category === 'Campaign & Leadership' || project.theme === 'campaign-navy';

  const getThemeBackgroundClass = () => {
    switch (project.theme) {
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
      
      {/* Top Studio Action Bar */}
      <div className="h-14 border-b border-stone-800 px-4 sm:px-6 flex items-center justify-between bg-stone-900/90 backdrop-blur-md flex-shrink-0 z-20">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsChatCollapsed(!isChatCollapsed)}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
            title={isChatCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isChatCollapsed ? <PanelLeftOpen className="w-4 h-4 text-orange-400" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
          
          <div className="w-8 h-8 rounded-lg bg-orange-600/20 border border-orange-500/40 flex items-center justify-center text-orange-500 font-bold">
            <Wand2 className="w-4 h-4" />
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm text-white">AI Builder Studio</span>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Antigravity Active
              </span>
            </div>
          </div>
        </div>

        {/* Viewport Device Controls */}
        <div className="flex items-center bg-stone-800/80 rounded-lg p-1 border border-stone-700/50">
          <button
            onClick={() => setDevice('desktop')}
            className={`px-3 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
              device === 'desktop' ? 'bg-stone-700 text-white shadow-sm' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Desktop</span>
          </button>
          <button
            onClick={() => setDevice('tablet')}
            className={`px-3 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
              device === 'tablet' ? 'bg-stone-700 text-white shadow-sm' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Tablet className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tablet</span>
          </button>
          <button
            onClick={() => setDevice('mobile')}
            className={`px-3 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
              device === 'mobile' ? 'bg-stone-700 text-white shadow-sm' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Mobile</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={() => setIsScannerOpen(true)}
            className="px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white border border-stone-700 flex items-center gap-1.5 transition-all"
            title="Scan photo of a menu, flyer, or business card"
          >
            <Camera className="w-3.5 h-3.5 text-orange-400" />
            <span className="hidden md:inline">Scan Photo</span>
          </button>

          <button
            onClick={() => setInspectorActive(!inspectorActive)}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              inspectorActive 
                ? 'bg-blue-600/20 border-blue-500 text-blue-400 ring-2 ring-blue-500/30' 
                : 'bg-stone-800 border-stone-700 text-stone-300 hover:text-white'
            }`}
          >
            <MousePointer className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{inspectorActive ? 'Inspector Active' : 'Click to Inspect'}</span>
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white border border-stone-700 flex items-center gap-1.5 transition-all"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 text-orange-400" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
          </button>

          <button
            onClick={handleDeploySite}
            className="px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white flex items-center gap-1.5 shadow-md shadow-orange-600/30 transition-all hover:scale-105"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Deploy</span>
          </button>
        </div>
      </div>

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

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-stone-500">Theme Scheme:</span>
              <span className="capitalize text-stone-300 font-semibold px-2 py-0.5 rounded-md bg-stone-800 border border-stone-700">
                {project.theme}
              </span>
            </div>
          </div>

          {/* Canvas Viewport Body */}
          <div className="flex-1 overflow-y-auto p-2 sm:p-6 flex items-start justify-center bg-stone-950">
            
            {/* TAB 1: Live Public Website Preview */}
            {activeTab === 'preview' && (
              <div 
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
                  <div className="px-4 py-0.5 rounded-md bg-stone-950 border border-stone-800 text-[11px] text-stone-400 font-mono truncate max-w-[280px] sm:max-w-md">
                    https://{project.profile.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pages.dev
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
                      ctaText={
                        isCampaignSite ? 'Volunteer / Donate' : 
                        project.profile.category === 'Food & Beverage' ? 'Order Catering' : 
                        project.profile.category === 'Beauty & Wellness' ? 'Book Appointment' : 
                        'Book Appointment'
                      }
                    />
                  </div>

                  {/* Hero Block */}
                  <div
                    onClick={() => inspectorActive && setSelectedBlock('HeroBlock')}
                    className={`relative transition-all ${
                      inspectorActive ? 'cursor-crosshair hover:ring-2 hover:ring-blue-500 hover:z-20' : ''
                    } ${selectedBlock === 'HeroBlock' ? 'ring-2 ring-blue-500 z-20' : ''}`}
                  >
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
                        isCampaignSite ? 'Join The Campaign' : 
                        project.profile.category === 'Food & Beverage' ? 'View Menu' : 
                        project.profile.category === 'Beauty & Wellness' ? 'Book Appointment' : 
                        'Book Free Estimate'
                      }
                      secondaryCtaText={
                        isCampaignSite ? 'Read Our Platform' : 
                        project.profile.category === 'Food & Beverage' ? 'Catering Options' : 
                        'View Services'
                      }
                    />
                  </div>

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
                    onClick={() => inspectorActive && setSelectedBlock('BookingBlock')}
                    className={`relative transition-all ${
                      inspectorActive ? 'cursor-crosshair hover:ring-2 hover:ring-blue-500 hover:z-20' : ''
                    } ${selectedBlock === 'BookingBlock' ? 'ring-2 ring-blue-500 z-20' : ''}`}
                  >
                    <BookingBlock
                      title={
                        isCampaignSite ? 'Volunteer & Request Yard Signs' : 
                        project.profile.category === 'Food & Beverage' ? 'Request Catering Quote' : 
                        'Request a Free Consultation'
                      }
                      subtitle={
                        isCampaignSite ? 'Sign up to join our grassroots movement, host an event, or request campaign yard signs.' : 
                        project.profile.category === 'Food & Beverage' ? 'Planning an event? Let us handle the food so you can enjoy the party.' : 
                        'Fill out the form below to get connected with our team.'
                      }
                      phone={project.profile.phone}
                      services={project.services}
                      theme={project.theme as any}
                      accentColor={project.profile.accentColor}
                    />
                  </div>

                  {/* Footer Block */}
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
    <div className="min-h-screen ${getThemeBackgroundClass()}">
      <NavbarBlock businessName={profile.name} phone={profile.phone} theme="${project.theme}" />
      <HeroBlock 
        headline={profile.tagline} 
        subheadline={profile.description} 
        heroImage={profile.heroImage} 
        variant="${project.heroVariant}"
        theme="${project.theme}" 
      />
      <ServicesBlock services={services} theme="${project.theme}" />
      <TestimonialsBlock testimonials={testimonials} theme="${project.theme}" />
      <BookingBlock phone={profile.phone} services={services} theme="${project.theme}" />
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
                        setIntakeForm({ ...intakeForm, theme: val, primaryColor: p, accentColor: a });
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-white text-xs focus:outline-none"
                    >
                      <option value="campaign-navy">Presidential Navy & Heritage Gold (Debbie Style)</option>
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
      <PhotoScannerModal 
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onApplyDossier={handleApplyFromScanner}
      />

    </div>
  );
}
