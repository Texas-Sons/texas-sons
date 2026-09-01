import React from 'react';
import { motion } from 'framer-motion';
import { useEntrance } from './motion';
import { Star, ArrowRight, ShieldCheck, CheckCircle2, Award, Vote } from 'lucide-react';

interface HeroBlockProps {
  headline: string;
  subheadline: string;
  ctaText?: string;
  ctaHref?: string;
  secondaryCtaText?: string;
  secondaryCtaHref?: string;
  heroImage?: string;
  /** Real review data only. Omitted means no rating is shown, not a default one. */
  rating?: number;
  reviewCount?: number;
  badges?: string[];
  /** The owner's own photo, for the card over the hero image. */
  ownerPhoto?: string;
  ownerName?: string;
  /** e.g. "Owner & Master Colorist". Falls back to "Owner". */
  ownerRole?: string;
  variant?: 'split' | 'bento' | 'centered';
  theme?: 'dark' | 'light' | 'luxury' | 'campaign-navy' | 'campaign-judicial' | 'crimson-bold' | 'emerald-gold' | 'custom';
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
  // No defaults. These used to be 4.9 and 128, and SiteRenderer never passes
  // either, so every non-campaign site published "4.9 Rating (128+ Reviews)"
  // about a business whose reviews nobody had counted.
  rating,
  reviewCount,
  badges,
  ownerPhoto,
  ownerName,
  ownerRole,
  variant = 'split',
  theme = 'dark',
  accentColor,
  proofBadgeText
}: HeroBlockProps) {
  // Above the fold on load, so this animates on mount rather than on scroll.
  const entrance = useEntrance();

  const isCampaign = (theme === 'campaign-navy' || theme === 'campaign-judicial') || (accentColor === '#C5A059') || headline.toLowerCase().includes('judge') || headline.toLowerCase().includes('sheriff') || headline.toLowerCase().includes('vote');

  // No invented badges.
  //
  // These defaulted to 'Licensed & Insured', 'Satisfaction Guaranteed' and
  // '5-Star Rated' for any site that supplied none — claims about a real
  // business that nobody had checked, and in the case of licensing and
  // insurance, a regulatory one. Same fault as b2d099c, which put four
  // trademarked product lines on the shelf of every salon without product data.
  //
  // The campaign defaults go too: "28+ Years Trial Experience" is a specific,
  // checkable, and potentially false claim about a candidate.
  //
  // A blueprint with no badges now renders no badges. Empty is honest.
  const activeBadges = badges && badges.length > 0 ? badges : [];

  // Shown only when there is something true to show: a line the operator wrote,
  // or a real rating with a real review count. There is no fallback text —
  // inventing social proof is the thing this used to do.
  const explicitProof =
    proofBadgeText && proofBadgeText !== 'none' && proofBadgeText !== 'hide' ? proofBadgeText : '';
  const hasRealRating = typeof rating === 'number' && typeof reviewCount === 'number' && reviewCount > 0;
  const proofText = explicitProof || (hasRealRating ? `${rating} Rating (${reviewCount}+ Reviews)` : '');
  const showSocialProof = !!proofText;

  if (variant === 'centered') {
    return (
      <section className={`relative overflow-hidden py-14 sm:py-24 bg-[color:var(--ts-bg)] text-[color:var(--ts-text)]`}>
        <motion.div
          className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10"
          variants={entrance.group}
          {...entrance.props}
        >

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

          <motion.h1
            variants={entrance.item}
            className={`text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15] mb-4 sm:mb-6 ${isCampaign ? 'font-serif' : ''}`}
          >
            {headline}
          </motion.h1>
          <motion.p
            variants={entrance.item}
            className={`text-sm sm:text-lg max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed text-[color:var(--ts-muted)]`}
          >
            {subheadline}
          </motion.p>

          <motion.div variants={entrance.item} className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
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
          </motion.div>

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
        </motion.div>
      </section>
    );
  }

  // Split / Bento Variant
  return (
    <section className={`relative overflow-hidden py-12 sm:py-20 bg-[color:var(--ts-bg)] text-[color:var(--ts-text)]`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-8 sm:gap-12 items-center">

          {/* Left Column Copy */}
          <motion.div
            className="space-y-4 sm:space-y-6"
            variants={entrance.group}
            {...entrance.props}
          >

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

            <motion.h1
              variants={entrance.item}
              className={`text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.12] ${
                isCampaign ? 'font-serif' : ''
              }`}
            >
              {headline}
            </motion.h1>

            <motion.p
              variants={entrance.item}
              className={`text-sm sm:text-base leading-relaxed text-[color:var(--ts-muted)]`}
            >
              {subheadline}
            </motion.p>

            <motion.div variants={entrance.item} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
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
            </motion.div>

            {/* Badges List */}
            <motion.div variants={entrance.item} className="pt-4 sm:pt-6 border-t border-[color:var(--ts-border)] flex flex-wrap gap-2.5 sm:gap-3">
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
            </motion.div>
          </motion.div>

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

              {/* The card over the hero image.
                *
                * It used to read "Top Rated Service · Fast Response · 100%
                * Guaranteed · Verified" on every non-campaign site, hardcoded.
                * Not one of those was true of anyone in particular, "Verified"
                * asserted a check nobody performed, and "100% Guaranteed" is a
                * promise on behalf of a business that never made it.
                *
                * It now shows the owner, which is both true and better: people
                * choosing a colourist are choosing a person. With no owner and
                * no real proof line, it renders nothing — an image with no card
                * looks finished, and a fabricated badge does not.
                */}
              {/* A photo alone is enough to draw the card.
                *
                * This required a NAME, so uploading a stylist's photo and
                * nothing else rendered nothing at all — the upload appeared to
                * do nothing, with no error and no hint that a second field was
                * load-bearing. If someone has put a face here, show the face. */}
              {ownerPhoto || ownerName || proofText ? (
                <div className={`absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 p-3 sm:p-3.5 rounded-xl backdrop-blur-md border shadow-xl bg-[color:var(--ts-surface)] border-[color:var(--ts-border)]`}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center space-x-2.5 min-w-0">
                      {ownerPhoto ? (
                        <img
                          src={ownerPhoto}
                          alt={ownerName ? `${ownerName}, ${ownerRole || 'Owner'}` : 'Owner'}
                          loading="lazy"
                          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover flex-shrink-0 border border-[color:var(--ts-border)]"
                        />
                      ) : (
                        <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-[color:var(--ts-accent)] text-[color:var(--ts-accent-contrast)]`}>
                          <Star className="w-3.5 h-3.5" aria-hidden="true" />
                        </div>
                      )}
                      <div className="min-w-0">
                        {(ownerName || proofText) && (
                          <p className="text-xs font-bold text-[color:var(--ts-text)] truncate">
                            {ownerName || proofText}
                          </p>
                        )}
                        {ownerName && (
                          <p className="text-[10px] text-[color:var(--ts-muted)] truncate">
                            {ownerRole || 'Owner'}
                          </p>
                        )}
                      </div>
                    </div>
                    {ownerName && proofText && (
                      <span className="text-[11px] font-bold text-[color:var(--ts-accent)] text-right flex-shrink-0">
                        {proofText}
                      </span>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
