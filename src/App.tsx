import React, { useState, useEffect } from 'react';
import { apiFetch } from './api';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import DashboardOverview from './components/DashboardOverview';
import ProjectList from './components/ProjectList';
import BillingView from './components/BillingView';
import GenerateInvoiceModal from './components/GenerateInvoiceModal';
import LandingPage from './components/LandingPage';
import ProspectsView from './components/ProspectsView';
import AgentBuilderStudio, { ProjectSnapshot } from './components/AgentBuilder/AgentBuilderStudio';
import ClientIntakeView from './components/ClientIntake/ClientIntakeView';
import SettingsView from './components/SettingsView';
import { Project, Invoice, ViewState, ClientIntake } from './types';
import { supabase, handleSupabaseError } from './supabase';
import { prospectToIntakePrefill } from './utils/prospectToIntake';
import { User } from '@supabase/supabase-js';
import {
  listProjects, listInvoices, saveProject, removeProject, saveInvoice,
  saveBlueprint, runBackfill,
} from './store';

/**
 * Cosmetic pre-flight check only — it reads the settings cache to fail fast on an
 * obviously wrong account. The real gate is ADMIN_EMAILS on the server
 * (lib/auth.ts). This has to read the cache rather than the store because it runs
 * before a session exists.
 */
const getAuthorizedEmails = (): string[] => {
  try {
    const saved = localStorage.getItem('txsons_studio_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.authorizedEmails && Array.isArray(parsed.authorizedEmails)) {
        return parsed.authorizedEmails.map((e: string) => e.toLowerCase());
      }
    }
  } catch {}
  return ['contact.txsons@gmail.com', 'morganmv145@gmail.com'];
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  
  const [currentView, setCurrentView] = useState<ViewState>(() => {
    return (localStorage.getItem('txsons_current_view') as ViewState) || 'dashboard';
  });
  
  useEffect(() => {
    localStorage.setItem('txsons_current_view', currentView);
  }, [currentView]);

  const [projects, setProjects] = useState<Project[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  
  const [intakePrefill, setIntakePrefill] = useState<Partial<ClientIntake>>(() => {
    try {
      const saved = localStorage.getItem('txsons_intake_prefill');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });

  useEffect(() => {
    localStorage.setItem('txsons_intake_prefill', JSON.stringify(intakePrefill));
  }, [intakePrefill]);

  const [selectedClientSnapshot, setSelectedClientSnapshot] = useState<ProjectSnapshot | null>(null);
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  useEffect(() => {
    const checkUser = async (currentUser: User | null) => {
      if (currentUser && currentUser.email) {
        const email = currentUser.email.toLowerCase();
        const authorized = getAuthorizedEmails();
        if (authorized.includes(email)) {
          setUser(currentUser);
        } else {
          await supabase.auth.signOut();
          setUser(null);
          setLoginError("Unauthorized. This portal is restricted to authorized administrators.");
        }
      } else {
        setUser(null);
      }
      setLoadingAuth(false);
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      checkUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      checkUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchData = async () => {
    if (!user) return;
    // Repos handle the column mapping and fall back to cache if the read fails.
    setProjects(await listProjects());
    setInvoices(await listInvoices());
  };

  useEffect(() => {
    if (!user) {
      setProjects([]);
      setInvoices([]);
      return;
    }
    // Push any browser-only data up before the first read, so a freshly
    // migrated account sees its existing work instead of an empty dashboard.
    (async () => {
      await runBackfill();
      await fetchData();
    })();
  }, [user]);

  const handleLogin = async () => {
    try {
      setIsLoggingIn(true);
      setLoginError(null);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin }
      });
      if (error) throw error;
    } catch (error: any) {
      console.error('Login failed', error);
      setLoginError(error.message || 'Failed to sign in.');
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleGenerateInvoice = async (newInvoiceData: Omit<Invoice, 'id' | 'ownerId'>) => {
    if (!user) return;
    const invoiceId = `INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3, '0')}`;
    
    try {
      // 1. Hit the backend to process Stripe invoice
      const response = await apiFetch('/api/invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: newInvoiceData.amount,
          clientName: newInvoiceData.clientName
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate invoice via Stripe API.');
      }

      // 2. Record the invoice
      await saveInvoice({ ...newInvoiceData, id: invoiceId, ownerId: user.id });

      await fetchData(); // Refresh local state
      setIsGeneratingInvoice(false);
    } catch (error) {
      console.error('Invoice Generation Error:', error);
      handleSupabaseError(error);
    }
  };

  const handleLaunchStudioFromClient = (client: ClientIntake) => {
    const snapshot: ProjectSnapshot = {
      id: `prj-${Date.now()}`,
      prompt: `Generated from Client Intake: ${client.businessName}`,
      timestamp: new Date().toLocaleTimeString(),
      profile: {
        name: client.businessName,
        // Fallbacks are deliberately neutral. They used to be judicial-campaign
        // copy ("Courtroom Integrity. Dedicated Leadership.") and Texas Sons' own
        // contact details, which meant a BBQ joint's demo could open with a line
        // about the rule of law and list our phone number as theirs.
        tagline: client.tagline || `${client.businessName} — Proudly Serving Texas`,
        description: client.description || 'Dedicated Texas business delivering premier quality and service.',
        // undefined rather than '' so each block applies its own default; an
        // empty string would slip past a default parameter and render blank.
        phone: client.phone || undefined,
        email: client.email || undefined,
        address: client.address || undefined,
        // Real opening hours from Google Places when we have them.
        hours: client.hours || undefined,
        // Their actual storefront photo. The old hardcoded Unsplash fallback here
        // was the single biggest reason every demo looked like every other demo.
        heroImage: client.heroImage || undefined,
        galleryImages: client.galleryImages || undefined,
        category: client.category,
        theme: client.theme,
        primaryColor: client.primaryColor || '#00081e',
        accentColor: client.accentColor || '#C5A059'
      },
      services: (client.services && client.services.length > 0) ? client.services : [
        { title: 'Core Platform Solution', description: 'Comprehensive execution tailored for your community and goals.', highlight: true }
      ],
      testimonials: (client.testimonials && client.testimonials.length > 0) ? client.testimonials : [
        { quote: 'Exceptional leadership and unmatched attention to detail.', author: 'Verified Partner', role: 'Austin, TX', rating: 5, verified: true }
      ],
      theme: client.theme,
      heroVariant: 'split',
      badges: client.badges && client.badges.length > 0 ? client.badges : ['25+ Years Experience', 'Satisfaction Guaranteed', 'Locally Owned'],
      proofBadgeText: client.proofBadgeText || 'Top Rated · 100% Guaranteed',
      seo: {
        title: `${client.businessName} — ${client.tagline || 'Local Business'}`,
        description: client.description || `Contact ${client.businessName} in ${client.address || 'Texas'} for professional services. ${client.phone || ''}`,
      }
    };

    setSelectedClientSnapshot(snapshot);
    setCurrentView('agent-builder');
  };

  const handleEditProject = (project: Project) => {
    if (project.blueprint) {
      // Override the blueprint ID with the actual DB project ID to prevent creating duplicates on save
      setSelectedClientSnapshot({
        ...project.blueprint,
        id: `prj-${project.id}`
      });
    } else {
      setSelectedClientSnapshot({
        id: `prj-${project.id}`,
        prompt: `Loaded Project: ${project.companyName}`,
        timestamp: new Date().toLocaleTimeString(),
        profile: {
          name: project.companyName,
          tagline: `Official Platform for ${project.companyName}`,
          description: 'Texas enterprise platform.',
          phone: '(512) 555-0100',
          email: 'contact@example.com',
          category: 'Campaign & Leadership',
          theme: 'campaign-navy',
          primaryColor: '#00081e',
          accentColor: '#C5A059'
        },
        services: [],
        testimonials: [],
        theme: 'campaign-navy',
        heroVariant: 'split'
      });
    }
    setCurrentView('agent-builder');
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      await removeProject(projectId);
      setProjects(prev => prev.filter(p => p.id !== projectId));
    } catch (err) {
      console.error('Failed to delete project:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete project.');
    }
  };

  const handleSaveProjectFromModal = async (updatedProject: Project) => {
    // Optimistic: reflect the edit immediately, reconcile if the write fails.
    const previous = projects;
    setProjects(prev => {
      const exists = prev.some(p => p.id === updatedProject.id);
      return exists
        ? prev.map(p => (p.id === updatedProject.id ? updatedProject : p))
        : [updatedProject, ...prev];
    });

    try {
      await saveProject(updatedProject);

      // A project's blueprint is also a library entry — keep the two in step so
      // editing a project doesn't leave a stale copy in the blueprint library.
      if (updatedProject.blueprint?.id) {
        await saveBlueprint(updatedProject.blueprint);
      }
    } catch (err) {
      console.error('Failed to save project:', err);
      setProjects(previous);
      alert(err instanceof Error ? err.message : 'Failed to save project.');
    }
  };

  const handleInvoiceFromClient = (client: ClientIntake) => {
    setIntakePrefill(prev => ({
      ...prev,
      businessName: client.businessName,
      clientContact: client.clientContact,
      email: client.email,
      phone: client.phone,
    }));
    setIsGeneratingInvoice(true);
  };

  if (loadingAuth) {
    return <div className="flex h-screen items-center justify-center bg-stone-950 text-stone-500">Loading TX Sons Websites...</div>;
  }

  if (!user) {
    return (
      <LandingPage 
        onLogin={handleLogin} 
        isLoggingIn={isLoggingIn} 
        loginError={loginError} 
      />
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-stone-950">
      
      {/* Sidebar Navigation (Desktop + Mobile Slide-Out Drawer) */}
      <Sidebar 
        currentView={currentView} 
        isMobileOpen={isMobileNavOpen}
        onCloseMobile={() => setIsMobileNavOpen(false)}
        onNavigate={(view) => {
          setSelectedClientSnapshot(null);
          setCurrentView(view);
          setIsMobileNavOpen(false);
        }} 
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header (Shown on standard views; 1-Click Studio has its own full control header) */}
        {currentView !== 'agent-builder' && (
          <TopBar 
            currentView={currentView} 
            onLogout={handleLogout}
            onOpenMobileNav={() => setIsMobileNavOpen(true)}
          />
        )}

        {/* Main Canvas Area */}
        {currentView === 'agent-builder' ? (
          <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
            <AgentBuilderStudio 
              initialSnapshot={selectedClientSnapshot} 
              onOpenAppNav={() => setIsMobileNavOpen(true)}
            />
          </main>
        ) : currentView === 'clients' ? (
          <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
            <ClientIntakeView 
              onLaunchStudio={handleLaunchStudioFromClient}
              onInvoiceClient={handleInvoiceFromClient}
              intakePrefill={intakePrefill}
            />
          </main>
        ) : currentView === 'settings' ? (
          <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
            <SettingsView />
          </main>
        ) : (
          <main className="flex-1 overflow-y-auto bg-stone-950 pb-24">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-16">
              {currentView === 'dashboard' && (
                <DashboardOverview 
                  projects={projects} 
                  onNavigate={setCurrentView}
                />
              )}
              
              {currentView === 'projects' && (
                <ProjectList 
                  projects={projects} 
                  onNewProject={() => {
                    setIntakePrefill({});
                    setCurrentView('clients');
                  }} 
                  onEditProject={handleEditProject}
                  onDeleteProject={handleDeleteProject}
                  onSaveProject={handleSaveProjectFromModal}
                />
              )}

              {currentView === 'prospects' && (
                <ProspectsView
                  onConvert={(prospect) => {
                    // Carries the business's real photos, Google reviews, hours
                    // and phone into the intake. This used to copy four fields
                    // and drop the rest, which is why every demo fell back to
                    // the same stock hero image and invented testimonial.
                    setIntakePrefill(prospectToIntakePrefill(prospect));
                    setCurrentView('clients');
                  }}
                />
              )}

              {currentView === 'billing' && (
                <BillingView 
                  invoices={invoices}
                  onNewInvoice={() => setIsGeneratingInvoice(true)}
                />
              )}
            </div>
          </main>
        )}
      </div>

      {/* Generating Invoice Modal Portal */}
      {isGeneratingInvoice && (
        <GenerateInvoiceModal 
          projects={projects}
          onClose={() => setIsGeneratingInvoice(false)}
          onGenerate={handleGenerateInvoice}
        />
      )}
      
    </div>
  );
}
