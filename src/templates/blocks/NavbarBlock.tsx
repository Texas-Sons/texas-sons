import React, { useState } from 'react';
import { Menu, X, Phone, ArrowRight, Shield } from 'lucide-react';
import { NavItem } from './types';

interface NavbarBlockProps {
  businessName: string;
  logoUrl?: string;
  navItems?: NavItem[];
  phone?: string;
  ctaText?: string;
  ctaHref?: string;
  theme?: 'dark' | 'light' | 'luxury' | 'campaign-navy' | 'crimson-bold' | 'emerald-gold' | 'custom';
  accentColor?: string;
}

export function NavbarBlock({
  businessName,
  logoUrl,
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isCampaign = theme === 'campaign-navy' || accentColor === '#C5A059' || businessName.toLowerCase().includes('judge') || businessName.toLowerCase().includes('sheriff') || businessName.toLowerCase().includes('campaign');

  return (
    <header className={`sticky top-0 z-40 w-full backdrop-blur-md border-b transition-colors duration-200 bg-[color:var(--ts-surface)] border-[color:var(--ts-border)] text-[color:var(--ts-text)]`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">

        {/* Brand Logo & Name */}
        <a href="#" className="flex items-center space-x-3 group min-w-0">
          {logoUrl ? (
            <img src={logoUrl} alt={businessName} className="h-10 w-auto rounded-lg object-cover flex-shrink-0" />
          ) : (
            <div
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-bold text-base sm:text-lg shadow-lg group-hover:scale-105 transition-transform flex-shrink-0 bg-[color:var(--ts-accent)] text-[color:var(--ts-accent-contrast)] ${isCampaign ? 'font-serif' : ''}`}
            >
              {isCampaign ? (
                <Shield className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" strokeWidth={1.5} />
              ) : (
                businessName.charAt(0)
              )}
            </div>
          )}
          <div className="flex flex-col min-w-0">
            <span className={`font-bold text-base sm:text-lg tracking-tight group-hover:opacity-90 transition-opacity truncate ${
              isCampaign ? 'font-serif text-[color:var(--ts-accent)]' : ''
            }`}>
              {businessName}
            </span>
          </div>
        </a>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center space-x-6 xl:space-x-8">
          {navItems.map((item, idx) => (
            <a
              key={idx}
              href={item.href}
              className={`text-sm font-medium transition-colors text-[color:var(--ts-muted)] hover:text-[color:var(--ts-accent)]`}
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Desktop CTA Buttons */}
        <div className="hidden lg:flex items-center space-x-4">
          {phone && (
            <a
              href={`tel:${phone}`}
              className="flex items-center text-sm font-medium whitespace-nowrap transition-colors text-[color:var(--ts-muted)] hover:text-[color:var(--ts-text)]"
            >
              <Phone className="w-4 h-4 mr-2 text-[color:var(--ts-accent)]" />
              {phone}
            </a>
          )}
          <a
            href={ctaHref}
            className={`inline-flex items-center justify-center whitespace-nowrap px-4 xl:px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] bg-[color:var(--ts-accent)] text-[color:var(--ts-accent-contrast)] hover:opacity-95`}
          >
            {ctaText}
            <ArrowRight className="w-4 h-4 ml-2" />
          </a>
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="flex lg:hidden items-center space-x-2 sm:space-x-3 flex-shrink-0">
          {phone && (
            <a
              href={`tel:${phone}`}
              className="p-2 rounded-lg text-[color:var(--ts-accent)] hover:bg-[color:var(--ts-surface-raised)]"
              aria-label={`Call ${businessName} at ${phone}`}
            >
              <Phone className="w-5 h-5" />
            </a>
          )}
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

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b px-4 pt-3 pb-6 space-y-3 animate-in slide-in-from-top-2 duration-200 bg-[color:var(--ts-surface)] border-[color:var(--ts-border)]">
          {navItems.map((item, idx) => (
            <a
              key={idx}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-[color:var(--ts-text)] hover:bg-[color:var(--ts-surface-raised)] hover:text-[color:var(--ts-accent)]"
            >
              {item.label}
            </a>
          ))}
          <div className="pt-2">
            <a
              href={ctaHref}
              onClick={() => setMobileMenuOpen(false)}
              className={`w-full flex items-center justify-center px-4 py-3 rounded-xl text-sm font-semibold shadow-md bg-[color:var(--ts-accent)] text-[color:var(--ts-accent-contrast)] hover:opacity-95`}
            >
              {ctaText}
              <ArrowRight className="w-4 h-4 ml-2" />
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
