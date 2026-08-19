import React from 'react';
import { Star, ArrowRight, ShieldCheck, CheckCircle2, Award, Vote } from 'lucide-react';

interface HeroBlockProps {
  headline: string;
  subheadline: string;
  ctaText?: string;
  ctaHref?: string;
  secondaryCtaText?: string;
  secondaryCtaHref?: string;
  heroImage?: string;
  rating?: number;
  reviewCount?: number;
  badges?: string[];
  variant?: 'split' | 'bento' | 'centered';
  theme?: 'dark' | 'light' | 'luxury' | 'campaign-navy' | 'crimson-bold' | 'emerald-gold' | 'custom';
  accentColor?: string;
  proofBadgeText?: string;
}

export function HeroBlock({
  headline,
  subheadline,
  ctaText = 'Book Free Estimate',
  ctaHref = '#contact',
  secondaryCtaText = 'View Services',
  secondaryCtaHref = '#services',
  heroImage = 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=1200',
  rating = 4.9,
  reviewCount = 128,
  badges,
  variant = 'split',
  theme = 'dark',
  accentColor,
  proofBadgeText
}: HeroBlockProps) {
  const isDark = theme !== 'light';
  const isCampaign = theme === 'campaign-navy' || (accentColor === '#C5A059') || headline.toLowerCase().includes('judge') || headline.toLowerCase().includes('sheriff') || headline.toLowerCase().includes('vote');

  // Fallback badges based on industry context
  const activeBadges = badges && badges.length > 0
    ? badges
    : isCampaign
      ? ['28+ Years Trial Experience', 'Endorsed by Law Enforcement', 'Preserving the Constitution', 'Lifelong Texan']
      : ['Licensed & Insured', 'Satisfaction Guaranteed', '5-Star Rated'];

  const customAccentBg = accentColor 
    ? { backgroundColor: accentColor, color: (accentColor === '#C5A059' || accentColor === '#fbbf24') ? '#0c0a09' : '#ffffff' } 
    : isCampaign
      ? { backgroundColor: '#C5A059', color: '#00081e' }
      : undefined;

  const customAccentText = accentColor
    ? { color: accentColor }
    : isCampaign
      ? { color: '#C5A059' }
      : undefined;

  if (variant === 'centered') {
    return (
      <section className={`relative overflow-hidden py-14 sm:py-24 ${
        theme === 'campaign-navy' ? 'bg-[#00081e] text-white' : isDark ? 'bg-stone-950 text-white' : 'bg-stone-50 text-stone-900'
      }`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          
          {/* Social Proof Pill */}
          {isCampaign ? (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border mb-6 backdrop-blur-sm bg-[#C5A059]/10 border-[#C5A059]/30 text-[#C5A059] text-xs font-semibold">
              <Vote className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>{proofBadgeText || 'Official 2026 Endorsements · Texas Bar Verified'}</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border mb-6 backdrop-blur-sm bg-orange-500/10 border-orange-500/30 text-orange-400 text-xs font-semibold">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span>{proofBadgeText || `${rating} Rating (${reviewCount}+ Reviews)`}</span>
            </div>
          )}

          <h1 className={`text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15] mb-4 sm:mb-6 ${isCampaign ? 'font-serif' : ''}`}>
            {headline}
          </h1>
          <p className={`text-sm sm:text-lg max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>
            {subheadline}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <a
              href={ctaHref}
              style={customAccentBg}
              className={`w-full sm:w-auto inline-flex items-center justify-center px-7 py-3.5 rounded-xl text-sm sm:text-base font-bold shadow-xl transition-all hover:scale-105 ${
                !customAccentBg ? 'bg-orange-600 hover:bg-orange-500 text-white shadow-orange-600/30' : 'shadow-black/40 hover:opacity-95'
              }`}
            >
              {ctaText}
              <ArrowRight className="w-4 h-4 ml-2" />
            </a>
            {secondaryCtaText && (
              <a
                href={secondaryCtaHref}
                className={`w-full sm:w-auto inline-flex items-center justify-center px-7 py-3.5 rounded-xl text-sm sm:text-base font-semibold border transition-all ${
                  isCampaign
                    ? 'border-[#C5A059]/40 bg-stone-900/60 hover:bg-[#C5A059]/10 text-[#C5A059]'
                    : isDark 
                      ? 'border-stone-800 bg-stone-900/50 hover:bg-stone-800 text-stone-200' 
                      : 'border-stone-300 bg-white hover:bg-stone-100 text-stone-800'
                }`}
              >
                {secondaryCtaText}
              </a>
            )}
          </div>

          {/* Badges */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs text-stone-400">
            {activeBadges.map((badge, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                {isCampaign ? (
                  <Award className="w-3.5 h-3.5 text-[#C5A059] flex-shrink-0" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                )}
                <span className={isCampaign ? 'text-stone-300' : ''}>{badge}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Split / Bento Variant
  return (
    <section className={`relative overflow-hidden py-12 sm:py-20 ${
      theme === 'campaign-navy' ? 'bg-[#00081e] text-white' : isDark ? 'bg-stone-950 text-white' : 'bg-stone-50 text-stone-900'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-8 sm:gap-12 items-center">
          
          {/* Left Column Copy */}
          <div className="space-y-4 sm:space-y-6">
            
            {/* Social Proof Pill */}
            {isCampaign ? (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border backdrop-blur-sm bg-[#C5A059]/10 border-[#C5A059]/30 text-[#C5A059] text-xs font-semibold">
                <Vote className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>{proofBadgeText || 'Official 2026 Endorsements · Law Enforcement Backed'}</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border backdrop-blur-sm bg-orange-500/10 border-orange-500/30 text-orange-400 text-xs font-semibold">
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span>{proofBadgeText || `${rating} Stars · ${reviewCount}+ Reviews`}</span>
              </div>
            )}

            <h1 className={`text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.12] ${
              isCampaign ? 'font-serif' : ''
            }`}>
              {headline}
            </h1>

            <p className={`text-sm sm:text-base leading-relaxed ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>
              {subheadline}
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <a
                href={ctaHref}
                style={customAccentBg}
                className={`inline-flex items-center justify-center px-7 py-3.5 rounded-xl text-sm sm:text-base font-bold shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] ${
                  !customAccentBg ? 'bg-orange-600 hover:bg-orange-500 text-white shadow-orange-600/30' : 'shadow-black/40 hover:opacity-95'
                }`}
              >
                {ctaText}
                <ArrowRight className="w-4 h-4 ml-2" />
              </a>
              {secondaryCtaText && (
                <a
                  href={secondaryCtaHref}
                  className={`inline-flex items-center justify-center px-6 py-3.5 rounded-xl text-sm sm:text-base font-semibold border transition-all ${
                    isCampaign
                      ? 'border-[#C5A059]/40 bg-stone-900/60 hover:bg-[#C5A059]/10 text-[#C5A059]'
                      : isDark 
                        ? 'border-stone-800 bg-stone-900/60 hover:bg-stone-800 text-stone-200' 
                        : 'border-stone-300 bg-white hover:bg-stone-100 text-stone-800'
                  }`}
                >
                  {secondaryCtaText}
                </a>
              )}
            </div>

            {/* Badges List */}
            <div className="pt-4 sm:pt-6 border-t border-stone-800/80 flex flex-wrap gap-2.5 sm:gap-3">
              {activeBadges.map((badge, idx) => (
                <div key={idx} className="flex items-center gap-1.5 text-xs font-medium text-stone-400">
                  {isCampaign ? (
                    <Award className="w-3.5 h-3.5 text-[#C5A059] flex-shrink-0" />
                  ) : (
                    <ShieldCheck className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                  )}
                  <span className={isCampaign ? 'text-stone-300' : ''}>{badge}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column Showcase Image */}
          <div className="relative">
            <div className={`relative rounded-2xl sm:rounded-3xl overflow-hidden border shadow-2xl group ${
              isCampaign ? 'border-[#C5A059]/30 shadow-2xl shadow-[#C5A059]/10' : 'border-stone-800'
            }`}>
              <img
                src={heroImage}
                alt="Showcase"
                className="w-full h-[280px] sm:h-[400px] object-cover object-center group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent" />
              
              {/* Floating Social Proof Card */}
              <div className={`absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 p-3 sm:p-3.5 rounded-xl backdrop-blur-md border shadow-xl ${
                isCampaign 
                  ? 'bg-[#00081e]/90 border-[#C5A059]/40' 
                  : 'bg-stone-900/90 border-stone-700/60'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div 
                      style={customAccentBg}
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                        !customAccentBg ? 'bg-orange-600 text-white' : ''
                      }`}
                    >
                      ★
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">
                        {isCampaign ? 'Official Candidate Roster' : 'Top Rated Service'}
                      </p>
                      <p className="text-[10px] text-stone-400">
                        {isCampaign ? 'Election Day · November 2026' : 'Fast Response · 100% Guaranteed'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span 
                      style={customAccentText}
                      className={`text-[11px] font-bold ${!customAccentText ? 'text-orange-400' : ''}`}
                    >
                      {isCampaign ? 'Active Campaign' : 'Verified'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
