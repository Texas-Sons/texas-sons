import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Vote, CheckCircle2, Copy, Check, Info, ShieldCheck, ArrowRight, CornerDownRight } from 'lucide-react';
import { ScalesOfJusticeIcon, TexasStarSealIcon } from './CampaignIcons';

interface WriteInGuideBlockProps {
  candidateName?: string;
  officeTitle?: string;
  county?: string;
  theme?: string;
  accentColor?: string;
}

export function WriteInGuideBlock({
  candidateName = 'WAYLON ROGERS',
  officeTitle = 'Atascosa County Judge',
  county = 'Atascosa County',
  theme = 'campaign-judicial',
  accentColor = '#C5A059'
}: WriteInGuideBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(candidateName.toUpperCase());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const steps = [
    {
      step: '01',
      title: 'Find the Office on Your Ballot',
      desc: `On your official voting screen or paper ballot, navigate down to the race for ${officeTitle}.`,
      badge: 'Step 1'
    },
    {
      step: '02',
      title: 'Select "Write-In"',
      desc: 'Tap or mark the "Write-In" bubble / button located at the bottom of the candidate list.',
      badge: 'Step 2'
    },
    {
      step: '03',
      title: `Type or Print "${candidateName.toUpperCase()}"`,
      desc: `Use the on-screen keyboard to spell ${candidateName.toUpperCase()}. No middle initial required.`,
      badge: 'Step 3',
      highlight: true
    },
    {
      step: '04',
      title: 'Verify on the Review Screen & Cast',
      desc: `Confirm that "${candidateName.toUpperCase()}" appears under ${officeTitle} before printing or casting your final ballot.`,
      badge: 'Step 4'
    }
  ];

  return (
    <section id="write-in-guide" className="py-16 sm:py-24 relative bg-[color:var(--ts-bg)] text-[color:var(--ts-text)] overflow-hidden border-y border-[color:var(--ts-border)]">
      {/* Background Decorative Seals */}
      <div className="absolute top-0 right-0 translate-x-1/3 -translate-y-1/3 opacity-5 pointer-events-none">
        <TexasStarSealIcon size={500} color={accentColor} />
      </div>
      <div className="absolute bottom-0 left-0 -translate-x-1/3 translate-y-1/3 opacity-5 pointer-events-none">
        <ScalesOfJusticeIcon size={450} color={accentColor} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider mb-4 bg-[#bb0027]/12 text-[#bb0027] border border-[#bb0027]/30 shadow-sm">
            <Vote className="w-4 h-4 text-[#bb0027]" />
            <span>Official Write-In Voter Instructions</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#bb0027]" />
            <span className="text-[#C5A059] font-bold">2026 Election</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight font-serif mb-4 text-[color:var(--ts-text)]">
            How to Cast Your Write-In Vote
          </h2>
          
          <p className="text-sm sm:text-base text-[color:var(--ts-muted)] max-w-2xl mx-auto leading-relaxed">
            Writing in <strong className="text-[color:var(--ts-text)]">{candidateName}</strong> for {officeTitle} is fast, valid, and fully counted on all official Texas voting machines.
          </p>
        </div>

        {/* Center Grid: Step Cards + Simulated Ballot Box */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: 4 Interactive Step Cards */}
          <div className="lg:col-span-7 space-y-4">
            {steps.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className={`p-5 sm:p-6 rounded-2xl border transition-all duration-300 shadow-md ${
                  item.highlight
                    ? 'bg-gradient-to-r from-[#bb0027]/10 via-[color:var(--ts-surface)] to-[color:var(--ts-surface)] border-2 border-[#bb0027] ring-2 ring-[#bb0027]/25 shadow-red-950/10'
                    : 'bg-[color:var(--ts-surface)] border-[color:var(--ts-border)] hover:border-[#bb0027]/40'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div 
                    className="w-10 h-10 rounded-xl font-bold flex items-center justify-center text-sm shadow-md flex-shrink-0"
                    style={{ 
                      backgroundColor: item.highlight ? '#bb0027' : 'rgba(197, 160, 89, 0.12)', 
                      color: item.highlight ? '#ffffff' : accentColor,
                      border: item.highlight ? '1px solid #bb0027' : `1px solid ${accentColor}40`
                    }}
                  >
                    {item.step}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className={`text-base sm:text-lg font-bold font-serif ${item.highlight ? 'text-[color:var(--ts-text)] font-extrabold' : 'text-[color:var(--ts-text)]'}`}>
                        {item.title}
                      </h3>
                      <span 
                        className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded tracking-wider flex-shrink-0 shadow-sm ${
                          item.highlight 
                            ? 'bg-[#bb0027] text-white' 
                            : 'bg-[#C5A059]/15 text-[#C5A059] border border-[#C5A059]/30'
                        }`}
                      >
                        {item.badge}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-[color:var(--ts-muted)] leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Right Column: Simulated Ballot Card & One-Click Copy */}
          <div className="lg:col-span-5 w-full">
            <div className="rounded-3xl p-6 sm:p-8 bg-[#00081e] text-white border-2 border-[#C5A059]/40 shadow-2xl relative overflow-hidden">
              
              {/* Red Top Accent Bar */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#bb0027] via-[#C5A059] to-[#bb0027]" />

              {/* Background watermark */}
              <div className="absolute top-4 right-4 opacity-10 pointer-events-none">
                <ScalesOfJusticeIcon size={120} color="#C5A059" />
              </div>

              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-[#C5A059]/30 pb-4 mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#bb0027]" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-[11px] font-mono text-slate-300 ml-2 font-bold uppercase tracking-wider">
                    Official Ballot Sample
                  </span>
                </div>
                <span className="text-[10px] font-extrabold text-[#C5A059] uppercase tracking-widest bg-[#C5A059]/10 px-2 py-0.5 rounded border border-[#C5A059]/30">
                  {county}
                </span>
              </div>

              {/* Race Title Header */}
              <div className="mb-5 bg-slate-900/90 p-3.5 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between mb-0.5">
                  <p className="text-[10px] uppercase font-bold text-[#C5A059] tracking-wider">Contested Office</p>
                  <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-[#bb0027] text-white uppercase tracking-wider">
                    Vote For One
                  </span>
                </div>
                <p className="text-sm sm:text-base font-serif font-bold text-white tracking-wide">{officeTitle}</p>
                <p className="text-[11px] text-slate-400">Atascosa County General Election</p>
              </div>

              {/* Simulated Options */}
              <div className="space-y-3 mb-6">
                <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/80 flex items-center justify-between opacity-50">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full border border-slate-600" />
                    <span className="text-xs text-slate-400 font-medium">Other Candidate</span>
                  </div>
                </div>

                {/* Selected Write-In Item with Red/Gold Accent */}
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#bb0027]/20 to-[#C5A059]/15 border-2 border-[#bb0027] flex items-center justify-between shadow-lg ring-2 ring-[#bb0027]/30">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-5 h-5 rounded-full bg-[#bb0027] text-white flex items-center justify-center flex-shrink-0 shadow-md">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-black uppercase text-[#ff6b81] tracking-widest">
                          [ WRITE-IN ]
                        </span>
                      </div>
                      <p className="text-sm font-extrabold font-serif tracking-wider text-white truncate">
                        {candidateName.toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-[#ff6b81] flex-shrink-0" />
                </div>
              </div>

              {/* Copy Name to Clipboard Action with Red Button */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-center space-y-3">
                <p className="text-xs text-slate-300">
                  Exact spelling needed at the voting booth:
                </p>
                
                <div className="flex items-center justify-center gap-2">
                  <span className="font-mono text-base font-extrabold px-3 py-1.5 rounded-lg bg-black/70 border-2 border-[#bb0027]/80 text-[#ff6b81] tracking-widest select-all shadow-inner">
                    {candidateName.toUpperCase()}
                  </span>
                  
                  <button
                    onClick={handleCopy}
                    className="px-3.5 py-2 rounded-lg bg-gradient-to-r from-[#bb0027] to-[#990020] hover:from-[#d1002e] hover:to-[#bb0027] text-white text-xs font-extrabold flex items-center gap-1.5 shadow-lg shadow-red-950/40 border border-[#C5A059]/40 active:scale-95 transition-all cursor-pointer"
                    title="Copy candidate name"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy Name'}</span>
                  </button>
                </div>
              </div>

              {/* Legal & Trust Badge */}
              <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>Texas Bar Verified Candidate</span>
                </span>
                <span className="font-mono text-[10px] text-slate-400">TX Elec. Code § 146</span>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
