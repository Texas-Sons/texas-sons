import React, { useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import { Project, Tier } from '../types';

interface ProvisionSiteModalProps {
  onClose: () => void;
  onProvision: (project: Omit<Project, 'id' | 'status' | 'updatedAt' | 'ownerId'>) => void;
  initialData?: {
    companyName?: string;
  };
}

export default function ProvisionSiteModal({ onClose, onProvision, initialData }: ProvisionSiteModalProps) {
  const [companyName, setCompanyName] = useState(initialData?.companyName || '');
  const [clientName, setClientName] = useState('');
  const [tier, setTier] = useState<Tier>('Basic Website');
  const [domain, setDomain] = useState('');
  const [showTechDetails, setShowTechDetails] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onProvision({
      companyName,
      clientName,
      tier,
      domain
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="px-6 py-5 border-b border-stone-200 flex items-center justify-between bg-stone-50/50">
          <div>
            <h3 className="text-lg font-display font-semibold text-stone-900">Provision New Environment</h3>
            <p className="text-sm text-stone-500 mt-1">Deploy a new Texas Sons boilerplate from intake data.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <form id="provision-form" onSubmit={handleSubmit} className="space-y-5">
            
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-stone-900 uppercase tracking-wider">Client Identity</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1.5">Company Name</label>
                  <input 
                    type="text" 
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Acme Floral"
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1.5">Client Contact</label>
                  <input 
                    type="text" 
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="e.g. Jane Doe"
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">Target Domain</label>
                <div className="flex rounded-lg shadow-sm">
                  <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-stone-300 bg-stone-50 text-stone-500 sm:text-sm">
                    https://
                  </span>
                  <input 
                    type="text" 
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder="acmefloral.com"
                    className="flex-1 px-3 py-2 bg-white border border-stone-300 rounded-none rounded-r-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm z-10"
                  />
                </div>
              </div>
            </div>

            <div className="pt-5 border-t border-stone-200 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-stone-900 uppercase tracking-wider">Product Type</h4>
                <button 
                  type="button" 
                  onClick={() => setShowTechDetails(!showTechDetails)}
                  className="text-xs font-medium text-orange-600 hover:text-orange-700"
                >
                  {showTechDetails ? 'Hide Tech Specs' : 'View Tech Specs'}
                </button>
              </div>
              
              <div className="space-y-3">
                
                <label className={`flex p-4 border rounded-xl cursor-pointer transition-all ${tier === 'Basic Website' ? 'border-orange-500 ring-1 ring-orange-500 bg-orange-50/30' : 'border-stone-200 hover:border-stone-300'}`}>
                  <input type="radio" name="tier" className="sr-only" checked={tier === 'Basic Website'} onChange={() => setTier('Basic Website')} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-stone-900">Basic Website</span>
                      <span className="text-xs font-medium text-stone-500 bg-stone-100 border border-stone-200 px-2 py-0.5 rounded-full">Essential</span>
                    </div>
                    <p className="text-xs text-stone-500 mt-1">A simple, professional website for your business to establish trust.</p>
                    {showTechDetails && (
                      <div className="mt-3 pt-3 border-t border-stone-200">
                        <p className="text-[11px] text-stone-400 leading-relaxed font-mono">
                          Architecture: Static / CSR<br/>
                          Tech Stack: React, Vite, Tailwind CSS<br/>
                          Hosting: Cloudflare Pages / Vercel Global Edge<br/>
                          Best For: Fast-loading portfolios, landing pages, digital business cards.
                        </p>
                      </div>
                    )}
                  </div>
                </label>

                <label className={`flex p-4 border rounded-xl cursor-pointer transition-all ${tier === 'Lead Generation Site' ? 'border-orange-500 ring-1 ring-orange-500 bg-orange-50/30' : 'border-stone-200 hover:border-stone-300'}`}>
                  <input type="radio" name="tier" className="sr-only" checked={tier === 'Lead Generation Site'} onChange={() => setTier('Lead Generation Site')} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-stone-900">Lead Generation Site</span>
                      <span className="text-xs font-medium text-stone-500 bg-stone-100 border border-stone-200 px-2 py-0.5 rounded-full">Growth</span>
                    </div>
                    <p className="text-xs text-stone-500 mt-1">A website designed to capture leads, schedule appointments, and manage content.</p>
                    {showTechDetails && (
                      <div className="mt-3 pt-3 border-t border-stone-200">
                        <p className="text-[11px] text-stone-400 leading-relaxed font-mono">
                          Architecture: Flow / CMS Driven<br/>
                          Tech Stack: React, Serverless API Routes<br/>
                          Integrations: Email routing, Webhook forwarding, Headless CMS<br/>
                          Best For: Service businesses booking appointments & collecting data.
                        </p>
                      </div>
                    )}
                  </div>
                </label>

                <label className={`flex p-4 border rounded-xl cursor-pointer transition-all ${tier === 'Full Custom Application' ? 'border-orange-500 ring-1 ring-orange-500 bg-orange-50/30' : 'border-stone-200 hover:border-stone-300'}`}>
                  <input type="radio" name="tier" className="sr-only" checked={tier === 'Full Custom Application'} onChange={() => setTier('Full Custom Application')} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-stone-900">Full Custom Application</span>
                      <span className="text-xs font-medium text-orange-600 bg-orange-100 border border-orange-200 px-2 py-0.5 rounded-full">Advanced</span>
                    </div>
                    <p className="text-xs text-stone-500 mt-1">A complete software platform with user logins, custom portals, and advanced features.</p>
                    {showTechDetails && (
                      <div className="mt-3 pt-3 border-t border-stone-200">
                        <p className="text-[11px] text-stone-400 leading-relaxed font-mono">
                          Architecture: Full-Stack Multi-Tenant SSR<br/>
                          Tech Stack: Next.js 15 (App Router), TypeScript, Supabase<br/>
                          Infrastructure: PostgreSQL DB, Role-Level Security (RLS)<br/>
                          Best For: Client portals, SaaS products, advanced data dashboards.
                        </p>
                      </div>
                    )}
                  </div>
                </label>

              </div>
            </div>
            
          </form>
        </div>

        <div className="px-6 py-4 border-t border-stone-200 bg-stone-50/50 flex justify-end space-x-3">
          <button 
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit"
            form="provision-form"
            className="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-lg hover:bg-orange-500 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 flex items-center transition-colors"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Initialize Architecture
          </button>
        </div>

      </div>
    </div>
  );
}
