import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useReveal, revealBlock } from './motion';
import { Send, CheckCircle, ShieldCheck, Vote, MapPin, Mail, Phone, AlertCircle } from 'lucide-react';
import { ServiceItem } from './types';

interface BookingBlockProps {
  title?: string;
  subtitle?: string;
  services?: ServiceItem[];
  phone?: string;
  email?: string;
  address?: string;
  hours?: string | string[];
  theme?: 'dark' | 'light' | 'luxury' | 'campaign-navy' | 'campaign-judicial' | 'crimson-bold' | 'emerald-gold' | 'custom';
  accentColor?: string;
  onSubmit?: (data: any) => void | Promise<void>;
  /**
   * External booking system. When present it becomes the primary action and the
   * form drops to a secondary "or send a message" path — a business that already
   * takes bookings somewhere has real availability and deposits there, so routing
   * visitors through a lead form instead adds a step and loses the sale.
   */
  bookingUrl?: string;
  bookingLabel?: string;
}

export function BookingBlock({
  title,
  subtitle,
  services = [],
  phone,
  email,
  address,
  hours,
  theme = 'dark',
  accentColor,
  onSubmit,
  bookingUrl,
  bookingLabel = 'Book Online Now'
}: BookingBlockProps) {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isCampaign = (theme === 'campaign-navy' || theme === 'campaign-judicial') ||
    accentColor === '#C5A059' ||
    (title && (title.toLowerCase().includes('volunteer') || title.toLowerCase().includes('yard') || title.toLowerCase().includes('campaign')));

  const defaultTitle = isCampaign
    ? 'Join the Campaign & Request Yard Signs'
    : 'Request a Free Estimate & Consultation';

  const defaultSubtitle = isCampaign
    ? 'Stand with our grassroots movement. Request a free yard sign, volunteer for block walking, or host a neighborhood meet & greet.'
    : 'Fill out the form below and our team will get back to you within 2 business hours.';

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    service: isCampaign ? 'Request a Yard Sign' : (services[0]?.title || 'General Inquiry'),
    notes: '',
    address: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      if (onSubmit) await onSubmit(formData);
      setSubmitted(true);
    } catch (err: any) {
      setSubmitError('Something went wrong while submitting. Please try again or call us directly.');
    } finally {
      setSubmitting(false);
    }
  };

  const campaignOptions = [
    'Request a Yard Sign',
    'Volunteer for Block Walking & Canvassing',
    'Host a Neighborhood Meet & Greet',
    'Join Phone Banking & Voter Outreach',
    'Make a Campaign Contribution',
    'Official Endorsement / Coalition Member'
  ];

  const inputClass = "w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--ts-accent)] transition-all bg-[color:var(--ts-bg)] border-[color:var(--ts-border)] text-[color:var(--ts-text)] placeholder:text-[color:var(--ts-muted)]";

  const reveal = useReveal();

  return (
    <section id="contact" className={`py-16 sm:py-24 relative bg-[color:var(--ts-bg)] text-[color:var(--ts-text)]`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <motion.div
          className="text-center mb-10 sm:mb-14"
          variants={reveal.props.initial ? revealBlock : undefined}
          {...reveal.props}
        >
          {isCampaign && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[color:var(--ts-accent-soft)] text-[color:var(--ts-accent)] border border-[color:var(--ts-accent-border)] mb-3.5">
              <Vote className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Grassroots Action Center</span>
            </div>
          )}
          <h2 className={`text-2xl sm:text-4xl font-extrabold tracking-tight mb-3 sm:mb-4 ${isCampaign ? 'font-serif' : ''}`}>
            {title || defaultTitle}
          </h2>
          <p className={`text-sm sm:text-base max-w-2xl mx-auto leading-relaxed text-[color:var(--ts-muted)]`}>
            {subtitle || defaultSubtitle}
          </p>
        </motion.div>

        {/* Contact Info Strip */}
        {(phone || email || address) && (
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 mb-8 text-xs sm:text-sm text-[color:var(--ts-muted)]">
            {phone && (
              <a href={`tel:${phone}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <Phone className="w-4 h-4 text-[color:var(--ts-accent)] flex-shrink-0" aria-hidden="true" />
                <span>{phone}</span>
              </a>
            )}
            {email && (
              <a href={`mailto:${email}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <Mail className="w-4 h-4 text-[color:var(--ts-accent)] flex-shrink-0" aria-hidden="true" />
                <span>{email}</span>
              </a>
            )}
            {address && (
              <span className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[color:var(--ts-accent)] flex-shrink-0" aria-hidden="true" />
                <span>{address}</span>
              </span>
            )}
          </div>
        )}

        {/* Form Container */}
        <div className="rounded-2xl sm:rounded-3xl p-6 sm:p-10 border shadow-2xl bg-[color:var(--ts-surface)] border-[color:var(--ts-border)]">
          {submitted ? (
            <div className="text-center py-12 space-y-4 animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                <CheckCircle className="w-8 h-8" aria-hidden="true" />
              </div>
              <h3 className="text-2xl font-bold text-[color:var(--ts-text)]">Thank You for Standing With Us!</h3>
              <p className="text-[color:var(--ts-muted)] max-w-md mx-auto text-sm">
                {isCampaign
                  ? 'Your volunteer/yard sign request has been recorded. Our field team will be in touch shortly.'
                  : 'Your request has been received. One of our specialists will reach out via phone or email shortly.'}
              </p>
              {phone && (
                <p className="text-xs text-[color:var(--ts-muted)] pt-4">
                  Questions? Contact us at <span className="text-[color:var(--ts-accent)] font-semibold">{phone}</span>.
                </p>
              )}
            </div>
          ) : (
            <>
            {bookingUrl && (
              <div className="mb-8">
                {/* The floating button hands over to this one when it
                    scrolls into view, rather than hovering on top of it.
                    See BookingFab. */}
                <a
                  href={bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-ts-book-dock=""
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl text-base font-extrabold uppercase tracking-wider shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99] bg-[color:var(--ts-accent)] text-[color:var(--ts-accent-contrast)]"
                >
                  {bookingLabel}
                </a>
                <p className="text-center text-xs text-[color:var(--ts-muted)] mt-3">
                  See live availability and reserve your spot instantly.
                </p>
                <div className="flex items-center gap-3 mt-7">
                  <div className="flex-1 h-px bg-[color:var(--ts-border)]" />
                  <span className="text-[10px] uppercase tracking-widest text-[color:var(--ts-muted)]">
                    or send a message
                  </span>
                  <div className="flex-1 h-px bg-[color:var(--ts-border)]" />
                </div>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">

              {/* Row 1: Name & Phone */}
              <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4 sm:gap-6">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[color:var(--ts-muted)] mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Jane Doe"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[color:var(--ts-muted)] mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(555) 000-0000"
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Row 2: Email & Participation Dropdown */}
              <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4 sm:gap-6">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[color:var(--ts-muted)] mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="jane@example.com"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[color:var(--ts-muted)] mb-2">
                    {isCampaign ? 'How Would You Like to Participate? *' : 'Select Service *'}
                  </label>
                  <select
                    value={formData.service}
                    onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                    className={inputClass}
                  >
                    {isCampaign ? (
                      campaignOptions.map((opt, idx) => (
                        <option key={idx} value={opt}>{opt}</option>
                      ))
                    ) : services.length > 0 ? (
                      services.map((s, idx) => (
                        <option key={idx} value={s.title}>{s.title}</option>
                      ))
                    ) : (
                      <>
                        <option value="Consultation">Free Consultation</option>
                        <option value="Full Service">Full Service Package</option>
                        <option value="Custom Project">Custom Project</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* Row 3: Address / Notes */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[color:var(--ts-muted)] mb-2">
                  {isCampaign ? 'Physical Delivery Address (for Yard Signs) or Comments' : 'Project Notes & Preferred Timeline'}
                </label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder={
                    isCampaign
                      ? 'Enter your street address, city, & zip code for yard sign placement, or notes on your volunteer availability...'
                      : 'Tell us a little bit about what you need done...'
                  }
                  className={inputClass}
                />
              </div>

              {submitError && (
                <div className="flex items-start gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className={`w-full py-4 rounded-xl font-bold text-sm sm:text-base shadow-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 bg-[color:var(--ts-accent)] text-[color:var(--ts-accent-contrast)] hover:opacity-95`}
              >
                <Send className="w-4 h-4" aria-hidden="true" />
                <span>{submitting ? 'Submitting...' : (isCampaign ? 'Join Grassroots Campaign Team' : 'Submit Request')}</span>
              </button>

              {/* Compliance & Trust Badge */}
              <div className="flex items-center justify-center gap-2 text-xs text-[color:var(--ts-muted)] pt-1 text-center">
                {isCampaign ? (
                  <>
                    <Vote className="w-3.5 h-3.5 text-[color:var(--ts-accent)] flex-shrink-0" aria-hidden="true" />
                    <span>Official Volunteer & Yard Sign Roster · Texas Election Code Compliant</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" aria-hidden="true" />
                    <span>Zero spam guarantee. Your details are safe with us.</span>
                  </>
                )}
              </div>
            </form>
            </>
          )}
        </div>

      </div>
    </section>
  );
}
