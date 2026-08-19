import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Star, CheckCircle, ChevronRight, Flag } from 'lucide-react';

interface CampaignHeroBlockProps {
  headline: string;
  subheadline: string;
  heroImage: string;
  accentColor?: string;
  badges?: string[];
  proofBadgeText?: string;
  ctaText?: string;
  secondaryCtaText?: string;
}

export function CampaignHeroBlock({
  headline,
  subheadline,
  heroImage,
  accentColor = '#C5A059',
  badges = [],
  proofBadgeText,
  ctaText = 'Join The Campaign',
  secondaryCtaText = 'Read Our Platform'
}: CampaignHeroBlockProps) {
  
  return (
    <section className="relative bg-[#00081e] text-white overflow-hidden min-h-[90vh] flex items-center">
      
      {/* Premium Background Textures */}
      <div className="absolute inset-0 opacity-20 mix-blend-overlay pointer-events-none" 
           style={{ backgroundImage: `radial-gradient(circle at 50% 50%, ${accentColor} 0%, transparent 60%)` }} />
      <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-[#00081e] to-transparent z-10" />

      {/* Hero Image */}
      <motion.div 
        initial={{ scale: 1.05, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="absolute inset-y-0 right-0 w-full lg:w-[55%] h-full z-0"
      >
        <img 
          src={heroImage} 
          alt={headline}
          className="w-full h-full object-cover object-top mask-image-gradient-l"
          style={{ WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 100%)' }}
        />
        {/* Color Grading Overlay */}
        <div className="absolute inset-0 bg-[#00081e]/40 mix-blend-color" />
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 w-full py-20 lg:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, staggerChildren: 0.15 }}
            className="lg:col-span-8 flex flex-col items-start"
          >
            {/* Top Stars / Seal */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-2 mb-6"
            >
              {[...Array(3)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-current" style={{ color: accentColor }} />
              ))}
              <span className="ml-2 text-xs font-bold uppercase tracking-[0.2em]" style={{ color: accentColor }}>
                Official Campaign
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight font-serif leading-[1.05] mb-6 drop-shadow-2xl"
            >
              {headline.split(' ').map((word, i) => (
                <span key={i} className={i === headline.split(' ').length - 1 ? "block mt-2" : "mr-3 inline-block"} style={i === headline.split(' ').length - 1 ? { color: accentColor } : {}}>
                  {word}
                </span>
              ))}
            </motion.h1>

            {/* Subheadline */}
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-lg sm:text-xl text-stone-300 font-medium max-w-2xl leading-relaxed mb-10 border-l-4 pl-4"
              style={{ borderColor: accentColor }}
            >
              {subheadline}
            </motion.p>

            {/* Badges Grid (Base44 staggered layout) */}
            {badges.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="grid grid-cols-2 gap-3 mb-12 w-full max-w-lg"
              >
                {badges.map((badge, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 bg-white/5 backdrop-blur-sm border border-white/10 px-3 py-2 rounded-lg">
                    <Shield className="w-4 h-4 flex-shrink-0" style={{ color: accentColor }} />
                    <span className="text-[11px] sm:text-xs font-bold tracking-wide uppercase text-stone-200">{badge}</span>
                  </div>
                ))}
              </motion.div>
            )}

            {/* CTA Buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
            >
              <button 
                className="px-8 py-4 rounded-xl font-bold text-sm uppercase tracking-wider transition-all hover:scale-105 shadow-xl flex items-center justify-center gap-2 group"
                style={{ backgroundColor: accentColor, color: '#00081e' }}
              >
                <Flag className="w-4 h-4" />
                {ctaText}
              </button>
              <button className="px-8 py-4 rounded-xl font-bold text-sm uppercase tracking-wider border border-stone-600 hover:border-white hover:bg-white/5 transition-all flex items-center justify-center gap-2">
                {secondaryCtaText}
                <ChevronRight className="w-4 h-4 opacity-50" />
              </button>
            </motion.div>

            {/* Proof Badge */}
            {proofBadgeText && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="mt-8 flex items-center gap-2 text-xs font-medium text-stone-400"
              >
                <CheckCircle className="w-4 h-4" style={{ color: accentColor }} />
                <span>{proofBadgeText}</span>
              </motion.div>
            )}

          </motion.div>
        </div>
      </div>
    </section>
  );
}
