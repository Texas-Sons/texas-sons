import React from 'react';
import { ShieldCheck, Zap, Rocket, ChevronRight, LogIn } from 'lucide-react';
import TexasSonsLogo from './TexasSonsLogo';

interface LandingPageProps {
  onLogin: () => void;
  isLoggingIn: boolean;
  loginError: string | null;
}

export default function LandingPage({ onLogin, isLoggingIn, loginError }: LandingPageProps) {
  const tiers = [
    {
      name: 'Spur (Static)',
      price: 'Starting at $1,500',
      description: 'Clean, high-performance static websites perfect for portfolios, landing pages, and local businesses establishing their digital frontier.',
      icon: ShieldCheck,
      features: ['Lightning Fast Load Times', 'Mobile Responsive', 'SEO Optimized', 'Contact Forms']
    },
    {
      name: 'Ranger (Flow)',
      price: 'Starting at $3,500',
      description: 'Dynamic content and CMS integrations. Ideal for businesses that need to regularly publish content, manage inventories, or host blogs.',
      icon: Zap,
      features: ['Content Management System', 'Dynamic Routing', 'Analytics Integration', 'Newsletter Capture']
    },
    {
      name: 'Maverick (Engine)',
      price: 'Starting at $7,500',
      description: 'Full-stack web applications, custom client portals, and SaaS platforms engineered for scale and complex business logic.',
      icon: Rocket,
      features: ['Custom Backend Architecture', 'User Authentication', 'Database Design', 'Payment Processing']
    }
  ];

  return (
    <div className="min-h-screen bg-stone-950 text-stone-300 font-sans selection:bg-orange-500/30">
      {/* Navigation */}
      <nav className="border-b border-stone-800/60 bg-stone-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-default"
            onDoubleClick={onLogin}
            title="Texas Sons Websites"
          >
            <TexasSonsLogo className="w-12 h-12" />
            <div className="flex items-baseline">
              <span className="text-white font-texas text-3xl font-normal tracking-wide">Texas Sons</span>
              <span className="ml-2 text-orange-500 font-sans text-sm font-bold tracking-widest uppercase">- WEBSITES</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-24 px-6 border-b border-stone-800/60 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-orange-600/10 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-5xl md:text-7xl font-display font-bold text-white mb-6 tracking-tight">
            Digital craftsmanship for the <span className="text-orange-500">modern frontier.</span>
          </h1>
          <p className="text-xl text-stone-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            We forge robust, high-performance web experiences. From rugged static landing pages to complex full-stack delivery engines.
          </p>
          
          {loginError && (
            <div className="mb-8 max-w-md mx-auto p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-left shadow-lg">
              <div className="font-semibold mb-1">Authentication Error</div>
              {loginError}
              {loginError.includes('new tab') && (
                <div className="mt-2 text-xs opacity-80 border-t border-red-500/20 pt-2">
                  Tip: Right-click the app preview frame and select "Open frame in new tab" if popups are being blocked.
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Services Section */}
      <section className="py-24 px-6 bg-stone-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-display font-bold text-white mb-4">Our Architecture Tiers</h2>
            <p className="text-stone-400 max-w-2xl mx-auto">Tailored solutions built to scale with your ambitions.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {tiers.map((tier, idx) => (
              <div key={idx} className="bg-stone-900 border border-stone-800 rounded-2xl p-8 hover:border-orange-500/50 transition-colors group flex flex-col">
                <div className="w-12 h-12 bg-stone-950 rounded-xl border border-stone-800 flex items-center justify-center mb-6 group-hover:bg-orange-500/10 group-hover:border-orange-500/30 transition-colors">
                  <tier.icon className="w-6 h-6 text-orange-500" />
                </div>
                <h3 className="text-2xl font-display font-bold text-white mb-2">{tier.name}</h3>
                <div className="text-orange-400 font-medium mb-4">{tier.price}</div>
                <p className="text-stone-400 mb-8 flex-1 leading-relaxed">{tier.description}</p>
                
                <ul className="space-y-3">
                  {tier.features.map((feat, fidx) => (
                    <li key={fidx} className="flex items-center text-sm text-stone-300">
                      <ChevronRight className="w-4 h-4 text-orange-600 mr-2 flex-shrink-0" />
                      {feat}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-800 bg-stone-950 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-stone-500">
          <div className="flex items-center gap-2">
            <TexasSonsLogo className="w-6 h-6" />
            <div className="flex items-baseline">
              <span className="font-texas font-normal text-stone-300 text-lg tracking-wide">Texas Sons</span>
              <span className="ml-1.5 text-orange-500 font-sans text-xs font-bold tracking-widest uppercase">- WEBSITES</span>
            </div>
          </div>
          <p>© {new Date().getFullYear()} Texas Sons Websites. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
