import React, { useState } from 'react';
import { 
  Building2, 
  Calendar, 
  Users, 
  DollarSign, 
  Plus, 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  CheckCircle, 
  Trash2, 
  Edit3, 
  RefreshCw, 
  Sparkles, 
  Shield, 
  Vote, 
  Scissors, 
  Utensils, 
  Wrench,
  Check
} from 'lucide-react';
import { BusinessProfile, ServiceItem, TestimonialItem, EventItem, VolunteerItem } from './types';

interface IndustryAdminBlockProps {
  business: BusinessProfile;
  services: ServiceItem[];
  testimonials: TestimonialItem[];
  events?: EventItem[];
  volunteers?: VolunteerItem[];
}

export function IndustryAdminBlock({
  business,
  services,
  testimonials,
  events = [
    { id: '1', name: 'Downtown Campaign Rally & Meet-and-Greet', date: 'Oct 24, 2026', time: '6:30 PM', location: 'City Center Plaza, Austin', rsvpCount: 142 },
    { id: '2', name: 'Town Hall: Public Safety & County Budget', date: 'Nov 02, 2026', time: '7:00 PM', location: 'County Courthouse Annex', rsvpCount: 88 }
  ],
  volunteers = [
    { id: '1', name: 'Marcus Sterling', email: 'marcus@example.com', phone: '(512) 555-9182', type: 'Volunteer', status: 'Active' },
    { id: '2', name: 'Sarah Briggs', email: 'sarah.b@example.com', phone: '(512) 555-3341', type: 'Yard Sign', status: 'Active' },
    { id: '3', name: 'David Garza', email: 'garza.d@example.com', phone: '(512) 555-8819', type: 'Donor', status: 'Active' },
    { id: '4', name: 'Elena Vance', email: 'elena@example.com', phone: '(512) 555-0012', type: 'RSVP', status: 'Attending' }
  ]
}: IndustryAdminBlockProps) {
  const isCampaign = business.name.toLowerCase().includes('campaign') || 
                     business.name.toLowerCase().includes('sheriff') || 
                     business.name.toLowerCase().includes('judge') ||
                     business.category === 'Campaign & Leadership';
  
  const isSalon = business.category === 'Beauty & Wellness' || business.name.toLowerCase().includes('salon') || business.name.toLowerCase().includes('spa');
  const isRestaurant = business.category === 'Food & Beverage' || business.name.toLowerCase().includes('restaurant') || business.name.toLowerCase().includes('bar');

  const [activeTab, setActiveTab] = useState<'info' | 'events' | 'people' | 'pricing' | 'bookings'>('info');
  const [localServices, setLocalServices] = useState<ServiceItem[]>(services);
  const [localEvents, setLocalEvents] = useState<EventItem[]>(events);
  const [localVolunteers, setLocalVolunteers] = useState<VolunteerItem[]>(volunteers);
  const [isSyncingSquare, setIsSyncingSquare] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSyncSquare = () => {
    setIsSyncingSquare(true);
    setTimeout(() => {
      setIsSyncingSquare(false);
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 3000);
    }, 1200);
  };

  const handleSave = () => {
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  return (
    <div className="w-full bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-2xl text-stone-200">
      
      {/* Top Admin Header Bar */}
      <div className="px-6 py-4 bg-stone-950 border-b border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-orange-600/20 border border-orange-500/30 flex items-center justify-center text-orange-500 font-bold">
            {isCampaign ? <Vote className="w-5 h-5" /> : isSalon ? <Scissors className="w-5 h-5" /> : isRestaurant ? <Utensils className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-white">{business.name}</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {isCampaign ? 'Campaign Portal' : isSalon ? 'Salon Management' : isRestaurant ? 'Restaurant Console' : 'Business Portal'}
              </span>
            </div>
            <p className="text-xs text-stone-400">Client Admin Control Center · Live Site Sync</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center space-x-3">
          {(isSalon || isRestaurant) && (
            <button
              onClick={handleSyncSquare}
              disabled={isSyncingSquare}
              className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSquare ? 'animate-spin text-orange-400' : 'text-stone-400'}`} />
              <span>{isSyncingSquare ? 'Syncing Catalog...' : 'Sync with Square POS'}</span>
            </button>
          )}

          <button
            onClick={handleSave}
            className="px-4 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-orange-600/30 transition-all hover:scale-105"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Save Updates</span>
          </button>
        </div>
      </div>

      {savedNotice && (
        <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-6 py-2 text-xs font-semibold text-emerald-400 flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4" />
          <span>Updates saved successfully! Live website reflects all changes.</span>
        </div>
      )}

      {/* Admin Tab Navigation */}
      <div className="border-b border-stone-800 bg-stone-950/50 px-6 flex items-center space-x-1 sm:space-x-4 text-xs font-medium overflow-x-auto">
        <button
          onClick={() => setActiveTab('info')}
          className={`py-3 px-3 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'info' ? 'border-orange-500 text-orange-400 font-bold' : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          Basic Info & Settings
        </button>

        {isCampaign && (
          <>
            <button
              onClick={() => setActiveTab('events')}
              className={`py-3 px-3 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'events' ? 'border-orange-500 text-orange-400 font-bold' : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              Campaign Events ({localEvents.length})
            </button>
            <button
              onClick={() => setActiveTab('people')}
              className={`py-3 px-3 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'people' ? 'border-orange-500 text-orange-400 font-bold' : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              Volunteers & Yard Signs ({localVolunteers.length})
            </button>
          </>
        )}

        {!isCampaign && (
          <>
            <button
              onClick={() => setActiveTab('pricing')}
              className={`py-3 px-3 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'pricing' ? 'border-orange-500 text-orange-400 font-bold' : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              {isRestaurant ? 'Menu & Pricing' : 'Services & Rates'}
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`py-3 px-3 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'bookings' ? 'border-orange-500 text-orange-400 font-bold' : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              {isRestaurant ? 'Reservations' : 'Booking Queue'}
            </button>
          </>
        )}
      </div>

      {/* Main Tab Content */}
      <div className="p-6">
        
        {/* TAB: Basic Info */}
        {activeTab === 'info' && (
          <div className="space-y-6 max-w-3xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1.5">
                  Official Title / Business Name
                </label>
                <input
                  type="text"
                  defaultValue={business.name}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-white text-xs focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1.5">
                  Headline / Slogan
                </label>
                <input
                  type="text"
                  defaultValue={business.tagline}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-white text-xs focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1.5">
                  Direct Phone
                </label>
                <input
                  type="text"
                  defaultValue={business.phone}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-white text-xs focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1.5">
                  Public Email
                </label>
                <input
                  type="email"
                  defaultValue={business.email}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-white text-xs focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1.5">
                  Location / HQ
                </label>
                <input
                  type="text"
                  defaultValue={business.address}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-white text-xs focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1.5">
                About / Bio Statement
              </label>
              <textarea
                rows={3}
                defaultValue={business.description}
                className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-white text-xs focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>
        )}

        {/* TAB: Campaign Events */}
        {activeTab === 'events' && (
          <div className="space-y-4 max-w-4xl">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white">Upcoming Campaign Appearances & Rallies</h4>
              <button 
                onClick={() => {
                  const name = prompt("Enter Event Title:");
                  if (name) {
                    setLocalEvents([...localEvents, { id: `${Date.now()}`, name, date: 'Nov 12, 2026', time: '6:00 PM', location: 'Austin, TX', rsvpCount: 0 }]);
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-orange-600/20 text-orange-400 border border-orange-500/30 text-xs font-bold flex items-center gap-1.5 hover:bg-orange-600/30"
              >
                <Plus className="w-3.5 h-3.5" /> Add Event
              </button>
            </div>

            <div className="border border-stone-800 rounded-xl overflow-hidden bg-stone-950">
              <table className="w-full text-left text-xs divide-y divide-stone-800">
                <thead className="bg-stone-900/60 text-stone-400 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Date & Time</th>
                    <th className="px-4 py-3">Event Name</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3 text-center">RSVP Count</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60">
                  {localEvents.map((evt) => (
                    <tr key={evt.id} className="hover:bg-stone-900/40 transition-colors">
                      <td className="px-4 py-3 font-semibold text-orange-400 whitespace-nowrap">{evt.date} · {evt.time}</td>
                      <td className="px-4 py-3 font-bold text-white">{evt.name}</td>
                      <td className="px-4 py-3 text-stone-400">{evt.location}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                          {evt.rsvpCount} RSVPs
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button 
                          onClick={() => setLocalEvents(localEvents.filter(e => e.id !== evt.id))}
                          className="text-stone-500 hover:text-red-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: Volunteers & Yard Signs */}
        {activeTab === 'people' && (
          <div className="space-y-4 max-w-4xl">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white">Grassroots Supporters & Volunteer Roster</h4>
              <span className="text-xs text-stone-400 font-mono">Total Roster: {localVolunteers.length}</span>
            </div>

            <div className="border border-stone-800 rounded-xl overflow-hidden bg-stone-950">
              <table className="w-full text-left text-xs divide-y divide-stone-800">
                <thead className="bg-stone-900/60 text-stone-400 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Supporter Name</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Request Type</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60">
                  {localVolunteers.map((vol) => (
                    <tr key={vol.id} className="hover:bg-stone-900/40 transition-colors">
                      <td className="px-4 py-3 font-bold text-white">{vol.name}</td>
                      <td className="px-4 py-3 text-stone-400">{vol.email} · {vol.phone}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          vol.type === 'Yard Sign' 
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : vol.type === 'Volunteer'
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                          {vol.type}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-emerald-400 text-xs font-semibold flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> {vol.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: Services / Menu & Pricing */}
        {activeTab === 'pricing' && (
          <div className="space-y-4 max-w-4xl">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white">Live Catalog & Pricing Table</h4>
              <button 
                onClick={() => {
                  const title = prompt("Enter Service/Menu Name:");
                  const price = prompt("Enter Price (e.g. '$150' or 'From $45'):");
                  if (title) {
                    setLocalServices([...localServices, { title, description: 'Premium custom package.', price: price || 'From $50' }]);
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-orange-600/20 text-orange-400 border border-orange-500/30 text-xs font-bold flex items-center gap-1.5 hover:bg-orange-600/30"
              >
                <Plus className="w-3.5 h-3.5" /> Add Service / Item
              </button>
            </div>

            <div className="border border-stone-800 rounded-xl overflow-hidden bg-stone-950">
              <table className="w-full text-left text-xs divide-y divide-stone-800">
                <thead className="bg-stone-900/60 text-stone-400 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Item / Service Title</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3">Current Price</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60">
                  {localServices.map((svc, idx) => (
                    <tr key={idx} className="hover:bg-stone-900/40 transition-colors">
                      <td className="px-4 py-3 font-bold text-white">{svc.title}</td>
                      <td className="px-4 py-3 text-stone-400 max-w-xs truncate">{svc.description}</td>
                      <td className="px-4 py-3 font-bold text-orange-400">{svc.price || 'Free Estimate'}</td>
                      <td className="px-4 py-3 text-right">
                        <button 
                          onClick={() => setLocalServices(localServices.filter((_, i) => i !== idx))}
                          className="text-stone-500 hover:text-red-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: Bookings */}
        {activeTab === 'bookings' && (
          <div className="space-y-4 max-w-4xl">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white">Client Appointments & Requests</h4>
              <span className="text-xs text-stone-400 font-mono">Queue Status: 3 Pending</span>
            </div>

            <div className="border border-stone-800 rounded-xl overflow-hidden bg-stone-950 p-6 text-center text-stone-500">
              <Clock className="w-8 h-8 text-orange-500/40 mx-auto mb-2" />
              <p className="text-xs font-semibold text-stone-300">Live Client Booking System Active</p>
              <p className="text-[11px] text-stone-500 mt-1">Form submissions from the live site instantly populate here and forward to the client's email.</p>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
