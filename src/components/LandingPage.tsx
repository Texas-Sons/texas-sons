import React, { useEffect, useRef, useState } from 'react';
import {
  ShieldCheck, Zap, Rocket, ChevronRight, ArrowRight,
  ExternalLink, Star, BarChart3, Globe, CheckCircle2, Sparkles
} from 'lucide-react';
import TexasSonsLogo from './TexasSonsLogo';

interface LandingPageProps {
  onLogin: () => void;
  isLoggingIn: boolean;
  loginError: string | null;
}

const LIVE_DEMOS = [
  {
    label: 'Deborah Dietzmann for Judge',
    sublabel: 'Bexar County · Judicial Campaign',
    url: 'https://deborahdietzmannforjudge.com/',
    theme: 'Judicial Navy & Gold',
    tags: ['Campaign', 'Live Production'],
    color: '#C5A059',
    bgFrom: '#00081e',
    bgTo: '#0a1f44',
  },
];

const TIERS = [
  {
    name: 'Starter Site',
    subtitle: 'Informational & Digital Presence',
    upfront: '$750',
    upfrontNote: 'or $600 with 12-mo Care Plan',
    recurring: '$25/mo (Hosting) or $49/mo (Care Plan)',
    description: 'Static informational sites and clean, high-performance digital presence tailored to your brand.',
    icon: ShieldCheck,
    features: [
      'Bespoke Mobile-First Design',
      'Ultra-Fast Cloud Edge Delivery',
      'Core SEO & Local Search Setup',
      'Lead & Contact Capture Forms',
      'SSL, Security & Uptime Monitoring',
    ],
    accent: '#f97316',
  },
  {
    name: 'Custom Checkout',
    subtitle: 'Dynamic Portals & Payments',
    upfront: '$1,499',
    upfrontNote: 'Turnkey Implementation',
    recurring: '$99/mo',
    description: 'Custom checkout flows, client self-service portals, and dynamic lead capture pipelines.',
    icon: Zap,
    features: [
      'Everything in Starter Site',
      'Custom Stripe Checkout & Payment Flows',
      'Client Self-Service & Booking Portals',
      'Automated Lead Intake & Email Alerts',
      'CRM & Central Database Sync',
    ],
    accent: '#C5A059',
    featured: true,
  },
  {
    name: 'Operations Pro',
    subtitle: 'Full-Stack Integrations & Scale',
    upfront: '$2,999',
    upfrontNote: 'Enterprise Architecture',
    recurring: '$199 – $299/mo',
    description: 'Real-time synchronization, complex operational workflows, and high-touch dedicated support.',
    icon: Rocket,
    features: [
      'Everything in Custom Checkout',
      'Real-Time Multi-System Synchronization',
      'Custom Business Logic & Webhook Integrations',
      'High-Touch Priority Engineering Support',
      'Operational Reliability & Uptime SLA',
    ],
    accent: '#a855f7',
  },
];

