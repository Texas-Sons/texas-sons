import React, { useState } from 'react';
import { Menu, X, Phone, ArrowRight, Shield, Star, Vote } from 'lucide-react';
import { ScalesOfJusticeIcon } from './CampaignIcons';
import { NavItem } from './types';

interface NavbarBlockProps {
  businessName: string;
  logoUrl?: string;
  /**
   * Multiplier on the logo's height, 1 being the 2.5rem default.
   *
   * A per-client control rather than one number in this file, because the right
   * size depends entirely on the file: a wordmark that fills its canvas edge to
   * edge and a mark sitting in a wide margin of transparent pixels need very
   * different heights to read as the same size on the page, and the operator is
   * the one looking at both.
   */
  logoScale?: number;
  navItems?: NavItem[];
  phone?: string;
  ctaText?: string;
  /** Where the CTA goes. External URLs open in a new tab. */
  ctaHref?: string;
  theme?: 'dark' | 'light' | 'luxury' | 'campaign-navy' | 'campaign-judicial' | 'crimson-bold' | 'emerald-gold' | 'custom';
  accentColor?: string;
}

export function NavbarBlock({
  businessName,
  logoUrl,
  logoScale,
  navItems = [
    { label: 'Services', href: '#services' },
    { label: 'Reviews', href: '#reviews' },
    { label: 'About', href: '#about' },
    { label: 'Contact', href: '#contact' },
  ],
  phone,
  ctaText = 'Book Appointment',
  ctaHref = '#contact',
  theme = 'dark',
  accentColor
}: NavbarBlockProps) {
  // An external booking system opens in a new tab; an in-page anchor does not.
  const isExternalCta = /^https?:\/\//i.test(ctaHref);
  const ctaLinkProps = isExternalCta
    ? { target: '_blank' as const, rel: 'noopener noreferrer' }
    : {};
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isCampaign = (theme === 'campaign-navy' || theme === 'campaign-judicial') || accentColor === '#C5A059' || businessName.toLowerCase().includes('judge') || businessName.toLowerCase().includes('sheriff') || businessName.toLowerCase().includes('campaign') || businessName.toLowerCase().includes('waylon');
  const isJudicial = theme === 'campaign-judicial' || businessName.toLowerCase().includes('judge') || businessName.toLowerCase().includes('justice') || businessName.toLowerCase().includes('waylon');
  const isSheriff = !isJudicial && (businessName.toLowerCase().includes('sheriff') || businessName.toLowerCase().includes('police'));

  // Split candidate name if formatted like "Ernest Trevino for Atascosa County Sheriff"
  let primaryName = businessName;
  let subBadgeText = '';

  if (isCampaign) {
    if (businessName.toLowerCase().includes(' for ')) {
      const parts = businessName.split(/ for /i);
      primaryName = parts[0].trim();
      const firstName = primaryName.split(' ')[0] || primaryName;
      subBadgeText = `VOTE ${firstName.toUpperCase()} · ${parts[1].trim().toUpperCase()}`;
    } else {
      subBadgeText = isJudicial ? 'OFFICIAL 2026 JUDICIAL CAMPAIGN' : 'OFFICIAL 2026 CAMPAIGN';
    }
  }

  return (
    <header className={`sticky top-0 z-40 w-full backdrop-blur-md border-b transition-colors duration-200 bg-[color:var(--ts-surface)]/95 border-[color:var(--ts-border)] text-[color:var(--ts-text)]`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-3 lg:gap-4">

        {/* Brand Logo & Name */}
        {/* min-w-0 and shrink, not flex-shrink-0.
            This was fixed-width with a nowrap name, so a long business name —
            "Opalescent Color Studio" — could neither shrink nor wrap and simply
            pushed the booking button off the right edge. The brand is the only
            element in this bar whose width depends on client data, which makes
            it the one that has to yield. */}
        <a href="#" className="flex items-center space-x-3 group min-w-0 shrink">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={businessName}
              // Capped at the header's own height less its padding. A logo that
              // outgrows the bar does not make the bar taller, it spills out of
              // it and sits over the page behind.
              style={{ height: `${Math.min(4, Math.max(1.25, 2.5 * (logoScale || 1)))}rem` }}
              className="w-auto object-contain flex-shrink-0"
            />
          ) : (
            <div
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-bold text-base sm:text-lg shadow-lg group-hover:scale-105 transition-transform flex-shrink-0 bg-[color:var(--ts-accent)] text-[color:var(--ts-accent-contrast)] ${isCampaign ? 'font-serif' : ''}`}
            >
              {isCampaign ? (
                isJudicial ? (
                  <ScalesOfJusticeIcon size={22} color="currentColor" />
                ) : isSheriff ? (
                  <Shield className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" strokeWidth={1.5} />
                ) : (
                  <Star className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
                )
              ) : (
                businessName.charAt(0)
              )}
            </div>
          )}
          <div className="flex flex-col min-w-0">
            <span className={`font-bold text-base sm:text-lg tracking-tight group-hover:opacity-90 transition-opacity truncate text-[color:var(--ts-text)] ${
              isCampaign ? 'font-serif' : ''
            }`}>
              {primaryName}
            </span>
            {isCampaign && subBadgeText && (
              <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest text-[color:var(--ts-accent)] group-hover:opacity-90 truncate">
                <span className="hidden sm:inline">{subBadgeText}</span>
                <span className="sm:hidden">{subBadgeText.includes('·') ? subBadgeText.split('·')[1].trim() : subBadgeText}</span>
              </span>
            )}
          </div>
        </a>

        {/* Desktop Navigation Links — Stitch Synchronized Pill Track */}
        <nav className="hidden 2xl:flex items-center gap-1 xl:gap-1.5 p-1 rounded-2xl bg-[color:var(--ts-surface-raised)]/70 border border-[color:var(--ts-border)]/80 backdrop-blur-md shadow-sm flex-shrink min-w-0">
          {navItems.map((item, idx) => {
            const isWriteInPill = item.label.toLowerCase().includes('write-in') || item.label.toLowerCase().includes('how to vote');
            
            if (isWriteInPill) {
              return (
                <a
                  key={idx}
                  href={item.href}
                  className="whitespace-nowrap inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs xl:text-sm font-black bg-gradient-to-r from-[#bb0027] to-[#990020] hover:from-[#d1002e] hover:to-[#bb0027] text-white shadow-md shadow-red-950/30 border border-[#C5A059]/40 hover:scale-[1.03] active:scale-[0.98] transition-all flex-shrink-0"
                >
                  <Vote className="w-3.5 h-3.5 text-[#ffdad8]" />
                  <span>{item.label}</span>
                </a>
              );
            }

            return (
              <a
                key={idx}
                href={item.href}
                className="whitespace-nowrap inline-flex items-center px-3 xl:px-3.5 py-1.5 rounded-xl text-xs xl:text-sm font-bold text-[color:var(--ts-muted)] hover:text-[color:var(--ts-text)] hover:bg-[color:var(--ts-surface)]/90 hover:shadow-xs transition-all flex-shrink-0"
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* Right CTA Button — Guaranteed Flex-Shrink-0 & No Cut Off */}
        <div className="hidden sm:flex items-center flex-shrink-0 whitespace-nowrap z-10">
          <a
            href={ctaHref}
            {...ctaLinkProps}
            className="inline-flex items-center justify-center whitespace-nowrap px-4 xl:px-5 py-2.5 rounded-xl text-xs xl:text-sm font-extrabold uppercase tracking-wider shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] bg-[color:var(--ts-accent)] text-[color:var(--ts-accent-contrast)] hover:opacity-95 flex-shrink-0"
          >
            <span>{ctaText}</span>
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </a>
        </div>

        {/* Mobile / Tablet / Studio Split-Screen Hamburger Toggle */}
        <div className="flex 2xl:hidden items-center space-x-2 flex-shrink-0">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-[color:var(--ts-muted)] hover:text-[color:var(--ts-text)] hover:bg-[color:var(--ts-surface-raised)]"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile / Drawer Menu */}
      {mobileMenuOpen && (
        <div className="2xl:hidden border-b px-4 pt-3 pb-6 space-y-2 animate-in slide-in-from-top-2 duration-200 bg-[color:var(--ts-surface)] border-[color:var(--ts-border)]">
          {navItems.map((item, idx) => {
            const isWriteInPill = item.label.toLowerCase().includes('write-in') || item.label.toLowerCase().includes('how to vote');
            return (
              <a
                key={idx}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  isWriteInPill
                    ? 'bg-gradient-to-r from-[#bb0027] to-[#990020] text-white border border-[#C5A059]/40 flex items-center justify-between'
                    : 'text-[color:var(--ts-text)] hover:bg-[color:var(--ts-surface-raised)] hover:text-[color:var(--ts-accent)]'
                }`}
              >
                <span>{item.label}</span>
                {isWriteInPill && <Vote className="w-4 h-4 text-[#ffdad8]" />}
              </a>
            );
          })}
          <div className="pt-2">
            <a
              href={ctaHref}
              {...ctaLinkProps}
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center px-4 py-3 rounded-xl text-sm font-extrabold uppercase tracking-wider shadow-md bg-[color:var(--ts-accent)] text-[color:var(--ts-accent-contrast)] hover:opacity-95"
            >
              <span>{ctaText}</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
