import React from 'react';
import { Vote, ChevronRight, MapPin, Calendar } from 'lucide-react';

interface VotingBannerBlockProps {
  accentColor?: string;
}

export function VotingBannerBlock({ accentColor = '#C5A059' }: VotingBannerBlockProps) {
  return (
    <section className="relative z-10 py-6 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-[#000d2b] via-[#00081e] to-[#000d2b] border-y-2 border-[color:var(--ts-accent)] shadow-2xl overflow-hidden">
      {/* Subtle background glow effect */}
      <div 
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at center, ${accentColor} 0%, transparent 70%)`
        }}
      />

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-5 relative z-10">
        
        {/* Left Side: Badge & Copy */}
        <div className="flex items-center gap-4 text-center md:text-left flex-col sm:flex-row">
          <div 
            className="w-12 h-12 rounded-2xl flex items-center justify-center border shadow-lg flex-shrink-0"
            style={{ 
              backgroundColor: `${accentColor}1a`, 
              borderColor: `${accentColor}60`,
              color: accentColor 
            }}
          >
            <Vote className="w-6 h-6" />
          </div>

          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
              <span 
                className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest border"
                style={{ 
                  backgroundColor: `${accentColor}25`, 
                  borderColor: `${accentColor}50`, 
                  color: accentColor 
                }}
              >
                ★ Official 2026 Voter Information
              </span>
              <span className="text-[11px] font-semibold text-slate-400 hidden sm:inline">
                Atascosa County, TX
              </span>
            </div>
            
            <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
              Make Your Voice Heard in the Upcoming Sheriff Election
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Access early voting locations, precinct maps, accepted voter IDs, and official polling times.
            </p>
          </div>
        </div>

        {/* Right Side: CTA Button */}
        <a 
          href="#voting"
          onClick={() => window.scrollTo(0, 0)}
          className="flex-shrink-0 px-6 py-3 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-xl hover:scale-105 active:scale-95 text-[#00081e]"
          style={{ 
            backgroundColor: accentColor,
            boxShadow: `0 0 20px ${accentColor}40`
          }}
        >
          <span>View Voting Info & Maps</span>
          <ChevronRight className="w-4 h-4" />
        </a>

      </div>
    </section>
  );
}

