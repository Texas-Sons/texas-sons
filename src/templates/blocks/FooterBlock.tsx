import React from 'react';
import { MapPin, Phone, Mail, Clock, Shield, Vote } from 'lucide-react';
import { BusinessProfile } from './types';

interface FooterBlockProps {
  business: BusinessProfile;
  theme?: string;
}

export function FooterBlock({ business, theme = 'dark' }: FooterBlockProps) {
  const isCampaign = business.name.toLowerCase().includes('campaign') ||
                     business.name.toLowerCase().includes('sheriff') ||
                     business.name.toLowerCase().includes('judge') ||
                     business.category === 'Campaign & Leadership' ||
                     theme === 'campaign-navy';

  const isDark = theme !== 'light';
  const currentYear = new Date().getFullYear();

  // Campaign Footer Layout
  if (isCampaign) {
    return (
      <footer className={`border-t py-16 bg-[color:var(--ts-bg)] border-[color:var(--ts-border)] text-[color:var(--ts-muted)]`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-8 sm:gap-10 mb-12">

            {/* Col 1: Campaign Identity */}
            <div className="space-y-4 min-w-0">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-[color:var(--ts-accent-soft)] border border-[color:var(--ts-accent-border)] flex items-center justify-center text-[color:var(--ts-accent)] font-bold text-xs flex-shrink-0" aria-hidden="true">
                  ★
                </div>
                <h3 className="text-xl font-serif font-bold text-[color:var(--ts-text)] tracking-tight truncate">
                  {business.name}
                </h3>
              </div>
              <p className="text-xs leading-relaxed text-[color:var(--ts-muted)]">
                {business.description || business.tagline || 'Dedicated constitutional leadership, courtroom excellence, and community safety for Texas families.'}
              </p>
            </div>

            {/* Col 2: Campaign Headquarters Contact */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[color:var(--ts-accent)]">Campaign HQ</h4>
              {business.phone && (
                <div className="flex items-center text-xs gap-2.5">
                  <Phone className="w-4 h-4 text-[color:var(--ts-accent)] flex-shrink-0" aria-hidden="true" />
                  <a href={`tel:${business.phone}`} className="hover:text-[color:var(--ts-text)] transition-colors">{business.phone}</a>
                </div>
              )}
              {business.email && (
                <div className="flex items-center text-xs gap-2.5">
                  <Mail className="w-4 h-4 text-[color:var(--ts-accent)] flex-shrink-0" aria-hidden="true" />
                  <a href={`mailto:${business.email}`} className="hover:text-[color:var(--ts-text)] transition-colors">{business.email}</a>
                </div>
              )}
              {business.address && (
                <div className="flex items-start text-xs gap-2.5">
                  <MapPin className="w-4 h-4 text-[color:var(--ts-accent)] flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <span className="text-[color:var(--ts-muted)]">{business.address}</span>
                </div>
              )}
            </div>

            {/* Col 3: Quick Navigation Links */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[color:var(--ts-accent)]">Campaign Navigation</h4>
              <ul className="space-y-2 text-xs">
                <li><a href="#hero" className="hover:text-[color:var(--ts-text)] transition-colors text-[color:var(--ts-muted)]">Meet the Candidate</a></li>
                <li><a href="#services" className="hover:text-[color:var(--ts-text)] transition-colors text-[color:var(--ts-muted)]">Key Policy Platform</a></li>
                <li><a href="#reviews" className="hover:text-[color:var(--ts-text)] transition-colors text-[color:var(--ts-muted)]">Official Endorsements</a></li>
                <li><a href="#contact" className="hover:text-[color:var(--ts-text)] transition-colors text-[color:var(--ts-muted)]">Volunteer & Yard Signs</a></li>
                <li><a href="#contact" className="hover:text-[color:var(--ts-accent)] font-semibold transition-colors text-[color:var(--ts-muted)]">Contribute / Donate</a></li>
              </ul>
            </div>

            {/* Col 4: Official Political Disclaimer Box (Required by Law) */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[color:var(--ts-accent)]">Legal Disclaimer</h4>

              {/* Campaign Box */}
              <div className="p-3.5 rounded-xl border border-[color:var(--ts-accent-border)] bg-[color:var(--ts-surface)] space-y-2">
                <p className="text-[11px] leading-relaxed text-[color:var(--ts-muted)]">
                  Political advertising paid for by the <strong className="text-[color:var(--ts-text)]">{business.name} Campaign</strong>.
                </p>
                <p className="text-[10px] text-[color:var(--ts-muted)]">
                  Treasurer: Marcus Sterling. Contributions are not tax-deductible for federal income tax purposes.
                </p>
                <div className="pt-1 flex items-center gap-1.5 text-[10px] text-[color:var(--ts-accent)] font-bold">
                  <Vote className="w-3 h-3" aria-hidden="true" />
                  <span>Official Election Campaign</span>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-[color:var(--ts-border)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <p className="text-[color:var(--ts-muted)]">© {currentYear} {business.name}. All rights reserved.</p>
            <p className="text-[color:var(--ts-muted)] text-[11px]">
              Campaign Infrastructure by <span className="text-[color:var(--ts-accent)] font-semibold">Texas Sons</span>
            </p>
          </div>

        </div>
      </footer>
    );
  }

  // Standard Commercial / Business Footer
  return (
    <footer className={`border-t py-16 bg-[color:var(--ts-bg)] border-[color:var(--ts-border)] text-[color:var(--ts-muted)]`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-8 sm:gap-10 mb-12">

          {/* Col 1: Brand */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-[color:var(--ts-text)] tracking-tight">
              {business.name}
            </h3>
            <p className="text-sm leading-relaxed text-[color:var(--ts-muted)]">
              {business.description || business.tagline || 'Proudly serving our local community with excellence, integrity, and top-tier craftsmanship.'}
            </p>
          </div>

          {/* Col 2: Contact Info */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[color:var(--ts-text)]">Contact Us</h4>
            {business.phone && (
              <div className="flex items-center text-sm gap-2.5">
                <Phone className="w-4 h-4 text-[color:var(--ts-accent)] flex-shrink-0" aria-hidden="true" />
                <a href={`tel:${business.phone}`} className="hover:text-[color:var(--ts-text)] transition-colors">{business.phone}</a>
              </div>
            )}
            {business.email && (
              <div className="flex items-center text-sm gap-2.5">
                <Mail className="w-4 h-4 text-[color:var(--ts-accent)] flex-shrink-0" aria-hidden="true" />
                <a href={`mailto:${business.email}`} className="hover:text-[color:var(--ts-text)] transition-colors">{business.email}</a>
              </div>
            )}
            {business.address && (
              <div className="flex items-start text-sm gap-2.5">
                <MapPin className="w-4 h-4 text-[color:var(--ts-accent)] flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span>{business.address}</span>
              </div>
            )}
          </div>

          {/* Col 3: Operating Hours */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[color:var(--ts-text)]">Hours of Operation</h4>
            {business.hours ? (
              Array.isArray(business.hours) ? (
                <div className="space-y-1 text-xs">
                  {business.hours.map((h, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-[color:var(--ts-accent)] flex-shrink-0" aria-hidden="true" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center text-sm gap-2.5">
                  <Clock className="w-4 h-4 text-[color:var(--ts-accent)] flex-shrink-0" aria-hidden="true" />
                  <span>{business.hours}</span>
                </div>
              )
            ) : (
              <div className="text-sm space-y-1">
                <p>Monday - Friday: 8:00 AM - 6:00 PM</p>
                <p>Saturday: 9:00 AM - 4:00 PM</p>
                <p>Sunday: Closed</p>
              </div>
            )}
          </div>

          {/* Col 4: Service Guarantee */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[color:var(--ts-text)]">Our Guarantee</h4>
            <p className="text-sm">
              100% satisfaction guaranteed on all work performed. Licensed, insured, and verified.
            </p>
            <div className="pt-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Shield className="w-3 h-3 mr-1" aria-hidden="true" />
                Verified Local Business
              </span>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-[color:var(--ts-border)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p>© {currentYear} {business.name}. All rights reserved.</p>
          <p className="text-[color:var(--ts-muted)]">
            Engineered by <span className="text-[color:var(--ts-accent)] font-semibold">Texas Sons</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
