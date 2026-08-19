import React from 'react';
import { Star, CheckCircle, Quote } from 'lucide-react';
import { TestimonialItem } from './types';

interface TestimonialsBlockProps {
  title?: string;
  subtitle?: string;
  testimonials: TestimonialItem[];
  theme?: 'dark' | 'light' | 'luxury' | 'campaign-navy' | 'crimson-bold' | 'emerald-gold' | 'custom';
  accentColor?: string;
}

export function TestimonialsBlock({
  title = 'What Our Clients Say',
  subtitle = 'Real reviews and endorsements from verified members in our community.',
  testimonials,
  theme = 'dark',
  accentColor
}: TestimonialsBlockProps) {
  const isDark = theme !== 'light';
  const isCampaign = theme === 'campaign-navy' || accentColor === '#C5A059' || title.toLowerCase().includes('endorse') || title.toLowerCase().includes('judicial');

  return (
    <section id="reviews" className={`py-16 sm:py-24 relative ${
      theme === 'campaign-navy' ? 'bg-[#00081e] text-white' : isDark ? 'bg-stone-950 text-white' : 'bg-stone-50 text-stone-900'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="flex items-center justify-center gap-1 mb-2.5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className={`w-4 h-4 fill-current ${isCampaign ? 'text-[#C5A059]' : 'text-amber-400'}`} />
            ))}
          </div>
          <h2 className={`text-2xl sm:text-4xl font-extrabold tracking-tight mb-3 ${isCampaign ? 'font-serif' : ''}`}>
            {title}
          </h2>
          <p className={`text-sm sm:text-base ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
            {subtitle}
          </p>
        </div>

        {/* Reviews Grid - auto-fit minmax ensures single column on mobile frames */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6">
          {testimonials.map((t, idx) => (
            <div
              key={idx}
              className={`rounded-2xl p-6 sm:p-7 border flex flex-col justify-between relative transition-all duration-300 hover:scale-[1.01] ${
                isCampaign
                  ? 'bg-[#020d29]/80 border-[#C5A059]/30 shadow-xl shadow-black/40'
                  : isDark 
                    ? 'bg-stone-900/80 border-stone-800 shadow-xl shadow-black/40' 
                    : 'bg-white border-stone-200 shadow-lg'
              }`}
            >
              <div>
                <Quote className={`w-7 h-7 mb-3 ${isCampaign ? 'text-[#C5A059]/40' : 'text-orange-500/30'}`} />
                <div className="flex gap-1 mb-3">
                  {[...Array(t.rating || 5)].map((_, i) => (
                    <Star key={i} className={`w-3.5 h-3.5 fill-current ${isCampaign ? 'text-[#C5A059]' : 'text-amber-400'}`} />
                  ))}
                </div>
                <p className={`text-xs sm:text-sm leading-relaxed italic mb-6 ${isDark ? 'text-stone-200' : 'text-stone-700'}`}>
                  "{t.quote}"
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-stone-800/60">
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-white">{t.author}</h4>
                  {t.role && <p className={`text-[11px] ${isCampaign ? 'text-[#C5A059]' : 'text-stone-400'}`}>{t.role}</p>}
                </div>
                <div className="flex items-center text-emerald-400 text-[11px] font-semibold gap-1">
                  <CheckCircle className="w-3 h-3" />
                  <span>{isCampaign ? 'Endorsement' : 'Verified'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
