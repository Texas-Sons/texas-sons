import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Star, CheckCircle, ChevronRight, Flag, Award, Gavel, Scale, FileText, Vote } from 'lucide-react';
import { ScalesOfJusticeIcon, GavelCrestIcon, TexasStarSealIcon, CourtroomPillarsIcon } from './CampaignIcons';

interface CampaignHeroBlockProps {
  headline: string;
  subheadline: string;
  heroImage: string;
  accentColor?: string;
  badges?: string[];
  proofBadgeText?: string;
  ctaText?: string;
  secondaryCtaText?: string;
  theme?: string;
  county?: string;
}

export function CampaignHeroBlock({
  headline,
  subheadline,
  heroImage,
  accentColor = '#C5A059',
  badges = [],
  proofBadgeText,
  ctaText = 'Join The Campaign',
  secondaryCtaText = 'Read Our Platform',
  theme,
  county = 'Atascosa County'
}: CampaignHeroBlockProps) {
  
  // Theme-specific labels and icons
  const isJudicial = theme === 'campaign-judicial' || headline.toLowerCase().includes('judge') || headline.toLowerCase().includes('justice') || headline.toLowerCase().includes('waylon');
  const isWriteIn = (proofBadgeText && proofBadgeText.toLowerCase().includes('write-in')) || 
                    badges.some(b => b.toLowerCase().includes('write-in')) ||
                    subheadline.toLowerCase().includes('write-in') ||
                    headline.toLowerCase().includes('waylon');

  const officialLabel = isWriteIn 
    ? 'Official 2026 Write-In Candidate' 
    : isJudicial 
    ? 'Judicial & Courtroom Leadership' 
    : 'Official Campaign';

  const candidateTitle = isJudicial ? 'Candidate for County Judge' : 'Master Peace Officer';
  const candidateCredential = isWriteIn 
    ? 'Atascosa County · Write-In' 
    : isJudicial 
    ? 'Constitutional Integrity & Trial Record' 
    : 'SAPD Medal of Valor Recipient';

  // Extract candidate name or jurisdiction if present
  const words = headline.split(' ');
  const lastPhrase = words.length > 2 ? words.slice(-2).join(' ') : words[words.length - 1];
  const firstPhrase = words.length > 2 ? words.slice(0, -2).join(' ') : words.slice(0, -1).join(' ');

  const resolvedCtaText = isWriteIn ? 'How to Vote Write-In' : ctaText;
  const resolvedCtaHref = isWriteIn ? '#write-in-guide' : '#contact';
  const resolvedSecondaryText = isJudicial ? 'Core Judicial Platform' : secondaryCtaText;

  return (
    <section className="relative bg-[color:var(--ts-bg)] text-[color:var(--ts-text)] overflow-hidden py-12 sm:py-16 lg:py-24 flex items-center">
      
      {/* Premium Background Ambient Glow */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none" 
        style={{ 
          backgroundImage: `radial-gradient(circle at 75% 30%, ${accentColor} 0%, transparent 60%), radial-gradient(circle at 10% 80%, var(--ts-border) 0%, transparent 70%)` 
        }} 
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* ================================================================= */}
          {/* MOBILE ONLY: Top Official Tag & Headline (Shown before the photo) */}
          {/* ================================================================= */}
          <div className="block lg:hidden text-left space-y-3">
            <div className="flex items-center gap-2">
              {isWriteIn ? (
                <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-[#bb0027]/15 text-[#bb0027] border border-[#bb0027]/30 flex items-center gap-1.5 shadow-sm">
                  <Vote className="w-3.5 h-3.5 text-[#bb0027]" />
                  <span>Official 2026 Write-In Candidate</span>
                </span>
              ) : isJudicial ? (
                <div className="flex items-center gap-1.5">
                  <ScalesOfJusticeIcon size={18} color={accentColor} />
                  <span className="text-[11px] font-extrabold uppercase tracking-[0.2em]" style={{ color: accentColor }}>
                    {officialLabel}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  {[...Array(3)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" style={{ color: accentColor }} />
                  ))}
                  <span className="ml-1.5 text-[11px] font-extrabold uppercase tracking-[0.2em]" style={{ color: accentColor }}>
                    {officialLabel}
                  </span>
                </div>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-serif leading-[1.12] drop-shadow-lg text-[color:var(--ts-text)]">
              <span>{firstPhrase} </span>
              <span className="block mt-1" style={{ color: accentColor }}>{lastPhrase}</span>
            </h1>
          </div>

          {/* ================================================================= */}
          {/* CANDIDATE PORTRAIT CARD (Clean, Uncovered & Responsive)            */}
          {/* ================================================================= */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="lg:col-span-5 lg:order-2 w-full flex justify-center"
          >
            <div className="relative w-full max-w-sm sm:max-w-md lg:max-w-none">
              
              {/* Outer Golden Aura Glow */}
              <div 
                className="absolute -inset-1.5 rounded-3xl opacity-30 blur-xl transition-all duration-700 pointer-events-none"
                style={{ backgroundColor: isWriteIn ? '#bb0027' : accentColor }}
              />

              {/* Main Portrait Frame */}
              <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-[#C5A059]/40 bg-stone-950 shadow-2xl shadow-black/90">
                <img 
                  src={heroImage} 
                  alt={headline}
                  className="w-full h-[360px] sm:h-[460px] lg:h-[540px] object-cover object-top"
                  loading="eager"
                  fetchPriority="high"
                />

                {/* Subtle Bottom Vignette for Visual Anchor */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#00081e] via-[#00081e]/30 to-transparent opacity-85" />

                {/* Floating Candidate Badge in Frame */}
                <div className="absolute bottom-3.5 left-3.5 right-3.5 sm:bottom-4 sm:left-4 sm:right-4 p-3 rounded-xl backdrop-blur-md bg-stone-950/85 border border-[#C5A059]/30 shadow-xl flex items-center justify-between text-white">
                  <div className="flex items-center gap-2.5">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shadow-md flex-shrink-0"
                      style={{ 
                        backgroundColor: isWriteIn ? '#bb0027' : accentColor, 
                        color: isWriteIn ? '#ffffff' : '#00081e' 
                      }}
                    >
                      {isJudicial ? <Gavel className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white tracking-wide truncate">
                        {candidateTitle}
                      </p>
                      <p className="text-[10px] text-slate-300 truncate">
                        {candidateCredential}
                      </p>
                    </div>
                  </div>
                  <span 
                    className="px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider flex-shrink-0 ml-2 shadow-sm"
                    style={{ 
                      backgroundColor: isWriteIn ? '#bb0027' : `${accentColor}25`, 
                      color: isWriteIn ? '#ffffff' : accentColor 
                    }}
                  >
                    {isWriteIn ? '2026 WRITE-IN' : '2026'}
                  </span>
                </div>

              </div>
            </div>
          </motion.div>

          {/* ================================================================= */}
          {/* TEXT COPY & BADGES COLUMN                                         */}
          {/* ================================================================= */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-7 lg:order-1 flex flex-col items-start"
          >
            {/* DESKTOP ONLY: Top Official Seal */}
            <div className="hidden lg:flex items-center gap-2.5 mb-4">
              {isWriteIn ? (
                <span className="px-3.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-[#bb0027]/12 text-[#bb0027] border border-[#bb0027]/30 flex items-center gap-2 shadow-sm">
                  <Vote className="w-4 h-4 text-[#bb0027]" />
                  <span>Official 2026 Write-In Candidate</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#bb0027]" />
                  <span className="text-[#C5A059] font-bold">{county || 'Atascosa County'}</span>
                </span>
              ) : isJudicial ? (
                <div className="flex items-center gap-2">
                  <ScalesOfJusticeIcon size={22} color={accentColor} />
                  <span className="ml-2 text-xs font-bold uppercase tracking-[0.2em]" style={{ color: accentColor }}>
                    {officialLabel}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {[...Array(3)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-current" style={{ color: accentColor }} />
                  ))}
                  <span className="ml-2 text-xs font-bold uppercase tracking-[0.2em]" style={{ color: accentColor }}>
                    {officialLabel}
                  </span>
                </div>
              )}
            </div>

            {/* DESKTOP ONLY: Large Serif Headline */}
            <h1 className="hidden lg:block text-4xl sm:text-5xl xl:text-6xl font-extrabold tracking-tight font-serif leading-[1.08] mb-6 drop-shadow-2xl text-[color:var(--ts-text)]">
              <span>{firstPhrase} </span>
              <span className="block mt-2" style={{ color: accentColor }}>{lastPhrase}</span>
            </h1>

            {/* Narrative Subheadline (Clean, Uncovered & High-Contrast) */}
            <p 
              className="text-base sm:text-lg text-[color:var(--ts-muted)] font-normal leading-relaxed mb-6 sm:mb-8 border-l-4 pl-4 bg-[color:var(--ts-surface)]/50 py-2 rounded-r-lg"
              style={{ borderColor: isWriteIn ? '#bb0027' : accentColor }}
            >
              {subheadline}
            </p>

            {/* Badges Grid (Staggered 2-column layout) */}
            {badges.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 mb-8 sm:mb-10 w-full max-w-xl">
                {badges.map((badge, idx) => {
                  const isBadgeWriteIn = badge.toLowerCase().includes('write-in');
                  return (
                    <div 
                      key={idx} 
                      className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl transition-all shadow-sm ${
                        isBadgeWriteIn
                          ? 'bg-[#bb0027]/12 border-2 border-[#bb0027] text-[#bb0027] font-black ring-2 ring-[#bb0027]/20 shadow-md'
                          : 'bg-[color:var(--ts-surface)] border border-[color:var(--ts-border)] hover:border-[#C5A059]/50 text-[color:var(--ts-text)]'
                      }`}
                    >
                      {isJudicial ? (
                        isBadgeWriteIn ? (
                          <FileText className="w-4 h-4 flex-shrink-0 text-[#bb0027]" />
                        ) : idx % 2 === 0 ? (
                          <Gavel className="w-4 h-4 flex-shrink-0" style={{ color: accentColor }} />
                        ) : (
                          <Scale className="w-4 h-4 flex-shrink-0" style={{ color: accentColor }} />
                        )
                      ) : (
                        <Shield className="w-4 h-4 flex-shrink-0" style={{ color: accentColor }} />
                      )}
                      <span className={`text-xs font-bold tracking-wide uppercase truncate ${isBadgeWriteIn ? 'font-black text-[#bb0027]' : ''}`}>
                        {badge}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
              <a 
                href={resolvedCtaHref}
                className={`px-8 py-4 rounded-xl font-extrabold text-sm uppercase tracking-wider transition-all hover:scale-105 shadow-xl flex items-center justify-center gap-2 text-center ${
                  isWriteIn 
                    ? 'bg-gradient-to-r from-[#bb0027] to-[#990020] text-white border border-[#C5A059]/40 shadow-red-950/30' 
                    : ''
                }`}
                style={isWriteIn ? {} : { backgroundColor: accentColor, color: '#00081e' }}
              >
                <Vote className="w-4 h-4" />
                <span>{resolvedCtaText}</span>
              </a>
              <a 
                href="#services"
                className="px-7 py-4 rounded-xl font-bold text-sm uppercase tracking-wider border border-[color:var(--ts-border)] hover:border-current hover:bg-[color:var(--ts-surface)] transition-all flex items-center justify-center gap-2 text-[color:var(--ts-text)] text-center"
              >
                <span>{resolvedSecondaryText}</span>
                <ChevronRight className="w-4 h-4 opacity-60" />
              </a>
            </div>

            {/* Proof Badge */}
            {proofBadgeText && (
              <div className="mt-6 sm:mt-8 flex items-center gap-2 text-xs font-semibold text-[color:var(--ts-muted)]">
                <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: isWriteIn ? '#bb0027' : accentColor }} />
                <span>{proofBadgeText}</span>
              </div>
            )}

          </motion.div>

        </div>
      </div>
    </section>
  );
}

