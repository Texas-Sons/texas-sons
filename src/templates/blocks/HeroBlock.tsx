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
  const isCampaign = theme === 'campaign-navy' || (accentColor === '#C5A059') || headline.toLowerCase().includes('judge') || headline.toLowerCase().includes('sheriff') || headline.toLowerCase().includes('vote');

  const activeBadges = badges && badges.length > 0
    ? badges
    : isCampaign
      ? ['28+ Years Trial Experience', 'Endorsed by Law Enforcement', 'Preserving the Constitution', 'Lifelong Texan']
      : ['Licensed & Insured', 'Satisfaction Guaranteed', '5-Star Rated'];

  const showSocialProof = proofBadgeText !== 'none' && proofBadgeText !== 'hide' && proofBadgeText !== '' && proofBadgeText !== null;
  const proofText = (proofBadgeText && proofBadgeText !== 'none' && proofBadgeText !== 'hide') 
    ? proofBadgeText 
    : (isCampaign ? 'Official 2026 Endorsements · Texas Bar Verified' : `${rating} Rating (${reviewCount}+ Reviews)`);

  if (variant === 'centered') {
    return (
      <section className={`relative overflow-hidden py-14 sm:py-24 bg-[color:var(--ts-bg)] text-[color:var(--ts-text)]`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">

          {/* Social Proof Pill */}
          {showSocialProof && (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border mb-6 backdrop-blur-sm bg-[color:var(--ts-accent-soft)] border-[color:var(--ts-accent-border)] text-[color:var(--ts-accent)] text-xs font-semibold">
              {isCampaign ? (
                <Vote className="w-3.5 h-3.5" />
              ) : (
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
              )}
              <span>{proofText}</span>
            </div>
          )}

          <h1 className={`text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15] mb-4 sm:mb-6 ${isCampaign ? 'font-serif' : ''}`}>
            {headline}
          </h1>
          <p className={`text-sm sm:text-lg max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed text-[color:var(--ts-muted)]`}>
            {subheadline}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <a
              href={ctaHref}
              className={`w-full sm:w-auto inline-flex items-center justify-center px-7 py-3.5 rounded-xl text-sm sm:text-base font-bold shadow-xl transition-all hover:scale-105 bg-[color:var(--ts-accent)] text-[color:var(--ts-accent-contrast)] hover:opacity-95`}
            >
              {ctaText}
              <ArrowRight className="w-4 h-4 ml-2" />
            </a>
            {secondaryCtaText && (
              <a
                href={secondaryCtaHref}
                className={`w-full sm:w-auto inline-flex items-center justify-center px-7 py-3.5 rounded-xl text-sm sm:text-base font-semibold border transition-all bg-[color:var(--ts-surface)] border-[color:var(--ts-border)] text-[color:var(--ts-text)] hover:border-[color:var(--ts-accent-border)]`}
              >
                {secondaryCtaText}
              </a>
            )}
          </div>

          {/* Badges */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs text-[color:var(--ts-muted)]">
            {activeBadges.map((badge, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                {isCampaign ? (
                  <Award className="w-3.5 h-3.5 text-[color:var(--ts-accent)] flex-shrink-0" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[color:var(--ts-accent)] flex-shrink-0" />
                )}
                <span>{badge}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Split / Bento Variant
  return (
    <section className={`relative overflow-hidden py-12 sm:py-20 bg-[color:var(--ts-bg)] text-[color:var(--ts-text)]`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-8 sm:gap-12 items-center">

          {/* Left Column Copy */}
          <div className="space-y-4 sm:space-y-6">

            {/* Social Proof Pill */}
            {showSocialProof && (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border backdrop-blur-sm bg-[color:var(--ts-accent-soft)] border-[color:var(--ts-accent-border)] text-[color:var(--ts-accent)] text-xs font-semibold">
                {isCampaign ? (
                  <Vote className="w-3.5 h-3.5" />
                ) : (
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-current" />
                    ))}
                  </div>
                )}
                <span>{proofText}</span>
              </div>
            )}

            <h1 className={`text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.12] ${
              isCampaign ? 'font-serif' : ''
            }`}>
              {headline}
            </h1>

            <p className={`text-sm sm:text-base leading-relaxed text-[color:var(--ts-muted)]`}>
              {subheadline}
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <a
                href={ctaHref}
                className={`inline-flex items-center justify-center px-7 py-3.5 rounded-xl text-sm sm:text-base font-bold shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] bg-[color:var(--ts-accent)] text-[color:var(--ts-accent-contrast)] hover:opacity-95`}
              >
                {ctaText}
                <ArrowRight className="w-4 h-4 ml-2" />
              </a>
              {secondaryCtaText && (
                <a
                  href={secondaryCtaHref}
                  className={`inline-flex items-center justify-center px-6 py-3.5 rounded-xl text-sm sm:text-base font-semibold border transition-all bg-[color:var(--ts-surface)] border-[color:var(--ts-border)] text-[color:var(--ts-text)] hover:border-[color:var(--ts-accent-border)]`}
                >
                  {secondaryCtaText}
                </a>
              )}
            </div>

            {/* Badges List */}
            <div className="pt-4 sm:pt-6 border-t border-[color:var(--ts-border)] flex flex-wrap gap-2.5 sm:gap-3">
              {activeBadges.map((badge, idx) => (
                <div key={idx} className="flex items-center gap-1.5 text-xs font-medium text-[color:var(--ts-muted)]">
                  {isCampaign ? (
                    <Award className="w-3.5 h-3.5 text-[color:var(--ts-accent)] flex-shrink-0" />
                  ) : (
                    <ShieldCheck className="w-3.5 h-3.5 text-[color:var(--ts-accent)] flex-shrink-0" />
                  )}
                  <span>{badge}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column Showcase Image */}
          <div className="relative">
            <div className={`relative rounded-2xl sm:rounded-3xl overflow-hidden border shadow-2xl group border-[color:var(--ts-border)]`}>
              <img
                src={heroImage}
                alt="Showcase"
                loading="eager"
                fetchPriority="high"
                width={1200}
                height={900}
                className="w-full h-[280px] sm:h-[400px] object-cover object-center group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[color:var(--ts-bg)] via-transparent to-transparent" />

              {/* Floating Social Proof Card */}
              <div className={`absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 p-3 sm:p-3.5 rounded-xl backdrop-blur-md border shadow-xl bg-[color:var(--ts-surface)] border-[color:var(--ts-border)]`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 bg-[color:var(--ts-accent)] text-[color:var(--ts-accent-contrast)]`}
                    >
                      ★
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[color:var(--ts-text)]">
                        {isCampaign ? 'Official Candidate Roster' : 'Top Rated Service'}
                      </p>
                      <p className="text-[10px] text-[color:var(--ts-muted)]">
                        {isCampaign ? 'Election Day · November 2026' : 'Fast Response · 100% Guaranteed'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-bold text-[color:var(--ts-accent)]">
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
