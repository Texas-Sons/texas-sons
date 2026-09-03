import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useReveal, revealBlock } from './motion';
import { ServiceItem } from './types';

interface ServicesBlockProps {
  title?: string;
  subtitle?: string;
  services: ServiceItem[];
  theme?: 'dark' | 'light' | 'luxury' | 'campaign-navy' | 'campaign-judicial' | 'crimson-bold' | 'emerald-gold' | 'custom';
  accentColor?: string;
  ctaText?: string;
  ctaHref?: string;
  /**
   * Whether this is a political campaign, decided once in SiteRenderer from
   * lib/siteKind rather than sniffed here.
   *
   * This block used to work it out from the accent colour — `accentColor ===
   * '#C5A059'` — which is the studio's own default gold. So any client who had
   * not changed their accent got a "Campaign Platform & Priorities" heading
   * over their service menu. That was the ninth copy of this guess in the
   * codebase and the second to key on that hex.
   */
  isCampaign?: boolean;
  /**
   * Show only the highlighted services, with a link to the full menu beneath.
   *
   * Twenty services is a wall on a home page and a menu on a page of its own.
   * The home page earns the visit; the menu answers "what does it cost".
   */
  featuredOnly?: boolean;
  /** Where "View all services" goes. Only rendered when featuredOnly is set. */
  viewAllHref?: string;
}

