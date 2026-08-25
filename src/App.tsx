import React, { useState, useEffect } from 'react';
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
import { User } from '@supabase/supabase-js';

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
    try {
      const { data: pData, error: pError } = await supabase.from('projects').select('*');
      if (pError) throw pError;
      
      const { data: iData, error: iError } = await supabase.from('invoices').select('*');
      if (iError) throw iError;
      
      // Map DB snake_case columns back to camelCase for the frontend
      setProjects(pData.map((d: any) => ({
        id: d.id,
        clientName: d.client_name,
        companyName: d.company_name,
        tier: d.tier,
        status: d.status,
        updatedAt: d.updated_at,
        domain: d.domain,
        ownerId: d.owner_id,
        blueprint: d.blueprint
      })));
      
      setInvoices(iData.map((d: any) => ({
        id: d.id,
        projectId: d.project_id,
        clientName: d.client_name,
        amount: d.amount,
        status: d.status,
        issueDate: d.issue_date,
        dueDate: d.due_date,
        ownerId: d.owner_id
      })));
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    if (user) fetchData();
    else {
      setProjects([]);
      setInvoices([]);
    }
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
      const response = await fetch('/api/invoice', {
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

      // 2. Save the generated invoice locally to Supabase
      const { error } = await supabase.from('invoices').insert({
        id: invoiceId,
        project_id: newInvoiceData.projectId,
        client_name: newInvoiceData.clientName,
        amount: newInvoiceData.amount,
        status: newInvoiceData.status,
        issue_date: newInvoiceData.issueDate,
        due_date: newInvoiceData.dueDate,
        owner_id: user.id
      });
      
      if (error) throw error;

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
        tagline: client.tagline || 'Courtroom Integrity. Dedicated Leadership.',
        description: client.description || 'Dedicated Texas business delivering premier quality and service.',
        phone: client.phone || '(512) 555-TXSONS',
        email: client.email || 'contact@txsons.com',
        address: client.address || 'Austin, TX',
        hours: 'Mon - Fri: 8:00 AM - 6:00 PM',
        heroImage: client.heroImage || 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&q=80&w=1200',
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
      const { error } = await supabase.from('projects').delete().eq('id', projectId);
      if (error) throw error;
      setProjects(projects.filter(p => p.id !== projectId));
    } catch (err) {
      console.error('Failed to delete project:', err);
      alert('Failed to delete project. Check console for details.');
    }
  };

  const handleSaveProjectFromModal = async (updatedProject: Project) => {
    try {
      setProjects(prev => {
        const exists = prev.some(p => p.id === updatedProject.id);
        const next = exists ? prev.map(p => p.id === updatedProject.id ? updatedProject : p) : [updatedProject, ...prev];
        try {
          localStorage.setItem('txsons_projects', JSON.stringify(next));
        } catch {}
        return next;
      });

      if (updatedProject.blueprint) {
        try {
          const savedCustom = localStorage.getItem('txsons_custom_blueprints');
          if (savedCustom) {
            let parsed = JSON.parse(savedCustom);
            parsed = parsed.map((b: any) => b.id === updatedProject.blueprint.id || b.profile?.name === updatedProject.blueprint.profile?.name ? updatedProject.blueprint : b);
            localStorage.setItem('txsons_custom_blueprints', JSON.stringify(parsed));
          }
        } catch {}
      }

      if (user) {
        const { error } = await supabase.from('projects').upsert({
          id: updatedProject.id,
          company_name: updatedProject.companyName,
          client_name: updatedProject.clientName,
          status: updatedProject.status,
          tier: updatedProject.tier,
          domain: updatedProject.domain,
          updated_at: new Date().toISOString(),
          blueprint: updatedProject.blueprint
        });
        if (error) console.warn('Supabase upsert warning:', error);
      }
    } catch (err) {
      console.warn('Error saving project to Supabase:', err);
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
    <div className="flex h-screen overflow-hidden bg-stone-50">
      
      {/* Sidebar Navigation */}
      <Sidebar 
        currentView={currentView} 
        onNavigate={(view) => {
          setSelectedClientSnapshot(null);
          setCurrentView(view);
        }} 
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header */}
        <TopBar 
          currentView={currentView} 
          onLogout={handleLogout} 
        />

        {/* Main Canvas Area */}
        {currentView === 'agent-builder' ? (
          <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
            <AgentBuilderStudio initialSnapshot={selectedClientSnapshot} />
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
          <main className="flex-1 overflow-y-auto p-8 pb-32">
            <div className="max-w-6xl mx-auto pb-16">
              {currentView === 'dashboard' && (
                <DashboardOverview projects={projects} />
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
                    setIntakePrefill({ 
                      businessName: prospect.displayName || prospect.name || '',
                      email: prospect.email || '',
                      phone: prospect.phone || '',
                      clientContact: prospect.name || ''
                    });
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
