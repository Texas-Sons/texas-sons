import React from 'react';
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
}

export function ServicesBlock({
  title = 'Our Services',
  subtitle = 'Professional, reliable, and tailored to your needs.',
  services,
  theme = 'dark',
  accentColor,
  ctaText,
  ctaHref = '#contact'
}: ServicesBlockProps) {
  const isCampaign = (theme === 'campaign-navy' || theme === 'campaign-judicial') || accentColor === '#C5A059' || title.toLowerCase().includes('platform') || title.toLowerCase().includes('issues');
  
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

  const filteredServices = isCampaign ? (services || []).filter(s => !isVotingStep(s)) : (services || []);

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

        {/* Services Grid */}
        <motion.div
          className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6"
          variants={reveal.group}
          {...reveal.props}
        >
          {filteredServices.map((service, idx) => (
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
                <span className="text-xs font-medium text-[color:var(--ts-muted)]">
                  {service.duration || (isCampaign ? 'Core Pillar' : 'Standard')}
                </span>
                <a
                  href={ctaHref}
                  className={`inline-flex items-center text-xs sm:text-sm font-semibold group-hover:translate-x-1 transition-transform whitespace-nowrap text-[color:var(--ts-accent)]`}
                >
                  <span>{finalCtaText}</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </a>
              </div>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}
