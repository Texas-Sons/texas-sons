import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import DashboardOverview from './components/DashboardOverview';
import ProjectList from './components/ProjectList';
import ProvisionSiteModal from './components/ProvisionSiteModal';
import BillingView from './components/BillingView';
import GenerateInvoiceModal from './components/GenerateInvoiceModal';
import LandingPage from './components/LandingPage';
import ProspectsView from './components/ProspectsView';
import TemplatesView from './components/TemplatesView';
import { Project, Invoice, ViewState } from './types';
import { supabase, handleSupabaseError } from './supabase';
import { User } from '@supabase/supabase-js';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [projects, setProjects] = useState<Project[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [provisioningData, setProvisioningData] = useState<{companyName?: string}>({});
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async (currentUser: User | null) => {
      if (currentUser && currentUser.email) {
        const email = currentUser.email.toLowerCase();
        if (email === 'contact.txsons@gmail.com' || email === 'morganmv145@gmail.com') {
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
        ownerId: d.owner_id
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

  const handleProvisionSite = async (newProjectData: Omit<Project, 'id' | 'status' | 'updatedAt' | 'ownerId'>) => {
    if (!user) return;
    const projectId = `prj-${Date.now()}`;
    
    try {
      const { error } = await supabase.from('projects').insert({
        id: projectId,
        client_name: newProjectData.clientName,
        company_name: newProjectData.companyName,
        tier: newProjectData.tier,
        status: 'Scaffolding',
        domain: newProjectData.domain || null,
        owner_id: user.id,
        updated_at: new Date().toISOString()
      });
      
      if (error) throw error;
      
      await fetchData(); // Refresh local state
      setIsProvisioning(false);
      setCurrentView('projects');
    } catch (error) {
      handleSupabaseError(error);
    }
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

  if (loadingAuth) {
    return <div className="flex h-screen items-center justify-center bg-stone-950 text-stone-500">Loading Texas Sons Websites...</div>;
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
      <Sidebar currentView={currentView} onNavigate={setCurrentView} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header */}
        <TopBar currentView={currentView} onLogout={handleLogout} />

        {/* Scrollable Main Canvas */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto">
            {currentView === 'dashboard' && (
              <DashboardOverview projects={projects} />
            )}
            
            {currentView === 'projects' && (
              <ProjectList 
                projects={projects} 
                onNewProject={() => {
                  setProvisioningData({});
                  setIsProvisioning(true);
                }} 
              />
            )}

            {currentView === 'prospects' && (
              <ProspectsView 
                onConvert={(prospect) => {
                  setProvisioningData({ companyName: prospect.displayName || '' });
                  setIsProvisioning(true);
                }}
              />
            )}

            {currentView === 'billing' && (
              <BillingView 
                invoices={invoices}
                onNewInvoice={() => setIsGeneratingInvoice(true)}
              />
            )}

            {currentView === 'templates' && <TemplatesView />}

            {currentView === 'agent-builder' && (
              <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed border-orange-200 rounded-2xl bg-orange-50/30 text-stone-600 p-8">
                <div className="w-16 h-16 bg-white border border-orange-200 rounded-2xl shadow-sm flex items-center justify-center mb-4">
                  <span className="text-3xl">✨</span>
                </div>
                <h2 className="text-xl font-bold text-stone-900 mb-2">AI Builder Studio (Coming Soon)</h2>
                <p className="text-center text-sm max-w-md text-stone-500">
                  This workspace will be powered by the Antigravity Agent via the Gemini Interactions API. You will be able to enter a prompt and watch the AI iteratively write, test, and render full Next.js project codebases in a live Sandpack environment.
                </p>
                <button className="mt-6 px-4 py-2 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors">
                  Prepare Antigravity Endpoint
                </button>
              </div>
            )}

            {/* Placeholder for other views */}
            {['clients', 'settings'].includes(currentView) && (
              <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-stone-200 rounded-2xl bg-white text-stone-500">
                <p className="text-sm font-medium">This module is part of the Texas Sons Websites Internal System.</p>
                <p className="text-xs mt-1">Connect API endpoints to enable this view.</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Provisioning Modal Portal */}
      {isProvisioning && (
        <ProvisionSiteModal 
          initialData={provisioningData}
          onClose={() => setIsProvisioning(false)} 
          onProvision={handleProvisionSite} 
        />
      )}

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
