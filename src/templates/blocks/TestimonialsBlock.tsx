import React from 'react';
import { Star, CheckCircle, Quote } from 'lucide-react';
import { motion } from 'framer-motion';
import { TestimonialItem } from './types';

interface TestimonialsBlockProps {
  title?: string;
  subtitle?: string;
  testimonials: TestimonialItem[];
  theme?: 'dark' | 'light' | 'luxury' | 'campaign-navy' | 'crimson-bold' | 'emerald-gold' | 'custom';
  accentColor?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 100, damping: 20 }
  }
};

export function TestimonialsBlock({
  title = 'What Our Clients Say',
  subtitle = 'Real reviews and endorsements from verified members in our community.',
  testimonials,
  theme = 'dark',
  accentColor
}: TestimonialsBlockProps) {
  const isCampaign = theme === 'campaign-navy' || accentColor === '#C5A059' || title.toLowerCase().includes('endorse') || title.toLowerCase().includes('judicial');

  return (
    <section id="reviews" className="py-20 sm:py-32 relative bg-[color:var(--ts-bg)] text-[color:var(--ts-text)] overflow-hidden">
      {/* Premium Background Elements */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[color:var(--ts-border)] to-transparent" />
      <div className="absolute -top-64 -left-64 w-96 h-96 bg-[color:var(--ts-accent)] rounded-full mix-blend-screen filter blur-[128px] opacity-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16 sm:mb-24"
        >
          <div className="flex items-center justify-center gap-1.5 mb-4" aria-label={`${testimonials.length} testimonials`}>
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-5 h-5 fill-current text-[color:var(--ts-accent)] drop-shadow-[0_0_8px_var(--ts-accent)]" aria-hidden="true" />
            ))}
          </div>
          <h2 className={`text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4 ${isCampaign ? 'font-serif tracking-normal' : ''}`}>
            {title}
          </h2>
          <p className="text-base sm:text-lg text-[color:var(--ts-muted)] font-medium max-w-2xl mx-auto">
            {subtitle}
          </p>
        </motion.div>

        {/* Reviews Grid - Masonry & Overlapping Layout (Base44 style) */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8 lg:gap-10"
        >
          {testimonials.map((t, idx) => (
            <motion.div
              key={idx}
              variants={cardVariants}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              // Alternate vertical translation to create an interlocking masonry feel
              className={`rounded-3xl p-8 sm:p-10 border flex flex-col justify-between relative bg-[color:var(--ts-surface)] border-[color:var(--ts-border)] shadow-2xl shadow-black/30 backdrop-blur-sm ${
                idx % 3 === 1 ? 'xl:translate-y-12' : idx % 3 === 2 ? 'xl:-translate-y-6' : ''
              }`}
            >
              <div className="absolute top-0 right-8 -translate-y-1/2 bg-[color:var(--ts-bg)] px-2">
                <Quote className="w-10 h-10 text-[color:var(--ts-accent)] opacity-80" aria-hidden="true" />
              </div>

              <div>
                <div className="flex gap-1 mb-6" aria-label={`${t.rating || 5} star rating`}>
                  {[...Array(t.rating || 5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current text-[color:var(--ts-accent)]" aria-hidden="true" />
                  ))}
                </div>
                <p className="text-sm sm:text-base leading-relaxed mb-8 text-[color:var(--ts-text)] font-medium">
                  "{t.quote}"
                </p>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-[color:var(--ts-border)]/50">
                <div>
                  <h4 className={`font-bold text-sm text-[color:var(--ts-text)] ${isCampaign ? 'uppercase tracking-wider text-xs' : ''}`}>
                    {t.author}
                  </h4>
                  {t.role && <p className="text-xs text-[color:var(--ts-accent)] font-medium mt-1">{t.role}</p>}
                </div>
                {!isCampaign && t.verified && (
                  <div className="flex items-center text-emerald-400/90 text-xs font-bold gap-1.5 uppercase tracking-wide bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                    <CheckCircle className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Verified</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}
