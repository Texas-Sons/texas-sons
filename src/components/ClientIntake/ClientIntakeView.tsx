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
  Briefcase
} from 'lucide-react';
import { ClientIntake, IntakeStatus, Tier } from '../../types';

interface ClientIntakeViewProps {
  onLaunchStudio: (client: ClientIntake) => void;
  onInvoiceClient: (client: ClientIntake) => void;
}

const DEFAULT_SAMPLE_CLIENTS: ClientIntake[] = [
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

export default function ClientIntakeView({ onLaunchStudio, onInvoiceClient }: ClientIntakeViewProps) {
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

  const handleSaveClient = (launchStudioAfter: boolean = false) => {
    if (!form.businessName) return;

    let savedClient: ClientIntake;

    if (editingClient) {
      savedClient = {
        ...editingClient,
        ...(form as ClientIntake),
        updatedAt: new Date().toISOString()
      };
      setClients(prev => prev.map(c => c.id === editingClient.id ? savedClient : c));
    } else {
      savedClient = {
        ...(form as ClientIntake),
        id: `intake-${Date.now()}`,
        status: form.status || 'New Intake',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setClients(prev => [savedClient, ...prev]);
    }

    setIsNewModalOpen(false);

    if (launchStudioAfter) {
      onLaunchStudio(savedClient);
    }
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
      case 'New Intake': return 'bg-stone-800 text-stone-300 border-stone-700';
      case 'Assets Pending': return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'Studio Ready': return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'Deposit Paid': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'Live': return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
    }
  };

  return (
    <div className="flex-1 bg-stone-950 text-stone-100 p-4 sm:p-8 overflow-y-auto min-h-screen">
      
      {/* Top Header */}
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-800/80 pb-6">
          <div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-orange-600/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                  Client Intake Vault
                  <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 font-mono">
                    {clients.length} Active Dossiers
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-stone-400 mt-0.5">
                  Fast client onboarding, brand asset collection, and 1-click bridge into AI Builder Studio.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => handleOpenNewModal()}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-orange-900/30 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>New Client Intake</span>
            </button>
          </div>
        </div>

        {/* Pipeline Metrics Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="p-4 rounded-xl bg-stone-900/60 border border-stone-800/80 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-stone-400 uppercase tracking-wider">Awaiting Assets</p>
              <p className="text-xl font-bold text-amber-400 mt-0.5">
                {clients.filter(c => c.status === 'Assets Pending' || c.status === 'New Intake').length}
              </p>
            </div>
            <Clock className="w-6 h-6 text-amber-500/40" />
          </div>

          <div className="p-4 rounded-xl bg-stone-900/60 border border-stone-800/80 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-stone-400 uppercase tracking-wider">Studio Ready</p>
              <p className="text-xl font-bold text-blue-400 mt-0.5">
                {clients.filter(c => c.status === 'Studio Ready').length}
              </p>
            </div>
            <Wand2 className="w-6 h-6 text-blue-500/40" />
          </div>

          <div className="p-4 rounded-xl bg-stone-900/60 border border-stone-800/80 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-stone-400 uppercase tracking-wider">Deposit Paid</p>
              <p className="text-xl font-bold text-emerald-400 mt-0.5">
                {clients.filter(c => c.status === 'Deposit Paid').length}
              </p>
            </div>
            <Receipt className="w-6 h-6 text-emerald-500/40" />
          </div>

          <div className="p-4 rounded-xl bg-stone-900/60 border border-stone-800/80 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-stone-400 uppercase tracking-wider">Live & Deployed</p>
              <p className="text-xl font-bold text-purple-400 mt-0.5">
                {clients.filter(c => c.status === 'Live').length}
              </p>
            </div>
            <Globe className="w-6 h-6 text-purple-500/40" />
          </div>
        </div>

        {/* Quick Presets Carousel / Quick Add Pills */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Fast-Start Industry Templates:</p>
          <div className="flex flex-wrap gap-2">
            {PRESET_TEMPLATES.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => handleOpenNewModal(preset)}
                className="px-3 py-1.5 rounded-lg bg-stone-900 border border-stone-800 hover:border-orange-500/50 hover:bg-stone-800/80 text-xs font-medium text-stone-300 hover:text-white transition-all flex items-center gap-1.5 group"
              >
                <Plus className="w-3 h-3 text-orange-400 group-hover:rotate-90 transition-transform" />
                <span>{preset.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-stone-900/40 p-3 rounded-xl border border-stone-800/60">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by client, domain, or contact..."
              className="w-full pl-9 pr-4 py-2 bg-stone-950 border border-stone-800 rounded-lg text-xs focus:outline-none focus:border-orange-500 text-stone-200 placeholder-stone-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 bg-stone-950 border border-stone-800 rounded-lg text-xs text-stone-300 focus:outline-none focus:border-orange-500"
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
              className="px-3 py-2 bg-stone-950 border border-stone-800 rounded-lg text-xs text-stone-300 focus:outline-none focus:border-orange-500"
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredClients.map((client) => {
            const Icon = getCategoryIcon(client.category);
            return (
              <div 
                key={client.id}
                className="rounded-2xl bg-stone-900/70 border border-stone-800/80 hover:border-stone-700 transition-all flex flex-col justify-between overflow-hidden group shadow-lg"
              >
                {/* Card Header & Identity */}
                <div className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div 
                        style={{ backgroundColor: client.accentColor ? `${client.accentColor}20` : undefined }}
                        className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 flex-shrink-0"
                      >
                        <Icon className="w-5 h-5" style={{ color: client.accentColor || undefined }} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-base font-bold text-white tracking-tight truncate group-hover:text-orange-400 transition-colors">
                          {client.businessName}
                        </h3>
                        <p className="text-xs text-stone-400 truncate">
                          {client.clientContact || 'Primary Contact'}
                        </p>
                      </div>
                    </div>

                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border flex-shrink-0 ${getStatusColor(client.status)}`}>
                      {client.status}
                    </span>
                  </div>

                  {/* Tagline / Pitch */}
                  {client.tagline && (
                    <p className="text-xs text-stone-300 italic line-clamp-2 leading-relaxed bg-stone-950/60 p-2.5 rounded-lg border border-stone-800/50">
                      "{client.tagline}"
                    </p>
                  )}

                  {/* Dossier Meta Pills */}
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 rounded-lg bg-stone-950/40 border border-stone-800/60 text-stone-400">
                      <span className="text-[10px] uppercase block font-semibold text-stone-500">Tier / Scope</span>
                      <span className="text-stone-200 font-medium truncate block">{client.tier}</span>
                    </div>

                    <div className="p-2 rounded-lg bg-stone-950/40 border border-stone-800/60 text-stone-400">
                      <span className="text-[10px] uppercase block font-semibold text-stone-500">Theme Scheme</span>
                      <span className="text-stone-200 font-medium capitalize truncate block">{client.theme}</span>
                    </div>
                  </div>

                  {/* Content Assets Counters */}
                  <div className="flex items-center gap-3 text-xs text-stone-400 pt-1">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{client.services?.length || 0} Offerings</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{client.badges?.length || 0} Badges</span>
                    </span>
                    {client.domain && (
                      <span className="flex items-center gap-1 text-stone-300 font-mono text-[11px] truncate">
                        <Globe className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                        <span className="truncate">{client.domain}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Action Footers */}
                <div className="p-3 bg-stone-950 border-t border-stone-800/80 flex flex-col gap-2">
                  
                  {/* Primary Studio Bridge Button */}
                  <button
                    onClick={() => onLaunchStudio(client)}
                    className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md shadow-orange-950/40 transition-all"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>Launch in AI Builder Studio</span>
                  </button>

                  {/* Secondary Action Toolbar */}
                  <div className="grid grid-cols-4 gap-1.5">
                    <button
                      onClick={() => onInvoiceClient(client)}
                      title="Create 50% Deposit Invoice"
                      className="py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-300 hover:text-emerald-400 text-xs flex items-center justify-center transition-colors"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setShareModalClient(client)}
                      title="Share Intake Questionnaire / Copy Templates"
                      className="py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-300 hover:text-blue-400 text-xs flex items-center justify-center transition-colors"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleEditClient(client)}
                      title="Edit Dossier"
                      className="py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-300 hover:text-white text-xs flex items-center justify-center transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDeleteClient(client.id)}
                      title="Delete Dossier"
                      className="py-1.5 rounded-lg bg-stone-900 hover:bg-red-950/40 border border-stone-800 text-stone-400 hover:text-red-400 text-xs flex items-center justify-center transition-colors"
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
          <div className="p-12 text-center rounded-2xl bg-stone-900/30 border border-stone-800/60 space-y-4">
            <Users className="w-12 h-12 text-stone-600 mx-auto" />
            <div>
              <h3 className="text-base font-semibold text-stone-300">No client intake dossiers found</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1">
                Create a new intake dossier using the button above or pick one of the fast-start industry presets.
              </p>
            </div>
            <button
              onClick={() => handleOpenNewModal()}
              className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold"
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
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-orange-400" />
                  {editingClient ? `Edit Intake: ${editingClient.businessName}` : 'New Client Intake Dossier'}
                </h3>
                <p className="text-xs text-stone-400">
                  Pre-fills all blocks, badges, theme colors, and services for AI Studio generation.
                </p>
              </div>
              <button 
                onClick={() => setIsNewModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              
              {/* Section 1: Business Identity */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-orange-400 uppercase tracking-wider border-b border-stone-800 pb-1.5">
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
                      className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-lg text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-400 mb-1 font-medium">Client Contact Name</label>
                    <input
                      type="text"
                      value={form.clientContact || ''}
                      onChange={(e) => setForm(prev => ({ ...prev, clientContact: e.target.value }))}
                      placeholder="e.g. Debbie Dietzmann"
                      className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-lg text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-400 mb-1 font-medium">Phone Number</label>
                    <input
                      type="text"
                      value={form.phone || ''}
                      onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="e.g. (512) 555-0194"
                      className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-lg text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-400 mb-1 font-medium">Email Address</label>
                    <input
                      type="email"
                      value={form.email || ''}
                      onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="e.g. campaign@debbieforjudge.com"
                      className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-lg text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-stone-400 mb-1 font-medium">Physical Address / Headquarters</label>
                    <input
                      type="text"
                      value={form.address || ''}
                      onChange={(e) => setForm(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="e.g. 701 Brazos St, Suite 500, Austin, TX"
                      className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-lg text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Industry & Theme Archetype */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-orange-400 uppercase tracking-wider border-b border-stone-800 pb-1.5">
                  2. Industry Archetype & Theme Palette
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-stone-400 mb-1 font-medium">Industry Category</label>
                    <select
                      value={form.category || 'Campaign & Leadership'}
                      onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value as any }))}
                      className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-lg text-white focus:outline-none focus:border-orange-500"
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
                      className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-lg text-white focus:outline-none focus:border-orange-500"
                    >
                      <option value="campaign-navy">Campaign Navy (Presidential & Gold)</option>
                      <option value="luxury">Luxury (Amber Glow & Stone)</option>
                      <option value="crimson-bold">Crimson Bold (Texas BBQ & Heritage)</option>
                      <option value="dark">Modern Dark (High-Tech / Trade)</option>
                      <option value="light">Clean Light (Medical / Corporate)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-stone-400 mb-1 font-medium">Project Package Tier</label>
                    <select
                      value={form.tier || 'Lead Generation Site'}
                      onChange={(e) => setForm(prev => ({ ...prev, tier: e.target.value as Tier }))}
                      className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-lg text-white focus:outline-none focus:border-orange-500"
                    >
                      <option value="Basic Website">Spur Tier ($1,500 - Landing Page)</option>
                      <option value="Lead Generation Site">Ranger Tier ($3,500 - Flow/Lead Gen)</option>
                      <option value="Full Custom Application">Maverick Tier ($7,500 - Full Engine)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
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
                        className="flex-1 px-3 py-1.5 bg-stone-950 border border-stone-800 rounded-lg text-white focus:outline-none focus:border-orange-500 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-stone-400 mb-1 font-medium">Target Custom Domain</label>
                    <input
                      type="text"
                      value={form.domain || ''}
                      onChange={(e) => setForm(prev => ({ ...prev, domain: e.target.value }))}
                      placeholder="e.g. debbieforjudge.com"
                      className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-lg text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Brand Messaging & Hero Imagery */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-orange-400 uppercase tracking-wider border-b border-stone-800 pb-1.5">
                  3. Brand Narrative & Hero Imagery
                </h4>

                <div>
                  <label className="block text-stone-400 mb-1 font-medium">Tagline / Headline</label>
                  <input
                    type="text"
                    value={form.tagline || ''}
                    onChange={(e) => setForm(prev => ({ ...prev, tagline: e.target.value }))}
                    placeholder="e.g. Courtroom Integrity. Constitutional Defense."
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-lg text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-stone-400 mb-1 font-medium">Bio / Story Description</label>
                  <textarea
                    rows={3}
                    value={form.description || ''}
                    onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Over 28 years in courtroom trial law..."
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-lg text-white focus:outline-none focus:border-orange-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-stone-400 mb-1 font-medium">Hero Photo URL (Unsplash or Client Hosted)</label>
                  <input
                    type="text"
                    value={form.heroImage || ''}
                    onChange={(e) => setForm(prev => ({ ...prev, heroImage: e.target.value }))}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-lg text-white focus:outline-none focus:border-orange-500 font-mono text-[11px]"
                  />
                </div>
              </div>

              {/* Section 4: Accreditations & Badges */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-orange-400 uppercase tracking-wider border-b border-stone-800 pb-1.5">
                  4. Accreditations & Authority Badges
                </h4>

                <div>
                  <label className="block text-stone-400 mb-1 font-medium">Badges (Comma Separated)</label>
                  <input
                    type="text"
                    value={form.badges?.join(', ') || ''}
                    onChange={(e) => setForm(prev => ({ ...prev, badges: e.target.value.split(',').map(b => b.trim()).filter(Boolean) }))}
                    placeholder="28+ Years Trial Experience, Endorsed by Law Enforcement, Preserving the Constitution"
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-lg text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-stone-400 mb-1 font-medium">Proof & Review Badge Text</label>
                  <input
                    type="text"
                    value={form.proofBadgeText || ''}
                    onChange={(e) => setForm(prev => ({ ...prev, proofBadgeText: e.target.value }))}
                    placeholder="Official 2026 Endorsements · Texas Bar Association Verified"
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-lg text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-stone-800 bg-stone-950 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="w-full sm:w-auto px-4 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 text-xs font-medium transition-colors"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => handleSaveClient(false)}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-white text-xs font-semibold transition-colors"
                >
                  Save to Vault
                </button>

                <button
                  onClick={() => handleSaveClient(true)}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-lg bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-lg shadow-orange-950/40"
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
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-orange-400" />
                  Share Intake Questionnaire: {shareModalClient.businessName}
                </h3>
                <p className="text-xs text-stone-400">
                  Ready-to-copy client email & SMS templates to collect menus, photos, credentials, and hours.
                </p>
              </div>
              <button 
                onClick={() => setShareModalClient(null)}
                className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              
              {/* Template 1: Full Email Welcome & Asset Request */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-orange-400" />
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
                className="px-4 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-white font-medium"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
