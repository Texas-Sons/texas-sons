import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Wand2, 
  Receipt, 
  Share2, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  Copy, 
  Check, 
  ExternalLink, 
  Phone, 
  Mail, 
  MapPin, 
  Globe, 
  ChevronRight, 
  FileText, 
  X,
  Vote,
  Utensils,
  Sparkle,
  Wrench,
  Stethoscope,
  Briefcase,
  Camera,
  Upload,
  Palette,
  Image as ImageIcon
} from 'lucide-react';
import { ClientIntake, IntakeStatus, Tier } from '../../types';
import PhotoScannerModal from '../PhotoScannerModal';
import { supabase } from '../../supabase';
import { extractPaletteFromImage, ExtractedColorPalette } from '../../utils/colorExtractor';

interface ClientIntakeViewProps {
  onLaunchStudio: (client: ClientIntake) => void;
  onInvoiceClient: (client: ClientIntake) => void;
  intakePrefill?: Partial<ClientIntake>;
}

const DEFAULT_SAMPLE_CLIENTS: ClientIntake[] = [
  {
    id: 'intake-waylon-rogers',
    businessName: 'Waylon Rogers for County Judge',
    clientContact: 'Waylon Rogers (Campaign Mgr: Sarah Jenkins)',
    email: 'campaign@waylonrogers.com',
    phone: '(830) 555-1234',
    address: 'Campaign HQ: 104 N Smith St, Jourdanton, TX 78026',
    domain: 'waylonrogers.com',
    category: 'Campaign & Leadership',
    tier: 'Full Custom Application',
    status: 'Studio Ready',
    theme: 'campaign-judicial',
    primaryColor: '#0a1f44',
    accentColor: '#C5A059',
    tagline: 'A Lifetime of Service. A Commitment to Justice.',
    description: 'Official Write-In Candidate for Atascosa County Judge. Restoring judicial integrity, protecting rural property owners, and bringing transparent fiscal stewardship to county government.',
    heroImage: '/images/candidates/waylon-rogers.png',
    badges: ['Official Write-In Candidate', 'Judicial Integrity', 'Rural Property Advocate', 'Fiscal Responsibility'],
    proofBadgeText: 'Write-In Waylon Rogers for County Judge · Atascosa County',
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
    depositAmount: 3500,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'intake-debbie-judge',
    businessName: 'Deborah Dietzmann for Judge',
    clientContact: 'Debbie Dietzmann (Campaign Mgr: Sarah)',
    email: 'campaign@debbieforjudge.com',
    phone: '(512) 555-0194',
    address: 'Campaign HQ: 701 Brazos St, Suite 500, Austin, TX',
    domain: 'debbieforjudge.com',
    category: 'Campaign & Leadership',
    tier: 'Full Custom Application',
    status: 'Studio Ready',
    theme: 'campaign-navy',
    primaryColor: '#00081e',
    accentColor: '#C5A059',
    tagline: 'Courtroom Integrity. Constitutional Defense. Proven Leadership.',
    description: 'Over 28 years of courtroom trial experience, dedicated to upholding the Constitution, protecting Texas families, and delivering efficient, impartial justice.',
    heroImage: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=1200',
    badges: ['28+ Years Trial Experience', 'Endorsed by Law Enforcement', 'Preserving the Constitution', 'Lifelong Texan'],
    proofBadgeText: 'Official 2026 Endorsements · Texas Bar Association Verified',
    services: [
      { title: 'Courtroom & Constitutional Integrity', description: 'Upholding the rule of law without political bias or judicial activism.', duration: 'Key Platform', highlight: true },
      { title: 'Youth Intervention & Diversion', description: 'Early intervention programs to break criminal cycles and rehabilitate youth.', duration: 'Community Priority' },
      { title: 'Docket Efficiency & Taxpayer Savings', description: 'Modernizing case management to eliminate backlog and save county funds.', duration: 'Fiscal Policy' }
    ],
    testimonials: [
      { quote: 'Deborah has the highest ethical standards and sharpest legal mind in our district.', author: 'Justice Franklin Vance', role: 'Texas Court of Appeals (Ret.)', rating: 5, verified: true },
      { quote: 'Fair, decisive, and dedicated to the safety of our neighborhoods and families.', author: 'Sheriff Hector Ramirez', role: 'County Law Enforcement Coalition', rating: 5, verified: true }
    ],
    depositAmount: 3750,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'intake-rustic-smokehouse',
    businessName: 'The Rustic Oak Smokehouse',
    clientContact: 'Cody & Tyler Miller',
    email: 'catering@rusticoakbbq.com',
    phone: '(512) 555-SMOKE',
    address: '1402 E 7th St, Austin, TX 78702',
    domain: 'rusticoakbbq.com',
    category: 'Food & Beverage',
    tier: 'Lead Generation Site',
    status: 'Deposit Paid',
    theme: 'crimson-bold',
    primaryColor: '#1c1917',
    accentColor: '#dc2626',
    tagline: '16-Hour Post Oak Pit Barbecue & Hill Country Catering',
    description: 'Authentic Central Texas barbecue smoked low and slow over native post oak logs. Family recipes, homemade sausage, and full-service event catering across Travis County.',
    heroImage: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&q=80&w=1200',
    badges: ['16-Hour Post Oak Smoked', 'Central Texas Heritage', 'Family Owned & Operated', 'Full Smoker Rig Catering'],
    proofBadgeText: 'Top 50 Texas BBQ Pick · Reader Favorite',
    services: [
      { title: 'Full-Service Pit BBQ Catering', description: 'On-site post oak smoker catering for weddings, corporate galas, and private events with custom carving stations.', price: 'From $24/plate', highlight: true },
      { title: 'Custom Meat Market & Bulk Orders', description: 'Vacuum-sealed whole prime briskets, smoked beef ribs, and jalapeño cheddar links shipped hot or chilled.', price: 'Priced per lb' },
      { title: 'Hill Country Event Venue Booking', description: 'Private covered beer garden and live acoustic music stage rental for parties of 50 to 300 guests.', price: 'Custom Quote' }
    ],
    testimonials: [
      { quote: 'The bark on their prime brisket is legendary. Best catering experience in Central Texas!', author: 'Marcus Sterling', role: 'Corporate Event Planner', rating: 5, verified: true },
      { quote: 'We drive an hour just for their brisket and jalapeño links. Bring cash for the peach cobbler — it sells out fast.', author: "Dwayne 'Smokey' Harrell", role: 'Texas Monthly Reader Pick', rating: 5, verified: true }
    ],
    depositAmount: 1750,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'intake-aura-salon',
    businessName: 'Aura Luxury Salon & Spa',
    clientContact: 'Genevieve Laurent',
    email: 'concierge@aurasalonspa.com',
    phone: '(512) 555-GLAM',
    address: '2200 S Congress Ave, Austin, TX',
    domain: 'aurasalonspa.com',
    category: 'Beauty & Wellness',
    tier: 'Full Custom Application',
    status: 'Assets Pending',
    theme: 'luxury',
    primaryColor: '#0c0a09',
    accentColor: '#d97706',
    tagline: 'Haute Coiffure, Bespoke Color, and Editorial Botanical Spa',
    description: 'An oasis of serene French-Texan luxury on South Congress. Specializing in bespoke balayage, organic scalp rituals, and bridal couture styling.',
    heroImage: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=1200',
    badges: ['Master Colorists', 'Organic Botanical Products', 'Beverly Hills Trained', 'Private Suite Booking'],
    proofBadgeText: '4.9 Stars (240+ Verified Reviews)',
    services: [
      { title: 'Couture Balayage & Gloss', description: 'Hand-painted sun-kissed dimension with organic bond-building glaze and custom toner.', price: 'From $285', duration: '3.5 hrs', highlight: true },
      { title: 'Botanical Hair & Scalp Therapy', description: 'Multi-step Japanese head spa with cedarwood steam, scalp exfoliation, and deep peptide infusion.', price: 'From $175', duration: '75 min' },
      { title: 'Bridal & Editorial VIP Suite', description: 'Private champagne studio booking with complete hair, airbrush makeup, and preview trials.', price: 'From $550', duration: '4.0 hrs' }
    ],
    testimonials: [
      { quote: 'Genevieve is a genius with color. My blonde has never looked healthier or more radiant.', author: 'Julianna Vance', role: 'Vogue Contributing Stylist', rating: 5, verified: true }
    ],
    depositAmount: 3750,
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const PRESET_TEMPLATES = [
  {
    name: 'Political Campaign (Debbie Archetype)',
    category: 'Campaign & Leadership' as const,
    theme: 'campaign-navy' as const,
    primaryColor: '#00081e',
    accentColor: '#C5A059',
    badges: ['25+ Years Public Service', 'Endorsed by Law Enforcement', 'Defending the Constitution', 'Lifelong Texan'],
    proofBadgeText: 'Official 2026 Endorsements · Bar Association Verified',
    tagline: 'Proven Leadership. Dedicated Service. Protecting Texas Families.',
    description: 'Decisive constitutional leadership, courtroom excellence, and dedicated community service for our county.',
    services: [
      { title: 'Constitutional & Courtroom Integrity', description: 'Upholding equal justice under the law without political influence.', duration: 'Core Platform', highlight: true },
      { title: 'Community Safety & Law Enforcement Support', description: 'Strengthening neighborhood safety and supporting first responders.', duration: 'Priority #1' },
      { title: 'Fiscal Stewardship & Transparency', description: 'Eliminating wasteful spending and modernizing administrative dockets.', duration: 'Fiscal Policy' }
    ]
  },
  {
    name: 'Texas BBQ & Restaurant',
    category: 'Food & Beverage' as const,
    theme: 'crimson-bold' as const,
    primaryColor: '#1c1917',
    accentColor: '#dc2626',
    badges: ['16-Hour Post Oak Smoked', 'Central Texas Heritage', 'Family Owned & Operated', 'Full Catering Rig'],
    proofBadgeText: 'Top 50 Texas BBQ Pick · Reader Favorite',
    tagline: 'Authentic Post Oak Pit Barbecue & Hill Country Catering',
    description: 'Central Texas pit barbecue smoked low and slow over native post oak logs with time-honored family recipes.',
    services: [
      { title: 'Full-Service Pit BBQ Catering', description: 'On-site carving stations and custom sides for corporate events and weddings.', price: 'From $24/plate', highlight: true },
      { title: 'Bulk Party Packs & Smoked Meats', description: 'Freshly smoked prime brisket, ribs, and house sausage vacuum-sealed hot.', price: 'By the Pound' }
    ]
  },
  {
    name: 'Luxury Salon & Editorial Spa',
    category: 'Beauty & Wellness' as const,
    theme: 'luxury' as const,
    primaryColor: '#0c0a09',
    accentColor: '#d97706',
    badges: ['Master Colorists', 'Organic Botanical Products', 'Beverly Hills Trained', 'Private Suite Booking'],
    proofBadgeText: '4.9 Stars (250+ Verified Reviews)',
    tagline: 'Haute Coiffure, Bespoke Color, and Editorial Botanical Spa',
    description: 'An oasis of serene luxury offering bespoke hair artistry, couture coloring, and holistic scalp wellness.',
    services: [
      { title: 'Couture Balayage & Glaze', description: 'Custom hand-painted multidimensional color with luxury bond repairing treatment.', price: 'From $285', duration: '3.5 hrs', highlight: true },
      { title: 'Japanese Botanical Scalp Spa', description: 'Deep exfoliating steam ritual with essential oils and pressure point massage.', price: 'From $175', duration: '75 min' }
    ]
  },
  {
    name: 'Home & Trade Contractor (Roofing/HVAC)',
    category: 'Home & Trade Services' as const,
    theme: 'dark' as const,
    primaryColor: '#0f172a',
    accentColor: '#f97316',
    badges: ['Licensed & Insured', '24/7 Emergency Dispatch', '10-Year Labor Warranty', 'BBB A+ Rated'],
    proofBadgeText: '4.9 Star Rated · 500+ Texas Homes Serviced',
    tagline: 'Master Craftsmanship. Honest Pricing. Rapid Response.',
    description: 'Texas licensed specialists providing fast, guaranteed repair, replacement, and emergency maintenance.',
    services: [
      { title: 'Complete System Replacement', description: 'High-efficiency installation with 10-year comprehensive warranty and instant financing.', price: 'Free Estimate', highlight: true },
      { title: '24/7 Diagnostic & Precision Repair', description: 'Prompt dispatch with fully stocked trucks to diagnose and fix on the first visit.', price: '$89 Service Fee' }
    ]
  }
];

export default function ClientIntakeView({ onLaunchStudio, onInvoiceClient, intakePrefill }: ClientIntakeViewProps) {
  const [clients, setClients] = useState<ClientIntake[]>(() => {
    try {
      const saved = localStorage.getItem('txsons_client_intakes');
      return saved ? JSON.parse(saved) : DEFAULT_SAMPLE_CLIENTS;
    } catch {
      return DEFAULT_SAMPLE_CLIENTS;
    }
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Modals
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientIntake | null>(null);
  const [shareModalClient, setShareModalClient] = useState<ClientIntake | null>(null);
  const [copiedType, setCopiedType] = useState<string | null>(null);

  // Form State
  const [form, setForm] = useState<Partial<ClientIntake>>({
    businessName: '',
    clientContact: '',
    email: '',
    phone: '',
    address: '',
    domain: '',
    category: 'Campaign & Leadership',
    tier: 'Lead Generation Site',
    status: 'New Intake',
    theme: 'campaign-navy',
    primaryColor: '#00081e',
    accentColor: '#C5A059',
    tagline: '',
    description: '',
    heroImage: '',
    badges: ['25+ Years Experience', 'Satisfaction Guaranteed', 'Locally Owned'],
    proofBadgeText: 'Top Rated · 100% Guaranteed',
    services: [
      { title: 'Primary Offering', description: 'Comprehensive premium service tailored for your specific needs.', price: 'Custom Quote', highlight: true }
    ],
    testimonials: [
      { quote: 'Exceptional service and unmatched attention to detail.', author: 'Verified Client', role: 'Austin, TX', rating: 5, verified: true }
    ]
  });

  const [photoPalette, setPhotoPalette] = useState<ExtractedColorPalette | null>(null);

  // Extract real dominant color palette whenever client photo is uploaded/changed
  useEffect(() => {
    if (form.heroImage && (form.heroImage.startsWith('data:image') || form.heroImage.startsWith('http'))) {
      extractPaletteFromImage(form.heroImage).then(palette => {
        setPhotoPalette(palette);
        // Automatically sync accent color from photo
        if (palette.accentColor) {
          setForm(prev => ({
            ...prev,
            accentColor: palette.accentColor,
            primaryColor: palette.primaryBg,
            theme: palette.themeRecommendation || prev.theme
          }));
        }
      });
    } else {
      setPhotoPalette(null);
    }
  }, [form.heroImage]);

  useEffect(() => {
    if (intakePrefill && Object.keys(intakePrefill).length > 0) {
      setForm(prev => ({ ...prev, ...intakePrefill }));
      setIsNewModalOpen(true);
    }
  }, [intakePrefill]);

  useEffect(() => {
    try {
      localStorage.setItem('txsons_client_intakes', JSON.stringify(clients));
    } catch (e) {
      console.error('Failed to save client intakes', e);
    }
  }, [clients]);

  const handleOpenNewModal = (preset?: typeof PRESET_TEMPLATES[0]) => {
    if (preset) {
      setForm({
        businessName: '',
        clientContact: '',
        email: '',
        phone: '',
        address: '',
        domain: '',
        category: preset.category,
        tier: 'Lead Generation Site',
        status: 'New Intake',
        theme: preset.theme,
        primaryColor: preset.primaryColor,
        accentColor: preset.accentColor,
        tagline: preset.tagline,
        description: preset.description,
        heroImage: '',
        badges: preset.badges,
        proofBadgeText: preset.proofBadgeText,
        services: preset.services,
        testimonials: [
          { quote: 'Exceptional service and unmatched attention to detail.', author: 'Community Leader', role: 'Verified Review', rating: 5, verified: true }
        ]
      });
    } else {
      setForm({
        businessName: '',
        clientContact: '',
        email: '',
        phone: '',
        address: '',
        domain: '',
        category: 'Campaign & Leadership',
        tier: 'Lead Generation Site',
        status: 'New Intake',
        theme: 'campaign-navy',
        primaryColor: '#00081e',
        accentColor: '#C5A059',
        tagline: '',
        description: '',
        heroImage: '',
        badges: ['25+ Years Experience', 'Locally Owned & Operated', 'Satisfaction Guaranteed'],
        proofBadgeText: 'Official Endorsements · Top Rated',
        services: [
          { title: 'Core Solution', description: 'Comprehensive craftsmanship delivered on time and within budget.', price: 'Custom', highlight: true }
        ],
        testimonials: [
          { quote: 'Unmatched leadership and execution across all deliverables.', author: 'Client Partner', role: 'Austin, TX', rating: 5, verified: true }
        ]
      });
    }
    setEditingClient(null);
    setIsNewModalOpen(true);
  };

  const handleEditClient = (client: ClientIntake) => {
    setEditingClient(client);
    setForm(client);
    setIsNewModalOpen(true);
  };

  const handleSaveClient = async (launchStudioAfter: boolean = false) => {
    if (!form.businessName) return;

    let savedClient: ClientIntake;

    if (editingClient) {
      savedClient = {
        ...editingClient,
        ...(form as ClientIntake),
        updatedAt: new Date().toISOString()
      };
      setClients(prev => {
        const next = prev.map(c => c.id === editingClient.id ? savedClient : c);
        try { localStorage.setItem('txsons_client_intakes', JSON.stringify(next)); } catch {}
        return next;
      });
    } else {
      savedClient = {
        ...(form as ClientIntake),
        id: `intake-${Date.now()}`,
        status: form.status || 'New Intake',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setClients(prev => {
        const next = [savedClient, ...prev];
        try { localStorage.setItem('txsons_client_intakes', JSON.stringify(next)); } catch {}
        return next;
      });
    }

    try {
      await supabase.from('client_intakes').upsert({
        id: savedClient.id,
        business_name: savedClient.businessName,
        client_contact: savedClient.clientContact,
        email: savedClient.email,
        phone: savedClient.phone,
        address: savedClient.address,
        domain: savedClient.domain,
        category: savedClient.category,
        tier: savedClient.tier,
        status: savedClient.status,
        theme: savedClient.theme,
        tagline: savedClient.tagline,
        description: savedClient.description,
        data: savedClient,
        updated_at: new Date().toISOString()
      });
    } catch {}

    setIsNewModalOpen(false);

    if (launchStudioAfter) {
      onLaunchStudio(savedClient);
    }
  };

  const handleApplyFromScanner = (dossier: Partial<ClientIntake>, primaryImageUrl?: string) => {
    setEditingClient(null);
    setForm(prev => ({
      ...prev,
      ...dossier,
      heroImage: primaryImageUrl || dossier.heroImage || prev.heroImage
    }));
    setIsScannerOpen(false);
    setIsNewModalOpen(true);
  };

  const handleDeleteClient = (id: string) => {
    if (confirm('Are you sure you want to remove this client intake dossier?')) {
      setClients(prev => prev.filter(c => c.id !== id));
    }
  };

  const handleCopyText = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  const filteredClients = clients.filter(c => {
    const matchesSearch = 
      c.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.clientContact.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.domain && c.domain.toLowerCase().includes(searchQuery.toLowerCase())) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = filterCategory === 'all' || c.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Campaign & Leadership': return Vote;
      case 'Food & Beverage': return Utensils;
      case 'Beauty & Wellness': return Sparkle;
      case 'Home & Trade Services': return Wrench;
      case 'Professional & Medical': return Stethoscope;
      default: return Briefcase;
    }
  };

  const getStatusColor = (status: IntakeStatus) => {
    switch (status) {
      case 'New Intake': return 'bg-stone-800 text-stone-400 border-stone-700';
      case 'Assets Pending': return 'bg-[#C5A059]/10 text-[#C5A059] border-[#C5A059]/30';
      case 'Studio Ready': return 'bg-[#C5A059]/10 text-[#C5A059] border-[#C5A059]/30';
      case 'Deposit Paid': return 'bg-[#C5A059]/10 text-[#C5A059] border-[#C5A059]/30';
      case 'Live': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      default: return 'bg-stone-800 text-stone-400 border-stone-700';
    }
  };

  return (
    <div className="flex-1 min-h-screen bg-stone-950 text-stone-100 p-4 sm:p-8 pb-32 sm:pb-40 overflow-y-auto w-full h-full bg-[radial-gradient(circle,_#2a2a2a_1px,_transparent_1px)] bg-[length:24px_24px]">
      
      {/* Top Header */}
      <div className="max-w-7xl mx-auto space-y-6 pb-20">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-800/80 pb-6">
          <div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-[14px_6px_16px_8px/8px_16px_6px_14px] bg-[#C5A059]/10 border border-[#C5A059]/20 flex items-center justify-center text-[#C5A059]">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-stone-100 tracking-tight flex items-center gap-2">
                  Client Intake Vault
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/30 font-mono">
                    {clients.length} Active Dossiers
                  </span>
                </h1>
                <p className="text-xs font-mono text-stone-500 mt-0.5">
                  Fast client onboarding, brand asset collection, and 1-click bridge into 1-Click Studio.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsScannerOpen(true)}
              className="flex items-center space-x-2 px-3.5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-700 font-semibold text-xs sm:text-sm shadow-md transition-all active:scale-95"
            >
              <Camera className="w-4 h-4 text-[#C5A059]" />
              <span>Scan Photo / Menu</span>
            </button>

            <button
              onClick={() => handleOpenNewModal()}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-[#C5A059]/90 hover:bg-[#C5A059] text-stone-950 font-black text-xs sm:text-sm shadow-lg shadow-[#C5A059]/20 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>New Client Intake</span>
            </button>
          </div>
        </div>

        {/* Pipeline Metrics Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-[#C5A059] uppercase tracking-widest font-mono">Awaiting Assets</p>
              <p className="text-xl font-bold text-stone-200 mt-0.5">
                {clients.filter(c => c.status === 'Assets Pending' || c.status === 'New Intake').length}
              </p>
            </div>
            <Clock className="w-6 h-6 text-stone-500" />
          </div>

          <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-[#C5A059] uppercase tracking-widest font-mono">Studio Ready</p>
              <p className="text-xl font-bold text-stone-200 mt-0.5">
                {clients.filter(c => c.status === 'Studio Ready').length}
              </p>
            </div>
            <Wand2 className="w-6 h-6 text-stone-500" />
          </div>

          <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-[#C5A059] uppercase tracking-widest font-mono">Deposit Paid</p>
              <p className="text-xl font-bold text-stone-200 mt-0.5">
                {clients.filter(c => c.status === 'Deposit Paid').length}
              </p>
            </div>
            <Receipt className="w-6 h-6 text-stone-500" />
          </div>

          <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-[#C5A059] uppercase tracking-widest font-mono">Live & Deployed</p>
              <p className="text-xl font-bold text-stone-200 mt-0.5">
                {clients.filter(c => c.status === 'Live').length}
              </p>
            </div>
            <Globe className="w-6 h-6 text-stone-500" />
          </div>
        </div>

        {/* Quick Presets Carousel / Quick Add Pills */}
        <div className="space-y-2">
          <p className="text-[10px] font-black text-[#C5A059] uppercase tracking-widest font-mono">Fast-Start Industry Templates:</p>
          <div className="flex flex-wrap gap-2">
            {PRESET_TEMPLATES.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => handleOpenNewModal(preset)}
                className="px-3 py-1.5 rounded-lg bg-stone-900 border border-stone-800 hover:border-[#C5A059]/50 hover:bg-stone-800 text-xs font-medium text-stone-300 hover:text-stone-100 transition-all flex items-center gap-1.5 group"
              >
                <Plus className="w-3 h-3 text-[#C5A059] group-hover:rotate-90 transition-transform" />
                <span>{preset.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-stone-900 p-3 rounded-2xl border border-stone-800">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by client, domain, or contact..."
              className="w-full pl-9 pr-4 py-2 bg-stone-900 border border-stone-800 rounded-xl text-xs focus:outline-none focus:border-[#C5A059]/60 focus:ring-1 focus:ring-[#C5A059]/20/60 focus:ring-1 focus:ring-[#C5A059]/20 text-stone-100 placeholder:text-stone-600"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-xs text-stone-300 focus:outline-none focus:border-[#C5A059]/60 focus:ring-1 focus:ring-[#C5A059]/20/60 focus:ring-1 focus:ring-[#C5A059]/20"
            >
              <option value="all">All Industries</option>
              <option value="Campaign & Leadership">Campaign & Leadership</option>
              <option value="Food & Beverage">Food & Beverage</option>
              <option value="Beauty & Wellness">Beauty & Wellness</option>
              <option value="Home & Trade Services">Home & Trade Services</option>
              <option value="Professional & Medical">Professional & Medical</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-xs text-stone-300 focus:outline-none focus:border-[#C5A059]/60 focus:ring-1 focus:ring-[#C5A059]/20/60 focus:ring-1 focus:ring-[#C5A059]/20"
            >
              <option value="all">All Statuses</option>
              <option value="New Intake">New Intake</option>
              <option value="Assets Pending">Assets Pending</option>
              <option value="Studio Ready">Studio Ready</option>
              <option value="Deposit Paid">Deposit Paid</option>
              <option value="Live">Live</option>
            </select>
          </div>
        </div>

        {/* Client Intake Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pb-10">
          {filteredClients.map((client) => {
            const Icon = getCategoryIcon(client.category);
            return (
              <div 
                key={client.id}
                className="rounded-2xl bg-stone-900 border border-stone-800 hover:border-[#C5A059]/50 transition-all flex flex-col justify-between overflow-hidden group shadow-lg h-full"
              >
                {/* Card Header & Identity */}
                <div className="p-5 space-y-4 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div 
                        style={{ backgroundColor: client.accentColor ? `${client.accentColor}20` : undefined, borderColor: client.accentColor ? `${client.accentColor}30` : undefined }}
                        className="w-10 h-10 rounded-[14px_6px_16px_8px/8px_16px_6px_14px] bg-[#C5A059]/10 border border-[#C5A059]/20 flex items-center justify-center text-[#C5A059] flex-shrink-0"
                      >
                        <Icon className="w-5 h-5" style={{ color: client.accentColor || undefined }} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-base font-bold text-stone-100 tracking-tight truncate group-hover:text-[#C5A059] transition-colors">
                          {client.businessName}
                        </h3>
                        <p className="text-xs text-stone-500 font-mono truncate">
                          {client.clientContact || 'Primary Contact'}
                        </p>
                      </div>
                    </div>

                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border flex-shrink-0 font-mono ${getStatusColor(client.status)}`}>
                      {client.status}
                    </span>
                  </div>

                  {/* Tagline / Pitch */}
                  {client.tagline && (
                    <p className="text-xs text-stone-300 italic line-clamp-2 leading-relaxed bg-stone-950 p-2.5 rounded-xl border border-stone-800">
                      "{client.tagline}"
                    </p>
                  )}

                  {/* Dossier Meta Pills */}
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-400">
                      <span className="text-[10px] font-black text-[#C5A059] uppercase tracking-widest font-mono block mb-1">Tier / Scope</span>
                      <span className="text-stone-200 font-medium truncate block">{client.tier}</span>
                    </div>

                    <div className="p-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-400">
                      <span className="text-[10px] font-black text-[#C5A059] uppercase tracking-widest font-mono block mb-1">Theme Scheme</span>
                      <span className="text-stone-200 font-medium capitalize truncate block">{client.theme}</span>
                    </div>
                  </div>

                  {/* Content Assets Counters */}
                  <div className="flex items-center gap-3 text-[10px] text-stone-500 font-mono pt-1">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{client.services?.length || 0} Offerings</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{client.badges?.length || 0} Badges</span>
                    </span>
                    {client.domain && (
                      <span className="flex items-center gap-1 text-stone-400 truncate">
                        <Globe className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                        <span className="truncate">{client.domain}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Action Footers */}
                <div className="p-3.5 bg-stone-950 border-t border-stone-800 flex flex-col gap-2.5 mt-auto flex-shrink-0">
                  
                  {/* Primary Studio Bridge Button */}
                  <button
                    onClick={() => onLaunchStudio(client)}
                    className="w-full py-2.5 px-3 rounded-xl bg-[#C5A059]/90 hover:bg-[#C5A059] text-stone-950 font-black text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>Launch in 1-Click Studio</span>
                  </button>

                  {/* Secondary Action Toolbar */}
                  <div className="grid grid-cols-4 gap-1.5">
                    <button
                      onClick={() => onInvoiceClient(client)}
                      title="Create 50% Deposit Invoice"
                      className="py-2 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-300 hover:text-emerald-400 text-xs flex items-center justify-center transition-colors shadow-sm"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setShareModalClient(client)}
                      title="Share Intake Questionnaire / Copy Templates"
                      className="py-2 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-300 hover:text-blue-400 text-xs flex items-center justify-center transition-colors shadow-sm"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleEditClient(client)}
                      title="Edit Dossier"
                      className="py-2 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-300 hover:text-stone-100 text-xs flex items-center justify-center transition-colors shadow-sm"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDeleteClient(client.id)}
                      title="Delete Dossier"
                      className="py-2 rounded-xl bg-stone-900 hover:bg-red-950/40 border border-stone-800 text-stone-500 hover:text-red-400 text-xs flex items-center justify-center transition-colors shadow-sm"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredClients.length === 0 && (
          <div className="p-12 text-center rounded-2xl bg-stone-900 border border-stone-800 space-y-4">
            <Users className="w-12 h-12 text-stone-600 mx-auto" />
            <div>
              <h3 className="text-base font-bold text-stone-100">No client intake dossiers found</h3>
              <p className="text-xs text-stone-500 font-mono max-w-sm mx-auto mt-1">
                Create a new intake dossier using the button above or pick one of the fast-start industry presets.
              </p>
            </div>
            <button
              onClick={() => handleOpenNewModal()}
              className="px-4 py-2 rounded-xl bg-[#C5A059]/90 hover:bg-[#C5A059] text-stone-950 text-xs font-black"
            >
              + Create First Dossier
            </button>
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: Client Intake Dossier Editor & Creator                           */}
      {/* ========================================================================= */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-stone-800 flex items-center justify-between bg-stone-950">
              <div>
                <h3 className="text-lg font-bold text-stone-100 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#C5A059]" />
                  {editingClient ? `Edit Intake: ${editingClient.businessName}` : 'New Client Intake Dossier'}
                </h3>
                <p className="text-xs text-stone-400">
                  Pre-fills all blocks, badges, theme colors, and services for AI Studio generation.
                </p>
              </div>
              <button 
                onClick={() => setIsNewModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-100 rounded-lg hover:bg-stone-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              
              {/* Data Vault Ingestion Banner */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#C5A059]/10 via-stone-900 to-stone-950 border border-[#C5A059]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-[14px_6px_16px_8px/8px_16px_6px_14px] bg-[#C5A059]/10 border border-[#C5A059]/20 flex items-center justify-center text-[#C5A059] flex-shrink-0">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-stone-100 block">Have a photo, flyer, resume, or business card?</span>
                    <span className="text-[11px] text-stone-400">Let Gemini Vision parse all fields, offerings, and colors instantly.</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-[#C5A059]/90 hover:bg-[#C5A059] text-stone-950 font-black text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md flex-shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Scan Photo</span>
                </button>
              </div>

              {/* Section 1: Business Identity */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-[#C5A059] uppercase tracking-wider border-b border-stone-800 pb-1.5">
                  1. Business Identity & Primary Contact
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-stone-400 mb-1 font-medium">Business / Campaign Name *</label>
                    <input
                      type="text"
                      value={form.businessName || ''}
                      onChange={(e) => setForm(prev => ({ ...prev, businessName: e.target.value }))}
                      placeholder="e.g. Deborah Dietzmann for Judge"
                      className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-[#C5A059]/60 focus:ring-1 focus:ring-[#C5A059]/20"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-400 mb-1 font-medium">Client Contact Name</label>
                    <input
                      type="text"
                      value={form.clientContact || ''}
                      onChange={(e) => setForm(prev => ({ ...prev, clientContact: e.target.value }))}
                      placeholder="e.g. Debbie Dietzmann"
                      className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-[#C5A059]/60 focus:ring-1 focus:ring-[#C5A059]/20"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-400 mb-1 font-medium">Phone Number</label>
                    <input
                      type="text"
                      value={form.phone || ''}
                      onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="e.g. (512) 555-0194"
                      className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-[#C5A059]/60 focus:ring-1 focus:ring-[#C5A059]/20"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-400 mb-1 font-medium">Email Address</label>
                    <input
                      type="email"
                      value={form.email || ''}
                      onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="e.g. campaign@debbieforjudge.com"
                      className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-[#C5A059]/60 focus:ring-1 focus:ring-[#C5A059]/20"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-stone-400 mb-1 font-medium">Physical Address / Headquarters</label>
                    <input
                      type="text"
                      value={form.address || ''}
                      onChange={(e) => setForm(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="e.g. 701 Brazos St, Suite 500, Austin, TX"
                      className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-[#C5A059]/60 focus:ring-1 focus:ring-[#C5A059]/20"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Industry & Theme Archetype */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
                  <h4 className="text-xs font-bold text-[#C5A059] uppercase tracking-wider">
                    2. Industry Archetype & Theme Palette
                  </h4>
                  <span className="text-[10px] text-stone-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#C5A059]" />
                    <span>Auto-matches from business name & photos</span>
                  </span>
                </div>

                {/* AI Theme & Image Palette Recommendation Banner */}
                {(() => {
                  const text = `${form.businessName || ''} ${form.category || ''} ${form.tagline || ''}`.toLowerCase();
                  let rec: {
                    theme: 'campaign-navy' | 'campaign-judicial' | 'luxury' | 'crimson-bold' | 'dark' | 'light' | 'emerald-gold' | 'custom';
                    primaryColor: string;
                    accentColor: string;
                    category: 'Campaign & Leadership' | 'Food & Beverage' | 'Beauty & Wellness' | 'Home & Trade Services' | 'Professional & Medical';
                    tier: Tier;
                    name: string;
                    desc: string;
                  } = {
                    theme: photoPalette?.themeRecommendation || 'campaign-navy',
                    primaryColor: photoPalette?.primaryBg || '#00081e',
                    accentColor: photoPalette?.accentColor || '#C5A059',
                    category: 'Campaign & Leadership',
                    tier: 'Lead Generation Site',
                    name: photoPalette ? `Photo Matched: ${photoPalette.themeRecommendation} (${photoPalette.accentColor})` : 'Campaign Navy + Texas Gold (#C5A059)',
                    desc: photoPalette ? photoPalette.reason : 'Optimized for high-authority political campaigns & community leadership'
                  };

                  if (!photoPalette) {
                    if (text.includes('bbq') || text.includes('smokehouse') || text.includes('grill') || text.includes('restaurant') || text.includes('taco') || text.includes('diner') || text.includes('cafe') || form.category === 'Food & Beverage') {
                      rec = {
                        theme: 'crimson-bold',
                        primaryColor: '#1c1917',
                        accentColor: '#EA580C',
                        category: 'Food & Beverage',
                        tier: 'Lead Generation Site',
                        name: 'Crimson Bold + Post Oak Ember (#EA580C)',
                        desc: 'Optimized for Texas BBQ, dining & smokehouse branding'
                      };
                    } else if (text.includes('beauty') || text.includes('spa') || text.includes('salon') || text.includes('lash') || text.includes('wellness') || text.includes('boutique') || form.category === 'Beauty & Wellness') {
                      rec = {
                        theme: 'luxury',
                        primaryColor: '#0c0a09',
                        accentColor: '#E2B18E',
                        category: 'Beauty & Wellness',
                        tier: 'Basic Website',
                        name: 'Charcoal Luxury + Rose Champagne (#E2B18E)',
                        desc: 'Optimized for high-end salons, spas & wellness boutiques'
                      };
                    } else if (text.includes('roof') || text.includes('plumb') || text.includes('electric') || text.includes('hvac') || text.includes('contract') || text.includes('garage') || text.includes('landscape') || text.includes('tree') || form.category === 'Home & Trade Services') {
                      rec = {
                        theme: 'emerald-gold',
                        primaryColor: '#064e3b',
                        accentColor: '#EAB308',
                        category: 'Home & Trade Services',
                        tier: 'Lead Generation Site',
                        name: 'Texas Emerald + Sun Gold (#EAB308)',
                        desc: 'Optimized for local trades, contractors & service craftsmanship'
                      };
                    } else if (text.includes('law') || text.includes('legal') || text.includes('attorney') || text.includes('cpa') || text.includes('account') || text.includes('doctor') || text.includes('dental') || text.includes('clinic') || form.category === 'Professional & Medical') {
                      rec = {
                        theme: 'light',
                        primaryColor: '#f8fafc',
                        accentColor: '#0284C7',
                        category: 'Professional & Medical',
                        tier: 'Lead Generation Site',
                        name: 'Clean Modern Light + Slate Blue (#0284C7)',
                        desc: 'Optimized for legal practices, healthcare & corporate firms'
                      };
                    }
                  }

                  return (
                    <div className="space-y-2.5">
                      <div className="p-3 rounded-xl bg-[#C5A059]/10 border border-[#C5A059]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 animate-in fade-in">
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-[14px_6px_16px_8px/8px_16px_6px_14px] bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/20 flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-3.5 h-3.5" />
                          </div>
                          <div className="text-xs min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-stone-100">AI Color & Theme Match:</span>
                              {rec.accentColor && (
                                <span className="inline-flex items-center gap-1 font-mono text-[11px] text-stone-300">
                                  <span className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: rec.accentColor }} />
                                  <span>{rec.accentColor}</span>
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-[#C5A059] font-semibold truncate mt-0.5">{rec.name}</p>
                            <p className="text-[10.5px] text-stone-400 leading-tight mt-0.5 truncate">{rec.desc}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setForm(prev => ({
                              ...prev,
                              category: rec.category,
                              theme: rec.theme,
                              primaryColor: rec.primaryColor,
                              accentColor: rec.accentColor
                            }));
                          }}
                          className="px-3 py-1.5 bg-[#C5A059]/90 hover:bg-[#C5A059] text-stone-100 rounded-lg text-xs font-bold transition-all shadow flex items-center gap-1.5 flex-shrink-0"
                        >
                          <Palette className="w-3.5 h-3.5" />
                          <span>Auto-Apply Theme</span>
                        </button>
                      </div>

                      {/* Photo Extracted Color Chips */}
                      {photoPalette && photoPalette.palette && photoPalette.palette.length > 0 && (
                        <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 space-y-1.5 animate-in fade-in">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-stone-300 flex items-center gap-1">
                              <ImageIcon className="w-3 h-3 text-[#C5A059]" />
                              <span>Sampled Photo Colors (Click swatch to set accent):</span>
                            </span>
                            <span className="text-stone-500 text-[10px]">Real Pixel Analysis</span>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap pt-0.5">
                            {photoPalette.palette.map((hex, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setForm(prev => ({ ...prev, accentColor: hex }))}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono transition-all ${
                                  form.accentColor === hex
                                    ? 'border-[#C5A059] bg-[#C5A059]/10 text-stone-100 ring-1 ring-[#C5A059] shadow-sm'
                                    : 'border-stone-800 bg-stone-900 text-stone-300 hover:border-stone-700'
                                }`}
                                title={`Set ${hex} as Accent Color`}
                              >
                                <span className="w-3 h-3 rounded-full border border-white/20 shadow-xs" style={{ backgroundColor: hex }} />
                                <span>{hex}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-stone-400 mb-1 font-medium">Industry Category</label>
                    <select
                      value={form.category || 'Campaign & Leadership'}
                      onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value as any }))}
                      className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-[#C5A059]/60 focus:ring-1 focus:ring-[#C5A059]/20"
                    >
                      <option value="Campaign & Leadership">Campaign & Leadership</option>
                      <option value="Food & Beverage">Food & Beverage (BBQ/Dining)</option>
                      <option value="Beauty & Wellness">Beauty & Wellness (Salon/Spa)</option>
                      <option value="Home & Trade Services">Home & Trade Services (HVAC/Roofing)</option>
                      <option value="Professional & Medical">Professional & Medical</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-stone-400 mb-1 font-medium">Theme Aesthetic</label>
                    <select
                      value={form.theme || 'campaign-navy'}
                      onChange={(e) => setForm(prev => ({ ...prev, theme: e.target.value as any }))}
                      className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-[#C5A059]/60 focus:ring-1 focus:ring-[#C5A059]/20 font-semibold"
                    >
                      <option value="campaign-navy">Campaign Navy (Presidential & Gold)</option>
                      <option value="campaign-judicial">Judicial Light (Navy & Crimson)</option>
                      <option value="luxury">Luxury (Amber Glow & Stone)</option>
                      <option value="crimson-bold">Crimson Bold (Texas BBQ & Heritage)</option>
                      <option value="emerald-gold">Emerald Gold (Trade & Craftsmanship)</option>
                      <option value="dark">Modern Dark (High-Tech / Trade)</option>
                      <option value="light">Clean Light (Medical / Corporate)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-stone-400 mb-1 font-medium">Project Package Tier</label>
                    <select
                      value={form.tier || 'Lead Generation Site'}
                      onChange={(e) => setForm(prev => ({ ...prev, tier: e.target.value as Tier }))}
                      className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-[#C5A059]/60 focus:ring-1 focus:ring-[#C5A059]/20"
                    >
                      <option value="Basic Website">Spur Tier ($1,500 - Landing Page)</option>
                      <option value="Lead Generation Site">Ranger Tier ($3,500 - Flow/Lead Gen)</option>
                      <option value="Full Custom Application">Maverick Tier ($7,500 - Full Engine)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  <div>
                    <label className="block text-stone-400 mb-1 font-medium">Accent Color (Hex Code)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={form.accentColor || '#C5A059'}
                        onChange={(e) => setForm(prev => ({ ...prev, accentColor: e.target.value }))}
                        className="w-8 h-8 rounded border border-stone-800 bg-stone-950 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={form.accentColor || '#C5A059'}
                        onChange={(e) => setForm(prev => ({ ...prev, accentColor: e.target.value }))}
                        className="flex-1 px-3 py-1.5 bg-stone-900 border border-stone-800 rounded-xl text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-[#C5A059]/60 focus:ring-1 focus:ring-[#C5A059]/20 font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-stone-400 mb-1 font-medium">Target Custom Domain</label>
                    <input
                      type="text"
                      value={form.domain || ''}
                      onChange={(e) => setForm(prev => ({ ...prev, domain: e.target.value }))}
                      placeholder="e.g. waylonrogerscampaign.com"
                      className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-[#C5A059]/60 focus:ring-1 focus:ring-[#C5A059]/20 font-mono text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Brand Messaging & Hero Imagery */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-[#C5A059] uppercase tracking-wider border-b border-stone-800 pb-1.5">
                  3. Brand Narrative & Hero Imagery
                </h4>

                <div>
                  <label className="block text-stone-400 mb-1 font-medium">Tagline / Headline</label>
                  <input
                    type="text"
                    value={form.tagline || ''}
                    onChange={(e) => setForm(prev => ({ ...prev, tagline: e.target.value }))}
                    placeholder="e.g. Honest Leadership. Proven Record. Protecting Our Communities."
                    className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-[#C5A059]/60 focus:ring-1 focus:ring-[#C5A059]/20"
                  />
                </div>

                <div>
                  <label className="block text-stone-400 mb-1 font-medium">Bio / Story Description</label>
                  <textarea
                    rows={3}
                    value={form.description || ''}
                    onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Over 28 years serving our county with integrity, courage, and dedication..."
                    className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-[#C5A059]/60 focus:ring-1 focus:ring-[#C5A059]/20 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-stone-400 mb-1 font-medium">Hero Photo (Upload Local File or Image URL)</label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={form.heroImage || ''}
                        onChange={(e) => setForm(prev => ({ ...prev, heroImage: e.target.value }))}
                        placeholder="https://images.unsplash.com/... or paste data URL"
                        className="flex-1 px-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-[#C5A059]/60 focus:ring-1 focus:ring-[#C5A059]/20 font-mono text-[11px]"
                      />
                      <label className="px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-bold cursor-pointer transition-all border border-stone-700 flex items-center gap-1.5 flex-shrink-0">
                        <Upload className="w-3.5 h-3.5 text-[#C5A059]" />
                        <span>Upload Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (evt) => {
                                const dataUrl = evt.target?.result as string;
                                setForm(prev => ({ ...prev, heroImage: dataUrl }));
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>

                    {form.heroImage && (
                      <div className="relative w-32 h-20 rounded-lg overflow-hidden border border-[#C5A059]/40 group">
                        <img src={form.heroImage} alt="Hero preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setForm(prev => ({ ...prev, heroImage: '' }))}
                          className="absolute top-1 right-1 p-1 bg-black/80 rounded-full text-stone-400 hover:text-red-400 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 4: Accreditations & Badges */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-[#C5A059] uppercase tracking-wider border-b border-stone-800 pb-1.5">
                  4. Accreditations & Authority Badges
                </h4>

                <div>
                  <label className="block text-stone-400 mb-1 font-medium">Badges (Comma Separated)</label>
                  <input
                    type="text"
                    value={form.badges?.join(', ') || ''}
                    onChange={(e) => setForm(prev => ({ ...prev, badges: e.target.value.split(',').map(b => b.trim()).filter(Boolean) }))}
                    placeholder="28+ Years Trial Experience, Endorsed by Law Enforcement, Preserving the Constitution"
                    className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-[#C5A059]/60 focus:ring-1 focus:ring-[#C5A059]/20"
                  />
                </div>

                <div>
                  <label className="block text-stone-400 mb-1 font-medium">Proof & Review Badge Text</label>
                  <input
                    type="text"
                    value={form.proofBadgeText || ''}
                    onChange={(e) => setForm(prev => ({ ...prev, proofBadgeText: e.target.value }))}
                    placeholder="Official 2026 Endorsements · Texas Bar Association Verified"
                    className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-[#C5A059]/60 focus:ring-1 focus:ring-[#C5A059]/20"
                  />
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-stone-800 bg-stone-950 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-700 text-xs font-medium transition-colors"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => handleSaveClient(false)}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-200 text-xs font-semibold transition-colors"
                >
                  Save to Vault
                </button>

                <button
                  onClick={() => handleSaveClient(true)}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-[#C5A059]/90 hover:bg-[#C5A059] text-stone-950 text-xs font-black flex items-center justify-center gap-1.5 shadow-lg shadow-[#C5A059]/20"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Save & Open in Studio</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: Share Questionnaire & Client Onboarding Templates                */}
      {/* ========================================================================= */}
      {shareModalClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            
            <div className="px-6 py-4 border-b border-stone-800 flex items-center justify-between bg-stone-950">
              <div>
                <h3 className="text-base font-bold text-stone-100 flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-[#C5A059]" />
                  Share Intake Questionnaire: {shareModalClient.businessName}
                </h3>
                <p className="text-xs text-stone-400">
                  Ready-to-copy client email & SMS templates to collect menus, photos, credentials, and hours.
                </p>
              </div>
              <button 
                onClick={() => setShareModalClient(null)}
                className="p-1.5 text-stone-400 hover:text-stone-100 rounded-lg hover:bg-stone-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              
              {/* Template 1: Full Email Welcome & Asset Request */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#C5A059]" />
                    Client Welcome Email Template
                  </span>
                  <button
                    onClick={() => {
                      const emailText = `Subject: Welcome to TX Sons — Asset Collection for ${shareModalClient.businessName}

Hi ${shareModalClient.clientContact || 'there'},

We are thrilled to kick off your new digital platform with TX Sons! To ensure your website perfectly represents ${shareModalClient.businessName}, please reply to this email with the following assets:

1. Brand Assets: Your high-resolution logo (PNG or SVG) and preferred brand colors.
2. Key Offerings: A bulleted list of your primary services/menu items with short descriptions and pricing.
3. Authority Badges: Any licensing numbers, years in business, or prominent award recognitions.
4. Social Proof: 2-3 customer reviews or official endorsements you'd like highlighted.
5. High-Resolution Photos: Pictures of your team, facility, food, or campaign headshot.

If you have any questions, feel free to give us a call or text at ${shareModalClient.phone || '(512) 555-TXSONS'}.

Best regards,
Morgan
TX Sons Delivery Engine`;
                      handleCopyText(emailText, 'email');
                    }}
                    className="px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 flex items-center gap-1 font-semibold transition-colors"
                  >
                    {copiedType === 'email' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedType === 'email' ? 'Copied Email' : 'Copy Email'}</span>
                  </button>
                </div>

                <div className="p-3.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-300 font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
{`Subject: Welcome to TX Sons — Asset Collection for ${shareModalClient.businessName}

Hi ${shareModalClient.clientContact || 'there'},

We are thrilled to kick off your new digital platform with TX Sons! Please reply with:
1. High-resolution logo and brand colors
2. Service / Menu item descriptions & pricing
3. Accreditations, licenses, or endorsement quotes
4. Hero photos of your team/facility

Best regards,
TX Sons Delivery Engine`}
                </div>
              </div>

              {/* Template 2: SMS Fast Asset Request */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-blue-400" />
                    Client Quick SMS / Text Template
                  </span>
                  <button
                    onClick={() => {
                      const smsText = `Hey ${shareModalClient.clientContact || 'there'}! This is Morgan with TX Sons. We're starting your site build for ${shareModalClient.businessName}. When you get a chance, please text or email us your logo, top 3 services/menu items, and any photos you want featured. Excited to build this!`;
                      handleCopyText(smsText, 'sms');
                    }}
                    className="px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 flex items-center gap-1 font-semibold transition-colors"
                  >
                    {copiedType === 'sms' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedType === 'sms' ? 'Copied SMS' : 'Copy SMS'}</span>
                  </button>
                </div>

                <div className="p-3.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-300 font-mono text-[11px] leading-relaxed">
{`Hey ${shareModalClient.clientContact || 'there'}! This is Morgan with TX Sons. We're starting your site build for ${shareModalClient.businessName}. When you get a chance, please text or email us your logo, top 3 services/menu items, and any photos you want featured.`}
                </div>
              </div>

            </div>

            <div className="px-6 py-3 border-t border-stone-800 bg-stone-950 flex justify-end">
              <button
                onClick={() => setShareModalClient(null)}
                className="px-4 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-100 font-medium"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: AI Multimodal Photo Scanner                                      */}
      {/* ========================================================================= */}
      <PhotoScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onApplyDossier={handleApplyFromScanner}
      />

    </div>
  );
}





