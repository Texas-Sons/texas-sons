import React from 'react';
import { Calendar, Clock, MapPin, Users, ArrowRight, Star, Sparkles } from 'lucide-react';
import { EventItem } from './types';

interface EventsBlockProps {
  events?: EventItem[];
  theme?: 'dark' | 'light' | 'luxury' | 'campaign-navy' | 'crimson-bold' | 'emerald-gold' | 'custom';
  accentColor?: string;
  title?: string;
  subtitle?: string;
}

export function EventsBlock({
  events = [
    { id: '1', name: 'Jourdanton Community Town Hall & Meet-and-Greet', date: 'Oct 24, 2026', time: '6:30 PM', location: 'Atascosa County Courthouse Annex', rsvpCount: 142 },
    { id: '2', name: 'Sheriff Campaign Rally & BBQ Fundraiser', date: 'Nov 02, 2026', time: '7:00 PM', location: 'Pleasanton Civic Center Plaza', rsvpCount: 215 },
    { id: '3', name: 'Rural Landowners & Public Safety Forum', date: 'Nov 14, 2026', time: '5:30 PM', location: 'Poteet Community Hall', rsvpCount: 98 }
  ],
  theme = 'campaign-navy',
  accentColor = '#C5A059',
  title = 'Upcoming Campaign Events & Town Halls',
  subtitle = 'Join Ernest Trevino across Atascosa County. Ask questions, meet the candidate, and unite for safer communities.'
}: EventsBlockProps) {
  
  if (!events || events.length === 0) return null;

  return (
    <section id="events" className="py-16 sm:py-24 bg-[color:var(--ts-bg)] text-[color:var(--ts-text)] border-t border-[color:var(--ts-border)] relative overflow-hidden">
      {/* Subtle Background Glow */}
      <div 
        className="absolute top-0 right-1/4 w-96 h-96 opacity-10 blur-3xl pointer-events-none rounded-full"
        style={{ backgroundColor: accentColor }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border mb-4 backdrop-blur-sm bg-[color:var(--ts-accent-soft)] border-[color:var(--ts-accent-border)] text-[color:var(--ts-accent)] text-xs font-bold uppercase tracking-wider">
            <Calendar className="w-3.5 h-3.5" />
            <span>Community Outreach</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight font-serif mb-4 leading-tight">
            {title}
          </h2>

          <p className="text-sm sm:text-base text-[color:var(--ts-muted)] leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event, idx) => {
            // Parse Date string into Month & Day if possible
            const dateParts = event.date.split(' ');
            const month = dateParts[0] || 'OCT';
            const day = (dateParts[1] || '').replace(',', '') || '20';
            const year = dateParts[2] || '2026';

            return (
              <div
                key={event.id || idx}
                className="rounded-2xl p-6 border transition-all duration-300 hover:scale-[1.02] flex flex-col justify-between bg-[color:var(--ts-surface)] border-[color:var(--ts-border)] hover:border-[color:var(--ts-accent-border)] shadow-xl group relative overflow-hidden"
              >
                {/* Top Glowing Edge on hover */}
                <div 
                  className="absolute top-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ backgroundColor: accentColor }}
                />

                <div>
                  {/* Date & RSVP Badge Row */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-12 h-14 rounded-xl flex flex-col items-center justify-center border shadow-md font-mono"
                        style={{ 
                          backgroundColor: `${accentColor}15`, 
                          borderColor: `${accentColor}40`,
                          color: accentColor 
                        }}
                      >
                        <span className="text-[10px] font-extrabold uppercase tracking-wider">{month}</span>
                        <span className="text-lg font-black leading-none">{day}</span>
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-[color:var(--ts-muted)]">{year}</span>
                        <p className="text-xs font-bold text-[color:var(--ts-text)] flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[color:var(--ts-accent)]" />
                          <span>{event.time || 'TBD'}</span>
                        </p>
                      </div>
                    </div>

                    {event.rsvpCount ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>{event.rsvpCount} RSVP</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-800 text-stone-300">
                        Open Entry
                      </span>
                    )}
                  </div>

                  {/* Event Title */}
                  <h3 className="font-bold text-lg text-white group-hover:text-[color:var(--ts-accent)] transition-colors mb-3 leading-snug">
                    {event.name}
                  </h3>

                  {/* Location Info */}
                  <div className="flex items-start gap-2 text-xs text-[color:var(--ts-muted)] mb-6">
                    <MapPin className="w-4 h-4 text-[color:var(--ts-accent)] flex-shrink-0 mt-0.5" />
                    <span>{event.location}</span>
                  </div>
                </div>

                {/* Card Action Button */}
                <a
                  href="#contact"
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-stone-700 hover:border-white bg-stone-900/60 hover:bg-[color:var(--ts-accent)] hover:text-[#00081e] text-stone-200"
                >
                  <span>RSVP / Request Yard Sign</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>

              </div>
            );
          })}
        </div>

        {/* Bottom Campaign Schedule Note */}
        <div className="mt-12 text-center">
          <p className="text-xs text-stone-400">
            Want Ernest Trevino to speak at your community event or neighborhood meeting?{' '}
            <a href="#contact" className="font-bold underline text-[color:var(--ts-accent)] hover:opacity-80">
              Submit an invitation →
            </a>
          </p>
        </div>

      </div>
    </section>
  );
}
