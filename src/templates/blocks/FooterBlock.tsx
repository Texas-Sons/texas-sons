import React from 'react';
import { MapPin, Phone, Mail, Clock, Shield, Vote, ExternalLink } from 'lucide-react';
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
      <footer className={`border-t py-16 ${
        theme === 'campaign-navy' 
          ? 'bg-[#00081e] border-[#1e293b] text-stone-300' 
          : isDark 
            ? 'bg-stone-950 border-stone-800 text-stone-300' 
            : 'bg-stone-100 border-stone-300 text-stone-700'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-8 sm:gap-10 mb-12">
            
            {/* Col 1: Campaign Identity */}
            <div className="space-y-4 min-w-0">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-[#C5A059]/20 border border-[#C5A059]/40 flex items-center justify-center text-[#C5A059] font-bold text-xs flex-shrink-0">
                  ★
                </div>
                <h3 className="text-xl font-serif font-bold text-white tracking-tight truncate">
                  {business.name}
                </h3>
              </div>
              <p className="text-xs leading-relaxed text-stone-400">
                {business.description || business.tagline || 'Dedicated constitutional leadership, courtroom excellence, and community safety for Texas families.'}
              </p>
            </div>

            {/* Col 2: Campaign Headquarters Contact */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#C5A059]">Campaign HQ</h4>
              {business.phone && (
                <div className="flex items-center text-xs gap-2.5">
                  <Phone className="w-4 h-4 text-[#C5A059] flex-shrink-0" />
                  <a href={`tel:${business.phone}`} className="hover:text-white transition-colors">{business.phone}</a>
                </div>
              )}
              {business.email && (
                <div className="flex items-center text-xs gap-2.5">
                  <Mail className="w-4 h-4 text-[#C5A059] flex-shrink-0" />
                  <a href={`mailto:${business.email}`} className="hover:text-white transition-colors">{business.email}</a>
                </div>
              )}
              {business.address && (
                <div className="flex items-start text-xs gap-2.5">
                  <MapPin className="w-4 h-4 text-[#C5A059] flex-shrink-0 mt-0.5" />
                  <span className="text-stone-400">{business.address}</span>
                </div>
              )}
            </div>

            {/* Col 3: Quick Navigation Links */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#C5A059]">Campaign Navigation</h4>
              <ul className="space-y-2 text-xs">
                <li><a href="#hero" className="hover:text-white transition-colors text-stone-400">Meet the Candidate</a></li>
                <li><a href="#services" className="hover:text-white transition-colors text-stone-400">Key Policy Platform</a></li>
                <li><a href="#reviews" className="hover:text-white transition-colors text-stone-400">Official Endorsements</a></li>
                <li><a href="#contact" className="hover:text-white transition-colors text-stone-400">Volunteer & Yard Signs</a></li>
                <li><a href="#contact" className="hover:text-[#C5A059] font-semibold transition-colors text-stone-300">Contribute / Donate</a></li>
              </ul>
            </div>

            {/* Col 4: Official Political Disclaimer Box (Required by Law) */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#C5A059]">Legal Disclaimer</h4>
              
              {/* Campaign Box */}
              <div className="p-3.5 rounded-xl border border-[#C5A059]/30 bg-stone-900/60 space-y-2">
                <p className="text-[11px] leading-relaxed text-stone-300">
                  Political advertising paid for by the <strong className="text-white">{business.name} Campaign</strong>.
                </p>
                <p className="text-[10px] text-stone-400">
                  Treasurer: Marcus Sterling. Contributions are not tax-deductible for federal income tax purposes.
                </p>
                <div className="pt-1 flex items-center gap-1.5 text-[10px] text-[#C5A059] font-bold">
                  <Vote className="w-3 h-3" />
                  <span>Official Election Campaign</span>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-stone-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <p className="text-stone-400">© {currentYear} {business.name}. All rights reserved.</p>
            <p className="text-stone-500 text-[11px]">
              Campaign Infrastructure by <span className="text-[#C5A059] font-semibold">Texas Sons</span>
            </p>
          </div>

        </div>
      </footer>
    );
  }

  // Standard Commercial / Business Footer
  return (
    <footer className={`border-t py-16 ${
      isDark ? 'bg-stone-950 border-stone-900 text-stone-400' : 'bg-stone-100 border-stone-200 text-stone-600'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-8 sm:gap-10 mb-12">
          
          {/* Col 1: Brand */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white tracking-tight">
              {business.name}
            </h3>
            <p className="text-sm leading-relaxed text-stone-400">
              {business.description || business.tagline || 'Proudly serving our local community with excellence, integrity, and top-tier craftsmanship.'}
            </p>
          </div>

          {/* Col 2: Contact Info */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-200">Contact Us</h4>
            {business.phone && (
              <div className="flex items-center text-sm gap-2.5">
                <Phone className="w-4 h-4 text-orange-500 flex-shrink-0" />
                <a href={`tel:${business.phone}`} className="hover:text-white transition-colors">{business.phone}</a>
              </div>
            )}
            {business.email && (
              <div className="flex items-center text-sm gap-2.5">
                <Mail className="w-4 h-4 text-orange-500 flex-shrink-0" />
                <a href={`mailto:${business.email}`} className="hover:text-white transition-colors">{business.email}</a>
              </div>
            )}
            {business.address && (
              <div className="flex items-start text-sm gap-2.5">
                <MapPin className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                <span>{business.address}</span>
              </div>
            )}
          </div>

          {/* Col 3: Operating Hours */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-200">Hours of Operation</h4>
            {business.hours ? (
              Array.isArray(business.hours) ? (
                <div className="space-y-1 text-xs">
                  {business.hours.map((h, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center text-sm gap-2.5">
                  <Clock className="w-4 h-4 text-orange-500 flex-shrink-0" />
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
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-200">Our Guarantee</h4>
            <p className="text-sm">
              100% satisfaction guaranteed on all work performed. Licensed, insured, and verified.
            </p>
            <div className="pt-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Verified Local Business
              </span>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-stone-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p>© {currentYear} {business.name}. All rights reserved.</p>
          <p className="text-stone-500">
            Engineered by <span className="text-orange-500 font-semibold">Texas Sons</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