export default function LandingPage({ onLogin, isLoggingIn, loginError }: LandingPageProps) {
  const heroRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#1b1410] text-[#dcd1bf] font-brasada-body selection:bg-[#d4693f]/30 overflow-x-hidden">

      {/* ── Nav ──────────────────────────────────────────────────────────── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrollY > 40 ? 'border-b border-[#3a2c20]/80 bg-[#1b1410]/90 backdrop-blur-xl' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div
            className="flex items-center gap-3 cursor-default"
            onDoubleClick={onLogin}
            title="Brasada Studio — Double-click to sign in"
          >
            <TexasSonsLogo className="w-11 h-11" variant="brasada" />
            <div className="flex items-baseline">
              <span className="text-[#f4ecdf] font-brasada text-2xl font-normal tracking-tight">Brasada</span>
              <span className="ml-2 text-[#d4693f] font-sans text-xs font-bold tracking-widest uppercase">Studio</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {LIVE_DEMOS.map(d => (
              <a
                key={d.url}
                href={d.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:flex items-center gap-1.5 text-xs text-[#8d7d68] hover:text-[#d4693f] transition-colors"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#7d8a6a] animate-pulse" />
                {d.label.split(' ')[0]} {d.label.split(' ')[1]}
              </a>
            ))}
            <button
              id="landing-sign-in-btn"
              onClick={onLogin}
              disabled={isLoggingIn}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#a8432b] hover:bg-[#d4693f] text-[#f4ecdf] text-sm font-semibold transition-all hover:scale-105 active:scale-100 shadow-lg shadow-[#a8432b]/20 disabled:opacity-60"
            >
              {isLoggingIn ? (
                <span className="animate-pulse">Signing in…</span>
              ) : (
                <>Sign In <ArrowRight className="w-3.5 h-3.5" /></>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-12 overflow-hidden">
        {/* Ambient gradient blobs */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ transform: `translateY(${scrollY * 0.15}px)` }}
        >
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-[#a8432b]/8 blur-[140px] rounded-full" />
          <div className="absolute top-1/4 left-1/4 w-[400px] h-[300px] bg-amber-500/5 blur-[100px] rounded-full" />
          <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[200px] bg-blue-600/5 blur-[80px] rounded-full" />
        </div>

        {/* Grid background lines */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(to right, #f97316 1px, transparent 1px), linear-gradient(to bottom, #f97316 1px, transparent 1px)`,
            backgroundSize: '80px 80px',
          }}
        />

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#a8432b]/30 bg-[#d4693f]/8 text-[#d4693f] text-xs font-semibold mb-8 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5" />
            Brasada Studio · Custom Web Development & Infrastructure
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-brasada font-bold text-[#f4ecdf] mb-6 tracking-tight leading-[0.95]">
            Websites that{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(135deg, #a8432b 0%, #d4693f 50%, #c4b39c 100%)' }}
            >
              win votes
            </span>
            {' '}&{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(135deg, #d4693f 0%, #a8432b 100%)' }}
            >
              grow businesses.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-[#8d7d68] mb-10 max-w-2xl mx-auto leading-relaxed">
            Handcrafted, lightning-fast digital experiences, dynamic client portals, and bespoke web platforms engineered for Texas leaders and growing companies.
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

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              id="hero-inquiry-btn"
              href="mailto:contact.txsons@gmail.com?subject=Custom%20Website%20Inquiry%20-%20Brasada%20Studio"
              className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-[#a8432b] hover:bg-[#d4693f] text-[#f4ecdf] text-base font-bold transition-all hover:scale-105 active:scale-100 shadow-2xl shadow-[#a8432b]/30"
            >
              <Zap className="w-5 h-5" />
              Request a Project Quote
            </a>
            <a
              id="hero-demo-link-deborah"
              href={LIVE_DEMOS[0].url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-8 py-4 rounded-2xl border border-[#4a3826] text-[#c4b39c] hover:text-[#f4ecdf] hover:border-[#8d7d68] text-base font-semibold transition-all hover:scale-[1.02]"
            >
              View Live Client Work <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Feature Highlights Row (Replaced fake metrics) */}
        <div className="relative z-10 mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl w-full border-t border-[#241b15] pt-10">
          <div className="text-center">
            <div className="text-sm font-bold text-[#f4ecdf] mb-1">Custom Engineered</div>
            <div className="text-xs text-[#8d7d68]">Zero Rigid Templates</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-bold text-[#f4ecdf] mb-1">Ultra-Fast Edge</div>
            <div className="text-xs text-[#8d7d68]">Global Cloudflare CDN</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-bold text-[#f4ecdf] mb-1">Mobile & Legal Safe</div>
            <div className="text-xs text-[#8d7d68]">100% Verified Standards</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-bold text-[#f4ecdf] mb-1">Direct Founder Support</div>
            <div className="text-xs text-[#8d7d68]">Pleasanton, Texas</div>
          </div>
        </div>
      </section>

      {/* ── Live Demo Showcase ────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-[#241b15]/30 border-y border-[#3a2c20]/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7d8a6a] animate-pulse" />
              Live Production Client Work
            </div>
            <h2 className="text-4xl md:text-5xl font-brasada font-bold text-[#f4ecdf] mb-4 tracking-tight">
              Featured Client Deployment
            </h2>
            <p className="text-[#8d7d68] max-w-xl mx-auto">
              Real high-stakes platforms deployed for Texas campaigns and leaders.
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            {LIVE_DEMOS.map(demo => (
              <a
                key={demo.url}
                id="demo-card-deborah"
                href={demo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative rounded-3xl overflow-hidden border border-[#3a2c20] hover:border-[#6b5f52] transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl block"
                style={{ background: `linear-gradient(135deg, ${demo.bgFrom} 0%, ${demo.bgTo} 100%)` }}
              >
                <div className="p-8 sm:p-10">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <p className="text-[11px] text-[#8d7d68] uppercase tracking-widest font-semibold mb-2">{demo.sublabel}</p>
                      <h3 className="text-3xl font-brasada font-bold text-[#f4ecdf] leading-tight">{demo.label}</h3>
                    </div>
                    <div className="p-3 rounded-2xl border border-white/10 bg-white/5 group-hover:scale-110 transition-transform">
                      <ExternalLink className="w-5 h-5 text-[#f4ecdf]/70" />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-8">
                    {demo.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5"
                        style={{ borderColor: `${demo.color}40`, color: demo.color, background: `${demo.color}15` }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#7d8a6a] animate-pulse" />
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 text-base font-bold" style={{ color: demo.color }}>
                    Explore Live Production Website <ChevronRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
                  </div>
                </div>

                {/* Decorative corner glow */}
                <div
                  className="absolute -bottom-20 -right-20 w-48 h-48 rounded-full blur-3xl opacity-30 group-hover:opacity-50 transition-opacity"
                  style={{ background: demo.color }}
                />
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── Architecture Tiers & Pricing ──────────────────────────────────── */}
      <section className="py-24 px-6 bg-[#241b15]/20 border-y border-[#3a2c20]/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 text-[#d4693f] text-xs font-bold uppercase tracking-widest mb-4">
              Transparent Pricing & Delivery
            </div>
            <h2 className="text-4xl md:text-5xl font-brasada font-bold text-[#f4ecdf] mb-4 tracking-tight">
              Simple, high-ROI development packages.
            </h2>
            <p className="text-[#8d7d68] max-w-xl mx-auto">
              From clean digital storefronts to dynamic transaction-based platforms, pick the scope that fits your objective.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {TIERS.map((tier, idx) => (
              <div
                key={idx}
                className={`relative rounded-3xl p-8 border flex flex-col transition-all hover:-translate-y-1 ${
                  tier.featured
                    ? 'border-[#a8432b]/50 bg-gradient-to-b from-[#d4693f]/8 to-[#241b15]/80 shadow-xl shadow-[#a8432b]/10'
                    : 'border-[#3a2c20] bg-[#241b15]/40 hover:border-[#4a3826]'
                }`}
              >
                {tier.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#a8432b] text-[#f4ecdf] text-[11px] font-black uppercase tracking-widest shadow-lg shadow-[#a8432b]/30">
                    Most Popular
                  </div>
                )}
                <div className="w-12 h-12 rounded-2xl bg-[#1b1410] border border-[#3a2c20] flex items-center justify-center mb-5" style={{ borderColor: `${tier.accent}30`, background: `${tier.accent}10` }}>
                  <tier.icon className="w-6 h-6" style={{ color: tier.accent }} />
                </div>
                <div className="mb-4">
                  <h3 className="text-2xl font-brasada font-bold text-[#f4ecdf]">{tier.name}</h3>
                  <span className="text-xs text-[#8d7d68] font-medium">{tier.subtitle}</span>
                </div>

                <div className="mb-4 p-4 rounded-2xl bg-[#1b1410]/60 border border-[#3a2c20]/80">
                  <div className="text-2xl font-black text-[#f4ecdf] flex items-baseline gap-1.5">
                    {tier.upfront}
                    <span className="text-xs text-[#8d7d68] font-normal">upfront build</span>
                  </div>
                  <div className="text-[11px] text-[#8d7d68] mt-0.5">{tier.upfrontNote}</div>
                  <div className="text-xs font-semibold text-[#d4693f] mt-2 pt-2 border-t border-[#3a2c20]/80">
                    {tier.recurring}
                  </div>
                </div>

                <p className="text-[#8d7d68] text-sm leading-relaxed mb-6 flex-1">{tier.description}</p>
                <ul className="space-y-2.5 mb-6">
                  {tier.features.map((feat, fi) => (
                    <li key={fi} className="flex items-center gap-2 text-sm text-[#c4b39c]">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: tier.accent }} />
                      {feat}
                    </li>
                  ))}
                </ul>

                <a
                  href={`mailto:contact.txsons@gmail.com?subject=Inquiry%20for%20${encodeURIComponent(tier.name)}`}
                  className="w-full py-3 rounded-xl font-bold text-sm text-center transition-all bg-[#302419] hover:bg-[#4a3826] text-[#f4ecdf] border border-[#4a3826] hover:border-[#8d7d68]"
                >
                  Select Package
                </a>
              </div>
            ))}
          </div>

          {/* Platform & Transaction Model Callout */}
          <div className="rounded-3xl border border-[#3a2c20] bg-[#1b1410]/80 p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                Platform & Transaction Alternative
              </div>
              <h3 className="text-2xl font-brasada font-bold text-[#f4ecdf] mb-2">
                1% Success Fee · Hardware-Agnostic Platform Model
              </h3>
              <p className="text-[#8d7d68] text-sm leading-relaxed">
                Need multi-tenant customer booking, ordering, or payment portals? We eliminate bulky monthly software SaaS subscriptions in favor of a clean, volume-based 1% transaction fee processed through Stripe Connect.
              </p>
            </div>
            <a
              href="mailto:contact.txsons@gmail.com?subject=Platform%20%26%20Transaction%20Model%20Inquiry"
              className="px-6 py-3.5 rounded-xl bg-[#241b15] hover:bg-[#302419] text-[#f4ecdf] text-sm font-bold border border-[#4a3826] hover:border-[#a8432b]/50 transition-all flex-shrink-0"
            >
              Discuss Custom Architecture →
            </a>
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────────── */}
      <section className="py-32 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-[#a8432b]/8 blur-[120px] rounded-full" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto">
          <h2 className="text-5xl md:text-6xl font-brasada font-bold text-[#f4ecdf] mb-6 tracking-tight">
            Ready to build your next web platform?
          </h2>
          <p className="text-[#8d7d68] text-xl mb-10 leading-relaxed">
            Your campaign or business deserves a custom digital home built for serious results. Let's talk.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              id="cta-contact-btn"
              href="mailto:contact.txsons@gmail.com?subject=Custom%20Website%20Inquiry%20-%20Brasada%20Studio"
              className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl bg-[#a8432b] hover:bg-[#d4693f] text-[#f4ecdf] text-lg font-black transition-all hover:scale-105 active:scale-100 shadow-2xl shadow-[#a8432b]/30"
            >
              <Zap className="w-6 h-6" />
              Contact Brasada Studio
            </a>
          </div>
          <p className="text-[#6b5f52] text-xs mt-8">Brasada Studio · Pleasanton, TX · contact.txsons@gmail.com</p>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-[#3a2c20] bg-[#1b1410] py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-[#8d7d68]">
          <div className="flex items-center gap-2.5">
            <TexasSonsLogo className="w-6 h-6" variant="brasada" />
            <div className="flex items-baseline">
              <span className="font-brasada font-normal text-[#c4b39c] text-lg tracking-tight">Brasada Studio</span>
              <span className="ml-1.5 text-[#d4693f] font-sans text-xs font-bold tracking-widest uppercase">- Websites</span>
            </div>
          </div>
          <p>© {new Date().getFullYear()} Brasada Studio. Crafted in Pleasanton, TX.</p>
          <div className="flex items-center gap-4">
            {LIVE_DEMOS.map(d => (
              <a key={d.url} href={d.url} target="_blank" rel="noopener noreferrer" className="hover:text-[#d4693f] transition-colors text-xs flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#7d8a6a]" />
                {d.label.split(' for ')[1] || d.label}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
