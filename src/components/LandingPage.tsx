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
    tags: ['Campaign', 'Live'],
    color: '#C5A059',
    bgFrom: '#00081e',
    bgTo: '#0a1f44',
  },
  {
    label: 'Ernest Trevino for Sheriff',
    sublabel: 'Atascosa County · Sheriff Campaign',
    url: 'https://ernest-trevino-for-atascosa-coun.pages.dev',
    theme: 'Campaign Navy',
    tags: ['Campaign', 'Live Demo'],
    color: '#f97316',
    bgFrom: '#00081e',
    bgTo: '#001233',
  },
];

const TIERS = [
  {
    name: 'Spur',
    subtitle: 'Static Site',
    price: 'From $1,500',
    description: 'High-performance static sites for campaigns, portfolios, and local businesses.',
    icon: ShieldCheck,
    features: ['Mobile-First Design', 'Lightning Fast Load', 'SEO Optimized', 'Contact Forms'],
    accent: '#f97316',
  },
  {
    name: 'Ranger',
    subtitle: 'Dynamic Platform',
    price: 'From $3,500',
    description: 'Full campaign platforms with voter intake, event scheduling, and lead capture.',
    icon: Zap,
    features: ['Voter Intake Forms', 'Event Calendar', 'Volunteer Portal', 'Newsletter Capture'],
    accent: '#C5A059',
    featured: true,
  },
  {
    name: 'Maverick',
    subtitle: 'Full Application',
    price: 'From $7,500',
    description: 'Complex web applications, client portals, and SaaS platforms built for scale.',
    icon: Rocket,
    features: ['Custom Backend', 'Auth & Payments', 'Database Design', 'API Integrations'],
    accent: '#a855f7',
  },
];

