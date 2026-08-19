import React, { useState } from 'react';
import { Calendar, Clock, Send, CheckCircle, ShieldCheck, Vote, Award, MapPin } from 'lucide-react';
import { ServiceItem } from './types';

interface BookingBlockProps {
  title?: string;
  subtitle?: string;
  services?: ServiceItem[];
  phone?: string;
  theme?: 'dark' | 'light' | 'luxury' | 'campaign-navy' | 'crimson-bold' | 'emerald-gold' | 'custom';
  accentColor?: string;
  onSubmit?: (data: any) => void;
}

export function BookingBlock({
  title,
  subtitle,
  services = [],
  phone,
  theme = 'dark',
  accentColor,
  onSubmit
}: BookingBlockProps) {
  const [submitted, setSubmitted] = useState(false);
  const isDark = theme !== 'light';
  
  const isCampaign = theme === 'campaign-navy' || 
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

  const customAccentBg = accentColor 
    ? { backgroundColor: accentColor, color: (accentColor === '#C5A059' || accentColor === '#fbbf24') ? '#0c0a09' : '#ffffff' } 
    : isCampaign
      ? { backgroundColor: '#C5A059', color: '#00081e' }
      : undefined;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) onSubmit(formData);
    setSubmitted(true);
  };

  const campaignOptions = [
    'Request a Yard Sign',
    'Volunteer for Block Walking & Canvassing',
    'Host a Neighborhood Meet & Greet',
    'Join Phone Banking & Voter Outreach',
    'Make a Campaign Contribution',
    'Official Endorsement / Coalition Member'
  ];

  return (
    <section id="contact" className={`py-16 sm:py-24 relative ${
      theme === 'campaign-navy' ? 'bg-[#00081e] text-white' : isDark ? 'bg-stone-900/50 text-white' : 'bg-stone-100 text-stone-900'
    }`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center mb-10 sm:mb-14">
          {isCampaign && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/30 mb-3.5">
              <Vote className="w-3.5 h-3.5" />
              <span>Grassroots Action Center</span>
            </div>
          )}
          <h2 className={`text-2xl sm:text-4xl font-extrabold tracking-tight mb-3 sm:mb-4 ${isCampaign ? 'font-serif' : ''}`}>
            {title || defaultTitle}
          </h2>
          <p className={`text-sm sm:text-base max-w-2xl mx-auto leading-relaxed ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
            {subtitle || defaultSubtitle}
          </p>
        </div>

        {/* Form Container */}
        <div className={`rounded-2xl sm:rounded-3xl p-6 sm:p-10 border shadow-2xl ${
          isCampaign 
            ? 'bg-[#020d29] border-[#C5A059]/30 shadow-[#C5A059]/5' 
            : isDark 
              ? 'bg-stone-950 border-stone-800' 
              : 'bg-white border-stone-200'
        }`}>
          {submitted ? (
            <div className="text-center py-12 space-y-4 animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-white">Thank You for Standing With Us!</h3>
              <p className="text-stone-400 max-w-md mx-auto text-sm">
                {isCampaign 
                  ? 'Your volunteer/yard sign request has been recorded. Our field team will be in touch shortly.' 
                  : 'Your request has been received. One of our specialists will reach out via phone or email shortly.'}
              </p>
              {phone && (
                <p className="text-xs text-stone-500 pt-4">
                  Questions? Contact campaign headquarters at <span className="text-[#C5A059] font-semibold">{phone}</span>.
                </p>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
              
              {/* Row 1: Name & Phone (Auto-fit min 240px for mobile frame safety) */}
              <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4 sm:gap-6">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Jane Doe"
                    className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all ${
                      isDark ? 'bg-stone-900/80 border-stone-800 text-white placeholder-stone-600' : 'bg-stone-50 border-stone-300 text-stone-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(555) 000-0000"
                    className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all ${
                      isDark ? 'bg-stone-900/80 border-stone-800 text-white placeholder-stone-600' : 'bg-stone-50 border-stone-300 text-stone-900'
                    }`}
                  />
                </div>
              </div>

              {/* Row 2: Email & Participation Dropdown */}
              <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4 sm:gap-6">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="jane@example.com"
                    className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all ${
                      isDark ? 'bg-stone-900/80 border-stone-800 text-white placeholder-stone-600' : 'bg-stone-50 border-stone-300 text-stone-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">
                    {isCampaign ? 'How Would You Like to Participate? *' : 'Select Service *'}
                  </label>
                  <select
                    value={formData.service}
                    onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all ${
                      isDark ? 'bg-stone-900/80 border-stone-800 text-white' : 'bg-stone-50 border-stone-300 text-stone-900'
                    }`}
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
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">
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
                  className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all ${
                    isDark ? 'bg-stone-900/80 border-stone-800 text-white placeholder-stone-600' : 'bg-stone-50 border-stone-300 text-stone-900'
                  }`}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                style={customAccentBg}
                className={`w-full py-4 rounded-xl font-bold text-sm sm:text-base shadow-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] ${
                  !customAccentBg ? 'bg-orange-600 hover:bg-orange-500 text-white shadow-orange-600/30' : 'hover:opacity-95'
                }`}
              >
                <Send className="w-4 h-4" />
                <span>{isCampaign ? 'Join Grassroots Campaign Team' : 'Submit Request'}</span>
              </button>

              {/* Compliance & Trust Badge */}
              <div className="flex items-center justify-center gap-2 text-xs text-stone-500 pt-1 text-center">
                {isCampaign ? (
                  <>
                    <Vote className="w-3.5 h-3.5 text-[#C5A059] flex-shrink-0" />
                    <span>Official Volunteer & Yard Sign Roster · Texas Election Code Compliant</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>Zero spam guarantee. Your details are safe with us.</span>
                  </>
                )}
              </div>
            </form>
          )}
        </div>

      </div>
    </section>
  );
}