export function ServicesBlock({
  title = 'Our Services',
  subtitle = 'Professional, reliable, and tailored to your needs.',
  services,
  theme = 'dark',
  accentColor,
  ctaText,
  ctaHref = '#contact',
  isCampaign = false,
  featuredOnly = false,
  viewAllHref
}: ServicesBlockProps) {
  
  const displayTitle = isCampaign && title === 'Our Services' ? 'Campaign Platform & Priorities' : title;
  const displaySubtitle = isCampaign && subtitle === 'Professional, reliable, and tailored to your needs.' ? 'Our commitment to the community and our plan for the future.' : subtitle;
  const finalCtaText = ctaText || (isCampaign ? 'Read Policy' : 'Book Service');

  const isVotingStep = (s: ServiceItem) => {
    const t = (s.title || '').toLowerCase();
    const d = (s.duration || '').toLowerCase();
    const desc = (s.description || '').toLowerCase();
    return t.startsWith('step ') || 
           t.startsWith('step:') || 
           t.includes('select write-in') || 
           t.includes('enter waylon') || 
           t.includes('cast your ballot') || 
           t.includes('review & cast') || 
           t.includes('how to vote') || 
           d.includes('voting guide') || 
           desc.includes('write-in line') || 
           desc.includes('select the labeled') ||
           desc.includes('casting your ballot');
  };

  const all = isCampaign ? (services || []).filter(s => !isVotingStep(s)) : (services || []);

  /**
   * The categories actually present, in the order they first appear.
   *
   * Derived rather than configured: a category list kept separately from the
   * services drifts, and an empty "Extensions" tab on a salon that stopped
   * doing extensions is worse than no tabs at all.
   */
  const categories = useMemo(() => {
    const seen: string[] = [];
    for (const s of all) {
      const c = (s.category || '').trim();
      if (c && !seen.includes(c)) seen.push(c);
    }
    return seen;
  }, [all]);

  const [activeCategory, setActiveCategory] = useState<string>('All');

  // One category is not a filter, it is a label. Pills appear at two or more.
  const showFilters = !featuredOnly && categories.length > 1;

  const featured = all.filter(s => s.highlight);

  const shown = featuredOnly
    // Fall back to the first three when nothing is marked featured, so the home
    // page is never empty just because no one ticked a box.
    ? (featured.length ? featured : all.slice(0, 3))
    : showFilters && activeCategory !== 'All'
      ? all.filter(s => (s.category || '').trim() === activeCategory)
      : all;

  const reveal = useReveal();

  return (
    <section id="services" className={`py-16 sm:py-24 relative bg-[color:var(--ts-surface)] text-[color:var(--ts-text)]`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <motion.div
          className="text-center max-w-3xl mx-auto mb-12 sm:mb-16"
          variants={reveal.props.initial ? revealBlock : undefined}
          {...reveal.props}
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-3 bg-[color:var(--ts-accent-soft)] text-[color:var(--ts-accent)] border border-[color:var(--ts-accent-border)]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isCampaign ? 'Core Judicial & Policy Platform' : 'Featured Solutions'}</span>
          </div>
          <h2 className={`text-2xl sm:text-4xl font-extrabold tracking-tight mb-3 ${isCampaign ? 'font-serif' : ''}`}>
            {displayTitle}
          </h2>
          <p className={`text-sm sm:text-base text-[color:var(--ts-muted)]`}>
            {displaySubtitle}
          </p>
        </motion.div>

        {/* Category filter. Rendered only where there is something to filter —
            see showFilters. Pills rather than a select: six options a thumb can
            hit beat a dropdown that hides five of them. */}
        {showFilters && (
          <div
            className="flex flex-wrap justify-center gap-2 mb-10 sm:mb-12"
            role="tablist"
            aria-label="Filter services by category"
          >
            {['All', ...categories].map(cat => {
              const active = activeCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 border ${
                    active
                      ? 'bg-[color:var(--ts-text)] text-[color:var(--ts-bg)] border-[color:var(--ts-text)]'
                      : 'bg-transparent text-[color:var(--ts-muted)] border-[color:var(--ts-border)] hover:border-[color:var(--ts-text)] hover:text-[color:var(--ts-text)]'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        )}

        {/* Services Grid */}
        <motion.div
          className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6"
          variants={reveal.group}
          {...reveal.props}
        >
          {shown.map((service, idx) => (
            <motion.div
              key={idx}
              variants={reveal.item}
              className={`rounded-2xl p-6 sm:p-7 flex flex-col justify-between border transition-all duration-300 shadow-md hover:shadow-2xl hover:-translate-y-1 group ${
                service.highlight
                  ? 'border-[color:var(--ts-accent-border)] bg-[color:var(--ts-accent-soft)]'
                  : 'bg-[color:var(--ts-bg)] border-[color:var(--ts-border)] hover:border-[color:var(--ts-accent-border)]'
              }`}
            >
              <div>
                {/* Header with Title & Price */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className={`text-lg sm:text-xl font-bold transition-colors ${isCampaign ? 'font-serif' : ''} group-hover:text-[color:var(--ts-accent)]`}>
                    {service.title}
                  </h3>
                  {service.price && (
                    <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap flex-shrink-0 border bg-[color:var(--ts-accent-soft)] text-[color:var(--ts-accent)] border-[color:var(--ts-accent-border)]">
                      {service.price}
                    </span>
                  )}
                </div>

                <p className={`text-xs sm:text-sm mb-6 leading-relaxed text-[color:var(--ts-muted)]`}>
                  {service.description}
                </p>
              </div>

              {/* Action Button */}
              <div className="pt-4 border-t border-[color:var(--ts-border)] flex items-center justify-between">
                <span className="text-xs font-medium text-[color:var(--ts-muted)] flex items-center gap-2 min-w-0">
                  <span className="truncate">{service.duration || (isCampaign ? 'Core Pillar' : 'Standard')}</span>
                  {/* Shown only on the featured strip, where there are no pills
                      to say which group a service belongs to. On the full menu
                      the active pill already says it. */}
                  {featuredOnly && service.category && (
                    <span className="hidden sm:inline px-2 py-0.5 rounded-full text-[10px] font-semibold border border-[color:var(--ts-border)] text-[color:var(--ts-muted)] whitespace-nowrap">
                      {service.category}
                    </span>
                  )}
                </span>
                {(() => {
                  // Straight to this service where we have a link for it. A
                  // visitor who has already chosen "Balayage" should not be
                  // handed a menu and asked to choose it again — every extra
                  // step between deciding and booking loses some of them.
                  const href = service.bookingUrl || ctaHref;
                  const external = /^https?:\/\//i.test(href);
                  return (
                    <a
                      href={href}
                      target={external ? '_blank' : undefined}
                      rel={external ? 'noopener noreferrer' : undefined}
                      aria-label={`${finalCtaText}: ${service.title}`}
                      className={`inline-flex items-center text-xs sm:text-sm font-semibold group-hover:translate-x-1 transition-transform whitespace-nowrap text-[color:var(--ts-accent)]`}
                    >
                      <span>{finalCtaText}</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                    </a>
                  );
                })()}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* The way to the full menu. Only on the featured strip — on the menu
            itself there is nowhere further to go, and a button that returns you
            to the page you are on is noise. */}
        {featuredOnly && viewAllHref && all.length > shown.length && (
          <div className="mt-10 sm:mt-12 flex justify-center">
            <a
              href={viewAllHref}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold border border-[color:var(--ts-text)] text-[color:var(--ts-text)] hover:bg-[color:var(--ts-text)] hover:text-[color:var(--ts-bg)] transition-colors duration-200"
            >
              <span>View all {all.length} services</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        )}

      </div>
    </section>
  );
}
