import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { ServiceItem } from './types';

interface ServicesBlockProps {
  title?: string;
  subtitle?: string;
  services: ServiceItem[];
  theme?: 'dark' | 'light' | 'luxury' | 'campaign-navy' | 'crimson-bold' | 'emerald-gold' | 'custom';
  accentColor?: string;
  ctaText?: string;
  ctaHref?: string;
}

export function ServicesBlock({
  title = 'Our Services & Pricing',
  subtitle = 'Transparent, upfront pricing with premium quality craftsmanship.',
  services,
  theme = 'dark',
  accentColor,
  ctaText = 'Book Service',
  ctaHref = '#contact'
}: ServicesBlockProps) {
  const isDark = theme !== 'light';
  const isCampaign = theme === 'campaign-navy' || accentColor === '#C5A059' || title.toLowerCase().includes('platform') || title.toLowerCase().includes('priorit');

  return (
    <section id="services" className={`py-16 sm:py-24 relative ${
      theme === 'campaign-navy' ? 'bg-[#00081e] text-white' : isDark ? 'bg-stone-900/60 text-white' : 'bg-white text-stone-900'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-3 ${
            isCampaign 
              ? 'bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/30'
              : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
          }`}>
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isCampaign ? 'Core Judicial & Policy Platform' : 'Featured Solutions'}</span>
          </div>
          <h2 className={`text-2xl sm:text-4xl font-extrabold tracking-tight mb-3 ${isCampaign ? 'font-serif' : ''}`}>
            {title}
          </h2>
          <p className={`text-sm sm:text-base ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
            {subtitle}
          </p>
        </div>

        {/* Services Grid - auto-fit minmax ensures single column on mobile frames */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6">
          {services.map((service, idx) => (
            <div
              key={idx}
              className={`rounded-2xl p-6 sm:p-7 flex flex-col justify-between border transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 group ${
                service.highlight
                  ? isCampaign
                    ? 'border-[#C5A059] bg-gradient-to-b from-[#020d29] to-[#00081e] shadow-2xl shadow-[#C5A059]/10'
                    : 'border-orange-500/80 bg-gradient-to-b from-stone-900 to-stone-950 shadow-orange-950/30'
                  : isDark
                    ? isCampaign
                      ? 'border-[#1e293b] bg-[#020d29]/70 hover:border-[#C5A059]/50'
                      : 'border-stone-800 bg-stone-950/70 hover:border-stone-700'
                    : 'border-stone-200 bg-stone-50 hover:border-stone-300'
              }`}
            >
              <div>
                {/* Header with Title & Price */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className={`text-lg sm:text-xl font-bold transition-colors ${
                    isCampaign ? 'font-serif group-hover:text-[#C5A059]' : 'group-hover:text-orange-400'
                  }`}>
                    {service.title}
                  </h3>
                  {service.price && (
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap flex-shrink-0 border ${
                      isCampaign
                        ? 'bg-[#C5A059]/15 text-[#C5A059] border-[#C5A059]/40'
                        : 'bg-orange-600/20 text-orange-400 border-orange-500/30'
                    }`}>
                      {service.price}
                    </span>
                  )}
                </div>

                <p className={`text-xs sm:text-sm mb-6 leading-relaxed ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                  {service.description}
                </p>
              </div>

              {/* Action Button */}
              <div className="pt-4 border-t border-stone-800/60 flex items-center justify-between">
                <span className={`text-xs font-medium ${isCampaign ? 'text-[#C5A059]/80' : 'text-stone-500'}`}>
                  {service.duration || (isCampaign ? 'Core Pillar' : 'Standard')}
                </span>
                <a
                  href={ctaHref}
                  className={`inline-flex items-center text-xs sm:text-sm font-semibold group-hover:translate-x-1 transition-transform whitespace-nowrap ${
                    isCampaign ? 'text-[#C5A059] hover:text-[#d6b46e]' : 'text-orange-400 hover:text-orange-300'
                  }`}
                >
                  <span>{ctaText}</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </a>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
