import React from 'react';
import { Vote, MapPin, Clock, Phone, FileText, ExternalLink, ArrowLeft, Info } from 'lucide-react';
import { motion } from 'framer-motion';

interface VotingPageBlockProps {
  theme?: string;
  accentColor?: string;
}

export function VotingPageBlock({ accentColor = '#C5A059' }: VotingPageBlockProps) {
  return (
    <div className="min-h-screen bg-[color:var(--ts-bg)] text-[color:var(--ts-text)]">
      {/* Header Hero */}
      <div className="relative py-20 sm:py-32 overflow-hidden border-b border-[color:var(--ts-border)]">
        <div className="absolute inset-0 opacity-10 bg-[color:var(--ts-accent)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <button 
            onClick={() => { window.location.hash = ''; window.scrollTo(0,0); }}
            className="mb-8 inline-flex items-center text-sm font-bold uppercase tracking-wider bg-[color:var(--ts-surface)] px-4 py-2 rounded-full border border-[color:var(--ts-border)] hover:scale-105 transition-transform"
            style={{ color: accentColor }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Main Site
          </button>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6"
          >
            Official Voting Information
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg sm:text-xl max-w-3xl text-[color:var(--ts-muted)] leading-relaxed"
          >
            Your vote is your voice. Below you will find all the official Atascosa County election data required to ensure you are ready for Election Day.
          </motion.p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Key Resources */}
            <div className="bg-[color:var(--ts-surface)] border border-[color:var(--ts-border)] rounded-2xl p-8 shadow-lg">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <FileText className="w-6 h-6" style={{ color: accentColor }} />
                Important Voter Resources
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { title: 'Early Voting Information', desc: 'Locations, dates, and times for early voting.', link: 'https://co.atascosa.tx.us/wp-content/uploads/2026/08/2026-LOCATION-AND-TIMES-ANNOUNCEMENTENGLISH_Page_1-scaled.jpg' },
                  { title: 'Election Day Voting', desc: 'Everything you need to know for Election Day.', link: 'https://co.atascosa.tx.us/wp-content/uploads/2026/08/2026-LOCATION-AND-TIMES-ANNOUNCEMENTENGLISH_Page_2.jpg' },
                  { title: 'Voter ID Requirements', desc: 'Accepted forms of identification for Texas voters.', link: 'http://www.sos.state.tx.us/elections/forms/id/poster-8.5x14-aw-voter.pdf' },
                  { title: 'Texas Secretary of State', desc: 'Check your voter registration status and more.', link: 'https://www.sos.state.tx.us/' }
                ].map((item, i) => (
                  <a 
                    key={i} 
                    href={item.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-[color:var(--ts-bg)] border border-[color:var(--ts-border)] p-4 rounded-xl hover:border-white/30 transition-all group"
                  >
                    <h4 className="font-bold text-base mb-1 group-hover:text-[color:var(--ts-accent)] transition-colors">{item.title}</h4>
                    <p className="text-[color:var(--ts-muted)] text-sm mb-3">{item.desc}</p>
                    <div className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider" style={{ color: accentColor }}>
                      View Document
                      <ExternalLink className="w-3 h-3" />
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* District Maps */}
            <div className="bg-[color:var(--ts-surface)] border border-[color:var(--ts-border)] rounded-2xl p-8 shadow-lg">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <MapPin className="w-6 h-6" style={{ color: accentColor }} />
                Atascosa County District Maps
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: 'All Districts', link: 'https://co.atascosa.tx.us/wp-content/uploads/2026/02/Atascosa-VTD-Mapbook-2020.pdf' },
                  { id: 'District 1', link: 'https://co.atascosa.tx.us/wp-content/uploads/2026/02/Atascosa-VTD-Mapbook-2020-01.pdf' },
                  { id: 'District 2', link: 'https://co.atascosa.tx.us/wp-content/uploads/2026/02/Atascosa-VTD-Mapbook-2020-02.pdf' },
                  { id: 'District 3', link: 'https://co.atascosa.tx.us/wp-content/uploads/2026/02/Atascosa-VTD-Mapbook-2020-03.pdf' },
                  { id: 'District 4', link: 'https://co.atascosa.tx.us/wp-content/uploads/2026/02/Atascosa-VTD-Mapbook-2020-04.pdf' },
                  { id: 'District 5', link: 'https://co.atascosa.tx.us/wp-content/uploads/2026/02/Atascosa-VTD-Mapbook-2020-05.pdf' },
                  { id: 'District 6', link: 'https://co.atascosa.tx.us/wp-content/uploads/2026/02/Atascosa-VTD-Mapbook-2020-06.pdf' }
                ].map((map, i) => (
                  <a 
                    key={i} 
                    href={map.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-[color:var(--ts-bg)] border border-[color:var(--ts-border)] px-4 py-3 rounded-lg text-center hover:bg-[color:var(--ts-border)] transition-all"
                  >
                    <span className="text-sm font-bold">{map.id}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar (Info) */}
          <div className="lg:col-span-1">
            <div className="sticky top-32 bg-[color:var(--ts-surface)] border border-[color:var(--ts-border)] rounded-2xl p-8 shadow-lg">
              <h3 className="text-xl sm:text-2xl font-bold mb-6 border-b border-[color:var(--ts-border)] pb-4">
                Elections Administration
              </h3>
              
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-[color:var(--ts-muted)] mb-1">Administrator</p>
                  <p className="font-bold">Cathy Seiter</p>
                </div>

                <div className="flex gap-3">
                  <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: accentColor }} />
                  <div>
                    <p className="text-sm text-[color:var(--ts-muted)] mb-1">Address</p>
                    <p className="font-medium text-sm">914 Main Street<br />Suite 115<br />Jourdanton, TX 78026</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Phone className="w-5 h-5 flex-shrink-0" style={{ color: accentColor }} />
                  <div>
                    <p className="text-sm text-[color:var(--ts-muted)] mb-1">Phone / Fax</p>
                    <p className="font-medium text-sm">(830) 769-1472 <span className="text-[color:var(--ts-muted)]">P</span><br />(830) 769-1215 <span className="text-[color:var(--ts-muted)]">F</span></p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Clock className="w-5 h-5 flex-shrink-0" style={{ color: accentColor }} />
                  <div>
                    <p className="text-sm text-[color:var(--ts-muted)] mb-1">Hours</p>
                    <p className="font-medium text-sm">8:00 a.m. – 5:00 p.m.<br /><span className="text-[color:var(--ts-muted)] font-normal block mt-0.5">Closed 12:00 p.m. to 1:00 p.m.</span></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