const PROOF_POINTS = [
  { value: '10+', label: 'Campaigns Launched' },
  { value: '<30s', label: 'Avg Deploy Time' },
  { value: '100%', label: 'Mobile-First Builds' },
  { value: '4.9★', label: 'Client Satisfaction' },
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
    <div className="min-h-screen bg-stone-950 text-stone-200 font-sans selection:bg-orange-500/30 overflow-x-hidden">

      {/* ── Nav ──────────────────────────────────────────────────────────── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrollY > 40 ? 'border-b border-stone-800/80 bg-stone-950/90 backdrop-blur-xl' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div
            className="flex items-center gap-3 cursor-default"
            onDoubleClick={onLogin}
            title="TX Sons Websites — Double-click to sign in"
          >
            <TexasSonsLogo className="w-11 h-11" />
            <div className="flex items-baseline">
              <span className="text-white font-texas text-2xl font-normal tracking-wide">TX Sons</span>
              <span className="ml-2 text-orange-500 font-sans text-xs font-bold tracking-widest uppercase">- Websites</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {LIVE_DEMOS.map(d => (
              <a
                key={d.url}
                href={d.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:flex items-center gap-1.5 text-xs text-stone-400 hover:text-orange-400 transition-colors"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {d.label.split(' ')[0]} {d.label.split(' ')[1]}
              </a>
            ))}
            <button
              id="landing-sign-in-btn"
              onClick={onLogin}
              disabled={isLoggingIn}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold transition-all hover:scale-105 active:scale-100 shadow-lg shadow-orange-600/20 disabled:opacity-60"
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
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-orange-600/8 blur-[140px] rounded-full" />
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
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/8 text-orange-400 text-xs font-semibold mb-8 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5" />
            Built for Texas Political Campaigns & Local Businesses
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-black text-white mb-6 tracking-tight leading-[0.95]">
            Websites that{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(135deg, #f97316 0%, #C5A059 50%, #fbbf24 100%)' }}
            >
              win votes
            </span>
            {' '}&{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(135deg, #C5A059 0%, #f97316 100%)' }}
            >
              close deals.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-stone-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Custom, high-performance web platforms for Texas campaigns and local businesses — deployed live in under 60 seconds.
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
            <button
              id="hero-start-building-btn"
              onClick={onLogin}
              disabled={isLoggingIn}
              className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white text-base font-bold transition-all hover:scale-105 active:scale-100 shadow-2xl shadow-orange-600/30 disabled:opacity-60"
            >
              <Zap className="w-5 h-5" />
              {isLoggingIn ? 'Signing in…' : 'Start Building Free'}
            </button>
            <a
              id="hero-demo-link-trevino"
              href={LIVE_DEMOS[1].url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-8 py-4 rounded-2xl border border-stone-700 text-stone-300 hover:text-white hover:border-stone-500 text-base font-semibold transition-all hover:scale-[1.02]"
            >
              View Live Demo <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Proof stats row */}
        <div className="relative z-10 mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl w-full">
          {PROOF_POINTS.map(p => (
            <div key={p.label} className="text-center">
              <div className="text-3xl md:text-4xl font-black text-white mb-1">{p.value}</div>
              <div className="text-xs text-stone-500 font-medium uppercase tracking-wider">{p.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Live Demo Showcase ────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-stone-900/30 border-y border-stone-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Client Sites
            </div>
            <h2 className="text-4xl md:text-5xl font-display font-black text-white mb-4 tracking-tight">
              See it in the wild.
            </h2>
            <p className="text-stone-400 max-w-xl mx-auto">
              Real sites built and deployed for real Texas candidates.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {LIVE_DEMOS.map(demo => (
              <a
                key={demo.url}
                id={`demo-card-${demo.label.split(' ')[0].toLowerCase()}`}
                href={demo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative rounded-3xl overflow-hidden border border-stone-800 hover:border-stone-600 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl block"
                style={{ background: `linear-gradient(135deg, ${demo.bgFrom} 0%, ${demo.bgTo} 100%)` }}
              >
                <div className="p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <p className="text-[10px] text-stone-400 uppercase tracking-widest font-semibold mb-2">{demo.sublabel}</p>
                      <h3 className="text-2xl font-display font-black text-white leading-tight">{demo.label}</h3>
                    </div>
                    <div className="p-2.5 rounded-xl border border-white/10 bg-white/5 group-hover:scale-110 transition-transform">
                      <ExternalLink className="w-4 h-4 text-white/70" />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {demo.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 rounded-full text-[11px] font-bold border"
                        style={{ borderColor: `${demo.color}40`, color: demo.color, background: `${demo.color}15` }}
                      >
                        {tag === 'Live' && <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1 -mb-px animate-pulse" />}
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: demo.color }}>
                    View Live Site <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* Decorative corner glow */}
                <div
                  className="absolute -bottom-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-30 group-hover:opacity-50 transition-opacity"
                  style={{ background: demo.color }}
                />
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-display font-black text-white mb-4 tracking-tight">
              From intake to live in{' '}
              <span className="text-orange-500">60 seconds.</span>
            </h2>
            <p className="text-stone-400 max-w-lg mx-auto">
              Fill out a quick form, hit build, and your client gets a live working demo they can preview on their phone.
            </p>
          </div>

          <div className="relative space-y-0">
            {[
              {
                step: '01', icon: Globe, title: 'Fill the Quick Form',
                desc: 'Enter name, tagline, 3 pillars, and proof badges. Takes about 2 minutes.'
              },
              {
                step: '02', icon: Zap, title: 'Hit ⚡ Build',
                desc: 'The 1-Click Studio instantly renders a full, live-preview site — no AI wait time.'
              },
              {
                step: '03', icon: CheckCircle2, title: 'Automated QC Audit',
                desc: 'Auto-checks: legal disclaimers, mobile layout, contrast, hero content.'
              },
              {
                step: '04', icon: Rocket, title: 'Deploy to Live URL',
                desc: 'One click pushes to Cloudflare Pages. Client gets a live link they can share immediately.'
              },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-6 group">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-2xl bg-stone-900 border border-stone-800 flex items-center justify-center group-hover:border-orange-500/50 group-hover:bg-orange-500/8 transition-all">
                    <item.icon className="w-5 h-5 text-orange-500" />
                  </div>
                  {i < 3 && <div className="w-px h-10 bg-stone-800 my-2" />}
                </div>
                <div className="pb-8 pt-1">
                  <span className="text-[10px] font-black text-orange-600 tracking-widest uppercase">{item.step}</span>
                  <h3 className="text-lg font-bold text-white mt-0.5 mb-1">{item.title}</h3>
                  <p className="text-sm text-stone-400 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Architecture Tiers ────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-stone-900/20 border-y border-stone-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-display font-black text-white mb-4 tracking-tight">
              Choose your tier.
            </h2>
            <p className="text-stone-400 max-w-lg mx-auto">Tailored solutions built to match your budget and ambition.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {TIERS.map((tier, idx) => (
              <div
                key={idx}
                className={`relative rounded-3xl p-8 border flex flex-col transition-all hover:-translate-y-1 ${
                  tier.featured
                    ? 'border-orange-500/50 bg-gradient-to-b from-orange-500/8 to-stone-900/80 shadow-xl shadow-orange-600/10'
                    : 'border-stone-800 bg-stone-900/40 hover:border-stone-700'
                }`}
              >
                {tier.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-orange-600 text-white text-[11px] font-black uppercase tracking-widest">
                    Most Popular
                  </div>
                )}
                <div className="w-12 h-12 rounded-2xl bg-stone-950 border border-stone-800 flex items-center justify-center mb-5" style={{ borderColor: `${tier.accent}30`, background: `${tier.accent}10` }}>
                  <tier.icon className="w-6 h-6" style={{ color: tier.accent }} />
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <h3 className="text-2xl font-display font-black text-white">{tier.name}</h3>
                  <span className="text-xs text-stone-500 font-medium">{tier.subtitle}</span>
                </div>
                <div className="text-base font-bold mb-4" style={{ color: tier.accent }}>{tier.price}</div>
                <p className="text-stone-400 text-sm leading-relaxed mb-6 flex-1">{tier.description}</p>
                <ul className="space-y-2">
                  {tier.features.map((feat, fi) => (
                    <li key={fi} className="flex items-center gap-2 text-sm text-stone-300">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: tier.accent }} />
                      {feat}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────────── */}
      <section className="py-32 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-orange-600/8 blur-[120px] rounded-full" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto">
          <h2 className="text-5xl md:text-6xl font-display font-black text-white mb-6 tracking-tight">
            Ready to go live?
          </h2>
          <p className="text-stone-400 text-xl mb-10 leading-relaxed">
            Your candidate or client deserves a website as serious as their campaign. Let's build it together.
          </p>
          <button
            id="cta-sign-in-btn"
            onClick={onLogin}
            disabled={isLoggingIn}
            className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white text-lg font-black transition-all hover:scale-105 active:scale-100 shadow-2xl shadow-orange-600/30 disabled:opacity-60"
          >
            <Zap className="w-6 h-6" />
            {isLoggingIn ? 'Signing in…' : 'Open the Studio'}
          </button>
          <p className="text-stone-600 text-xs mt-6">Morgan Valdez · Pleasanton, TX · morganmv145@gmail.com</p>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-stone-800 bg-stone-950 py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-stone-500">
          <div className="flex items-center gap-2.5">
            <TexasSonsLogo className="w-6 h-6" />
            <div className="flex items-baseline">
              <span className="font-texas font-normal text-stone-300 text-lg tracking-wide">TX Sons</span>
              <span className="ml-1.5 text-orange-500 font-sans text-xs font-bold tracking-widest uppercase">- Websites</span>
            </div>
          </div>
          <p>© {new Date().getFullYear()} TX Sons Websites. Crafted in Pleasanton, TX.</p>
          <div className="flex items-center gap-4">
            {LIVE_DEMOS.map(d => (
              <a key={d.url} href={d.url} target="_blank" rel="noopener noreferrer" className="hover:text-orange-400 transition-colors text-xs flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {d.label.split(' for ')[1] || d.label}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
