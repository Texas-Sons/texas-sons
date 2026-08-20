import React from 'react';
import { Vote, ChevronRight } from 'lucide-react';

interface VotingBannerBlockProps {
  accentColor?: string;
}

export function VotingBannerBlock({ accentColor = '#C5A059' }: VotingBannerBlockProps) {
  return (
    <section className="bg-[color:var(--ts-surface)] border-b border-[color:var(--ts-border)] text-[color:var(--ts-text)] py-4 px-4 sm:px-6 lg:px-8 shadow-inner relative z-10">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[color:var(--ts-bg)] border border-[color:var(--ts-border)]">
            <Vote className="w-5 h-5" style={{ color: accentColor }} />
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide">Make Your Voice Heard</h3>
            <p className="text-xs text-[color:var(--ts-muted)] mt-0.5">Find early voting locations, maps, and important dates for Atascosa County.</p>
          </div>
        </div>
        <a 
          href="#voting"
          onclick={() => window.scrollTo(0,0)}
          className="flex-shrink-0 text-xs font-bold uppercase tracking-wide px-4 py-2.5 rounded-lg border hover:bg-[color:var(--ts-bg)] transition-all flex items-center gap-2 shadow-sm"
          style={{ borderColor: accentColor, color: accentColor }}
        >
          View Voting Info
          <ChevronRight className="w-3.5 h-3.5" />
        </a>
      </div>
    </section>
  );
}
