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
  const isCampaign = theme === 'campaign-navy' || accentColor === '#C5A059' || title.toLowerCase().includes('endorse') || title.toLowerCase().includes('judicial');

  return (
    <section id="reviews" className={`py-16 sm:py-24 relative bg-[color:var(--ts-bg)] text-[color:var(--ts-text)]`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="flex items-center justify-center gap-1 mb-2.5" aria-label={`${testimonials.length} testimonials`}>
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-current text-[color:var(--ts-accent)]" aria-hidden="true" />
            ))}
          </div>
          <h2 className={`text-2xl sm:text-4xl font-extrabold tracking-tight mb-3 ${isCampaign ? 'font-serif' : ''}`}>
            {title}
          </h2>
          <p className={`text-sm sm:text-base text-[color:var(--ts-muted)]`}>
            {subtitle}
          </p>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6">
          {testimonials.map((t, idx) => (
            <div
              key={idx}
              className={`rounded-2xl p-6 sm:p-7 border flex flex-col justify-between relative transition-all duration-300 hover:scale-[1.01] bg-[color:var(--ts-surface)] border-[color:var(--ts-border)] shadow-xl shadow-black/20`}
            >
              <div>
                <Quote className="w-7 h-7 mb-3 text-[color:var(--ts-accent)] opacity-40" aria-hidden="true" />
                <div className="flex gap-1 mb-3" aria-label={`${t.rating || 5} star rating`}>
                  {[...Array(t.rating || 5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current text-[color:var(--ts-accent)]" aria-hidden="true" />
                  ))}
                </div>
                <p className={`text-xs sm:text-sm leading-relaxed italic mb-6 text-[color:var(--ts-text)]`}>
                  "{t.quote}"
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[color:var(--ts-border)]">
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-[color:var(--ts-text)]">{t.author}</h4>
                  {t.role && <p className="text-[11px] text-[color:var(--ts-muted)]">{t.role}</p>}
                </div>
                <div className="flex items-center text-emerald-400 text-[11px] font-semibold gap-1">
                  <CheckCircle className="w-3 h-3" aria-hidden="true" />
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
