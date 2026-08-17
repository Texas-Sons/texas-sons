import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, MapPin, Globe, Star, Mail, Plus, X, AlertTriangle, Image as ImageIcon, Phone, Clock, Activity } from 'lucide-react';
import { APIProvider, useMapsLibrary } from '@vis.gl/react-google-maps';

const API_KEY = process.env.GOOGLE_MAPS_PLATFORM_KEY || (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY || '';
const MONTHLY_LIMIT = 4500;
const WARNING_THRESHOLD = 4000;

const INDUSTRIES = [
  'Any Industry',
  'Roofing',
  'Landscaping',
  'Plumbing',
  'HVAC',
  'Electricians',
  'Dentists',
  'Restaurants',
  'Bakeries',
  'Hair Salons',
  'Nail Salons',
  'Barbershops',
  'Spas & Wellness',
  'Auto Repair',
  'Home Remodeling',
  'Accounting',
  'Law Firms',
  'Real Estate',
  'Cleaning Services',
  'Gyms & Fitness'
];

function ProspectsFinder({ onConvert }: { onConvert: (business: any) => void }) {
  const placesLib = useMapsLibrary('places');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [industry, setIndustry] = useState('Any Industry');
  const [isSearching, setIsSearching] = useState(false);
  const [prospects, setProspects] = useState<any[]>([]);
  const [selectedProspect, setSelectedProspect] = useState<any>(null);
  const [proposalDraft, setProposalDraft] = useState('');
  const [isDrafting, setIsDrafting] = useState(false);
  const [apiUsage, setApiUsage] = useState({
    searches: 0,
    autocomplete: 0,
    assets: 0,
    ai: 0
  });
  const [showApiDashboard, setShowApiDashboard] = useState(false);
  const [dismissedPlaceIds, setDismissedPlaceIds] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [gatheringId, setGatheringId] = useState<string | null>(null);

  const incrementUsage = (type: keyof typeof apiUsage) => {
    setApiUsage(prev => {
      const next = { ...prev, [type]: prev[type] + 1 };
      const d = new Date();
      const monthKey = `txsons_api_usage_${d.getFullYear()}_${d.getMonth() + 1}`;
      localStorage.setItem(monthKey, JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    const d = new Date();
    const monthKey = `txsons_api_usage_${d.getFullYear()}_${d.getMonth() + 1}`;
    const storedUsage = localStorage.getItem(monthKey);
    if (storedUsage) {
      try { setApiUsage(JSON.parse(storedUsage)); } catch (e) {}
    } else {
      const oldStored = localStorage.getItem(`txsons_maps_usage_${d.getFullYear()}_${d.getMonth() + 1}`);
      if (oldStored) {
        setApiUsage(prev => ({ ...prev, searches: parseInt(oldStored, 10) }));
      }
    }

    // Load dismissed places
    const storedDismissed = localStorage.getItem('txsons_dismissed_places');
    if (storedDismissed) {
      try { setDismissedPlaceIds(JSON.parse(storedDismissed)); } catch (e) {}
    }

    // Load cached search state
    const cachedCity = localStorage.getItem('txsons_last_search_city');
    const cachedState = localStorage.getItem('txsons_last_search_state');
    const cachedIndustry = localStorage.getItem('txsons_last_search_industry');
    const cachedProspects = localStorage.getItem('txsons_last_search_results');

    if (cachedCity) setCity(cachedCity);
    if (cachedState) setState(cachedState);
    if (cachedIndustry) setIndustry(cachedIndustry);
    if (cachedProspects) {
      try { setProspects(JSON.parse(cachedProspects)); } catch (e) {}
    }
  }, []);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!placesLib || !inputRef.current) return;

    // Set initial value from cache if available
    if (city && state && !inputRef.current.value) {
      inputRef.current.value = `${city}, ${state}`;
    }

    const autocomplete = new placesLib.Autocomplete(inputRef.current, {
      types: ['(cities)'],
      fields: ['address_components', 'name'],
    });

    const listener = autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (place && place.address_components) {
        let selectedCity = '';
        let selectedState = '';
        
        for (const component of place.address_components) {
          if (component.types.includes('locality')) {
            selectedCity = component.long_name;
          }
          if (component.types.includes('administrative_area_level_1')) {
            selectedState = component.short_name;
          }
        }
        if (!selectedCity) selectedCity = place.name || '';
        
        setCity(selectedCity);
        setState(selectedState);
        
        if (inputRef.current) {
          inputRef.current.value = selectedState ? `${selectedCity}, ${selectedState}` : selectedCity;
        }
        
        incrementUsage('autocomplete');
      }
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
      }
    };
    inputRef.current.addEventListener('keydown', handleKeyDown);

    return () => {
      if (listener && typeof listener.remove === 'function') listener.remove();
      if (inputRef.current) inputRef.current.removeEventListener('keydown', handleKeyDown);
    };
  }, [placesLib]);

  const handleDismiss = (placeId: string) => {
    if (!placeId) return;
    const newList = [...dismissedPlaceIds, placeId];
    setDismissedPlaceIds(newList);
    localStorage.setItem('txsons_dismissed_places', JSON.stringify(newList));
  };

  const handleRestore = (placeId: string) => {
    if (!placeId) return;
    const newList = dismissedPlaceIds.filter(id => id !== placeId);
    setDismissedPlaceIds(newList);
    localStorage.setItem('txsons_dismissed_places', JSON.stringify(newList));
  };

  const handleGatherAssets = async (prospect: any) => {
    if (!placesLib) return;
    setGatheringId(prospect.id);
    try {
      const place = new placesLib.Place({ id: prospect.id });
      await place.fetchFields({
        fields: ['photos', 'reviews', 'regularOpeningHours', 'nationalPhoneNumber']
      });

      const photosUrls = place.photos?.map((p: any) => {
        return typeof p.getURI === 'function' ? p.getURI({ maxHeight: 400 }) : '';
      }).filter(Boolean) || [];

      const enrichedProspect = {
        ...prospect,
        phoneNumber: place.nationalPhoneNumber,
        openingHours: place.regularOpeningHours?.weekdayDescriptions,
        reviews: place.reviews?.map((r: any) => ({ text: r.text, rating: r.rating, author: r.authorAttribution?.displayName })),
        photos: photosUrls
      };

      const updatedProspects = prospects.map(p => p.id === prospect.id ? enrichedProspect : p);
      setProspects(updatedProspects);
      localStorage.setItem('txsons_last_search_results', JSON.stringify(updatedProspects));
      
      setSelectedProspect(enrichedProspect);
      incrementUsage('assets');
    } catch (e) {
      console.error(e);
      alert('Failed to gather assets. Check your Google Maps API quota or billing.');
    } finally {
      setGatheringId(null);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!placesLib || !city || !state) return;

      if (apiUsage.searches >= MONTHLY_LIMIT) {
      alert("Monthly prototype quota limit reached. To protect your Google Cloud free tier credits, searches are temporarily paused. Please set up budget alerts in Google Cloud console for permanent limits.");
      return;
    }
    
    setIsSearching(true);
    try {
      const locationTerm = inputRef.current?.value || `${city}, ${state}`;
      const industryTerm = industry && industry !== 'Any Industry' ? industry : 'Businesses';
      const textQuery = `${industryTerm} in ${locationTerm}`;

      const response = await placesLib.Place.searchByText({
        textQuery,
        fields: ['id', 'displayName', 'formattedAddress', 'websiteURI', 'rating', 'userRatingCount', 'businessStatus', 'primaryTypeDisplayName', 'googleMapsURI'],
        maxResultCount: 20,
      });
      
      incrementUsage('searches');

      if (response.places) {
        // Filter for businesses that either have NO website listed
        const leads = response.places.filter(place => !place.websiteURI);
        setProspects(leads);
        
        // Cache the results
        localStorage.setItem('txsons_last_search_city', locationTerm);
        localStorage.setItem('txsons_last_search_state', '');
        localStorage.setItem('txsons_last_search_industry', industry);
        localStorage.setItem('txsons_last_search_results', JSON.stringify(leads));
      } else {
        setProspects([]);
      }
    } catch (error) {
      console.error('Places Search Error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleDraftProposal = async (prospect: any) => {
    setSelectedProspect(prospect);
    setIsDrafting(true);
    setProposalDraft('');
    incrementUsage('ai');
    
    try {
      const response = await fetch('/api/proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: prospect.displayName,
          businessAddress: prospect.formattedAddress,
          typeOfBusiness: prospect.primaryTypeDisplayName || 'Local Business'
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setProposalDraft(data.proposal);
      } else {
        setProposalDraft('Failed to draft proposal. Please check API keys.');
      }
    } catch (error) {
      console.error(error);
      setProposalDraft('An error occurred while drafting the proposal.');
    } finally {
      setIsDrafting(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-6xl mx-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-stone-100">Lead Finder</h1>
            <p className="text-stone-400 mt-1">Search Google Maps for businesses without websites to prospect.</p>
          </div>
          <div className="text-right flex flex-col items-end gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-stone-400">Show Hidden</span>
              <button 
                onClick={() => setShowHidden(!showHidden)}
                className={`w-10 h-6 rounded-full transition-colors relative ${showHidden ? 'bg-orange-500' : 'bg-stone-800'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${showHidden ? 'left-5' : 'left-1'}`} />
              </button>
            </div>
            
            <button
              onClick={() => setShowApiDashboard(true)}
              className="text-xs font-medium bg-stone-800 hover:bg-stone-700 text-stone-300 py-1.5 px-3 rounded-lg transition-colors border border-stone-700"
            >
              View API Dashboard
            </button>
          </div>
        </div>

        {apiUsage.searches >= WARNING_THRESHOLD && (
          <div className="mb-6 bg-red-950/30 border border-red-900/50 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-red-400">Approaching Free-Tier Limits</h4>
              <p className="text-sm text-stone-400 mt-1">
                You have used {apiUsage.searches} out of the {MONTHLY_LIMIT} protected searches allowed this month. 
                This soft limit ensures you stay well within the Google Maps Platform $200 monthly free tier.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSearch} className="mb-10 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-500 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              id="location-input"
              required
              placeholder="Search City (e.g. Austin, TX)"
              className="w-full bg-stone-900 border border-stone-800 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
            />
          </div>
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-500 pointer-events-none" />
            <select
              id="industry-select"
              className="w-full bg-stone-900 border border-stone-800 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors appearance-none"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
            >
              {INDUSTRIES.map(ind => (
                <option key={ind} value={ind}>{ind}</option>
              ))}
            </select>
          </div>
          <button 
            type="submit" 
            disabled={isSearching || !placesLib || apiUsage.searches >= MONTHLY_LIMIT}
            className="bg-orange-600 hover:bg-orange-500 text-white px-8 py-3 rounded-xl font-medium disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            Find Leads
          </button>
        </form>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {prospects
            .filter(p => showHidden ? dismissedPlaceIds.includes(p.id) : !dismissedPlaceIds.includes(p.id))
            .map((prospect, idx) => (
            <div key={idx} className={`bg-stone-900 border ${showHidden ? 'border-stone-800 opacity-70' : 'border-stone-800'} rounded-xl p-6 hover:border-orange-500/30 transition-colors flex flex-col`}>
              <h3 className="text-lg font-semibold text-white mb-2">
                {prospect.googleMapsURI ? (
                  <a href={prospect.googleMapsURI} target="_blank" rel="noreferrer" className="hover:text-orange-400 hover:underline transition-colors">
                    {prospect.displayName}
                  </a>
                ) : (
                  prospect.displayName
                )}
              </h3>
              
              <div className="space-y-2 mb-6 flex-1">
                {prospect.primaryTypeDisplayName && (
                  <div className="inline-block px-2.5 py-1 rounded-md bg-stone-800 text-xs text-stone-300 font-medium mb-2">
                    {prospect.primaryTypeDisplayName}
                  </div>
                )}
                
                <div className="flex items-start gap-2 text-sm text-stone-400">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-stone-500" />
                  <span>{prospect.formattedAddress}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-stone-400">
                  <Star className="w-4 h-4 text-orange-500 flex-shrink-0" />
                  <span>{prospect.rating ? `${prospect.rating} (${prospect.userRatingCount} reviews)` : 'No ratings yet'}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-red-400/80 font-medium">
                  <Globe className="w-4 h-4 flex-shrink-0" />
                  <span>No Website Listed</span>
                </div>
              </div>
              
              <div className="flex gap-2 mt-auto">
                <button
                  onClick={() => handleDraftProposal(prospect)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-sm font-medium transition-colors border border-stone-700"
                >
                  <Mail className="w-4 h-4" />
                  Draft AI Proposal
                </button>
                <button
                  onClick={() => handleGatherAssets(prospect)}
                  disabled={gatheringId === prospect.id}
                  className="flex-none flex items-center justify-center px-3 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg transition-colors border border-stone-700 disabled:opacity-50"
                  title="Pull Site Assets"
                >
                  {gatheringId === prospect.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4 text-orange-400" />}
                </button>
                {showHidden ? (
                  <button
                    onClick={() => handleRestore(prospect.id)}
                    className="flex-none px-3 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-sm font-medium transition-colors border border-stone-700"
                    title="Restore Lead"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => handleDismiss(prospect.id)}
                    className="flex-none px-3 py-2.5 bg-stone-800 hover:bg-red-900/50 text-stone-400 hover:text-red-400 rounded-lg text-sm font-medium transition-colors border border-stone-700"
                    title="Hide Lead"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {prospects.length === 0 && !isSearching && city && (
            <div className="col-span-full py-16 text-center text-stone-500 border border-dashed border-stone-800 rounded-xl">
              No matching prospects found without websites. Try a broader search.
            </div>
          )}
        </div>
      </div>

      {/* Lead Workspace Modal */}
      {selectedProspect && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-stone-800 flex justify-between items-center bg-stone-950/50">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-orange-500" />
                <h3 className="text-lg font-semibold text-white">{selectedProspect.displayName} - Workspace</h3>
              </div>
              <button 
                onClick={() => setSelectedProspect(null)}
                className="text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex flex-col md:flex-row overflow-hidden flex-1">
              
              {/* Left Column: Proposal */}
              <div className="w-full md:w-1/2 flex flex-col border-r border-stone-800">
                <div className="px-6 py-3 border-b border-stone-800 bg-stone-900 font-medium text-stone-300 text-sm flex items-center gap-2">
                  <Mail className="w-4 h-4 text-orange-500" /> Sales Proposal
                </div>
                <div className="p-6 overflow-y-auto flex-1 bg-stone-950">
                  {isDrafting ? (
                    <div className="h-full flex flex-col items-center justify-center text-stone-500">
                      <Loader2 className="w-8 h-8 animate-spin text-orange-500 mb-4" />
                      <span>Texas Sons Engine is analyzing the prospect...</span>
                    </div>
                  ) : proposalDraft ? (
                    <div className="text-stone-300 text-sm whitespace-pre-wrap leading-relaxed">
                      {proposalDraft}
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-stone-500 space-y-4">
                      <p className="text-sm">No proposal generated yet.</p>
                      <button
                        onClick={() => handleDraftProposal(selectedProspect)}
                        className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-sm font-medium transition-colors border border-stone-700 flex items-center gap-2"
                      >
                        <Mail className="w-4 h-4" /> Generate AI Proposal
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Assets */}
              <div className="w-full md:w-1/2 flex flex-col">
                <div className="px-6 py-3 border-b border-stone-800 bg-stone-900 font-medium text-stone-300 text-sm flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-orange-500" /> Site Assets
                  </div>
                  {!selectedProspect.phoneNumber && (
                    <button
                      onClick={() => handleGatherAssets(selectedProspect)}
                      disabled={gatheringId === selectedProspect.id}
                      className="text-xs font-bold text-orange-400 hover:text-orange-300 disabled:opacity-50 flex items-center gap-1"
                    >
                      {gatheringId === selectedProspect.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                      Pull from Google
                    </button>
                  )}
                </div>
                <div className="p-6 overflow-y-auto flex-1 bg-stone-900/30">
                  {!selectedProspect.phoneNumber && gatheringId !== selectedProspect.id && (
                    <div className="h-full flex flex-col items-center justify-center text-stone-500 space-y-4">
                      <ImageIcon className="w-12 h-12 text-stone-800 mb-2" />
                      <p className="text-sm text-center">No assets gathered yet.<br/>Pull photos, hours, and reviews from Google.</p>
                      <button
                        onClick={() => handleGatherAssets(selectedProspect)}
                        className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-sm font-medium transition-colors border border-stone-700 flex items-center gap-2"
                      >
                        <ImageIcon className="w-4 h-4" /> Pull Assets
                      </button>
                    </div>
                  )}
                  {gatheringId === selectedProspect.id && (
                    <div className="h-full flex flex-col items-center justify-center text-stone-500">
                      <Loader2 className="w-8 h-8 animate-spin text-orange-500 mb-4" />
                      <span>Fetching photos and details...</span>
                    </div>
                  )}
                  {selectedProspect.phoneNumber && (
                    <div className="space-y-6">
                      {/* Details */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm text-stone-300">
                          <Phone className="w-4 h-4 text-stone-500" />
                          <span>{selectedProspect.phoneNumber || 'No phone number available'}</span>
                        </div>
                        {selectedProspect.openingHours && (
                          <div className="flex items-start gap-3 text-sm text-stone-300">
                            <Clock className="w-4 h-4 text-stone-500 mt-0.5" />
                            <div className="space-y-1 text-xs">
                              {selectedProspect.openingHours.map((h: string, i: number) => (
                                <div key={i}>{h}</div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Photos */}
                      {selectedProspect.photos && selectedProspect.photos.length > 0 && (
                        <div>
                          <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3">Photos ({selectedProspect.photos.length})</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {selectedProspect.photos.slice(0, 4).map((url: string, i: number) => (
                              <img key={i} src={url} alt="Business" className="w-full h-24 object-cover rounded-lg border border-stone-800" />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Reviews */}
                      {selectedProspect.reviews && selectedProspect.reviews.length > 0 && (
                        <div>
                          <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3">Top Reviews</h4>
                          <div className="space-y-3">
                            {selectedProspect.reviews.slice(0, 2).map((r: any, i: number) => (
                              <div key={i} className="bg-stone-950 p-3 rounded-lg border border-stone-800">
                                <div className="flex items-center gap-1 mb-1">
                                  {Array.from({ length: r.rating }).map((_, j) => (
                                    <Star key={j} className="w-3 h-3 text-orange-500 fill-orange-500" />
                                  ))}
                                </div>
                                <p className="text-xs text-stone-300 italic line-clamp-3">"{r.text}"</p>
                                <p className="text-[10px] text-stone-500 mt-2">- {r.author}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-stone-800 bg-stone-950/50 flex justify-end gap-3">
              <button 
                onClick={() => setSelectedProspect(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
              >
                Close
              </button>
              <button 
                disabled={isDrafting || gatheringId === selectedProspect.id}
                onClick={() => {
                  onConvert(selectedProspect);
                }}
                className="px-5 py-2 rounded-lg text-sm font-medium bg-orange-600 hover:bg-orange-500 text-white disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Project Scaffold
              </button>
            </div>
          </div>
        </div>
      )}
      
      {showApiDashboard && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-800 flex justify-between items-center bg-stone-950/50">
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-orange-500" />
                <h3 className="text-lg font-semibold text-white">API Usage Dashboard</h3>
              </div>
              <button 
                onClick={() => setShowApiDashboard(false)}
                className="text-stone-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <h4 className="text-sm font-semibold text-stone-200">Maps Search Limit (Lead Finder)</h4>
                    <p className="text-xs text-stone-400 mt-0.5">Protected soft limit out of 4,500/mo.</p>
                  </div>
                  <span className={`text-xs font-bold ${apiUsage.searches >= WARNING_THRESHOLD ? 'text-red-400' : 'text-stone-300'}`}>
                    {apiUsage.searches} / {MONTHLY_LIMIT}
                  </span>
                </div>
                <div className="h-2 w-full bg-stone-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${apiUsage.searches >= WARNING_THRESHOLD ? 'bg-red-500' : 'bg-orange-500'}`} 
                    style={{ width: `${Math.min(100, (apiUsage.searches / MONTHLY_LIMIT) * 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <h4 className="text-sm font-semibold text-stone-200">Places Autocomplete Sessions</h4>
                    <p className="text-xs text-stone-400 mt-0.5">Google gives 10,000 free sessions/mo.</p>
                  </div>
                  <span className="text-xs font-bold text-stone-300">
                    {apiUsage.autocomplete} / 10,000
                  </span>
                </div>
                <div className="h-2 w-full bg-stone-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-blue-500" 
                    style={{ width: `${Math.min(100, (apiUsage.autocomplete / 10000) * 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <h4 className="text-sm font-semibold text-stone-200">Site Asset Pulls (Details API)</h4>
                    <p className="text-xs text-stone-400 mt-0.5">Tracked for billing awareness (~$0.017 ea).</p>
                  </div>
                  <span className="text-xs font-bold text-stone-300">
                    {apiUsage.assets}
                  </span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <h4 className="text-sm font-semibold text-stone-200">AI Proposals Generated</h4>
                    <p className="text-xs text-stone-400 mt-0.5">Tracked for Gemini API awareness.</p>
                  </div>
                  <span className="text-xs font-bold text-stone-300">
                    {apiUsage.ai}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProspectsView({ onConvert }: { onConvert: (business: any) => void }) {
  if (!API_KEY || API_KEY === 'YOUR_API_KEY') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="bg-stone-900 border border-stone-800 p-8 rounded-2xl max-w-lg shadow-xl">
          <Globe className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-display font-bold text-white mb-3">Google Maps Integration Required</h2>
          <p className="text-stone-400 text-sm mb-6 leading-relaxed">
            To search for local businesses and generate prospect lists, the Texas Sons Engine requires a Google Maps Platform API Key.
          </p>
          <div className="text-left text-sm text-stone-300 bg-stone-950 p-4 rounded-xl border border-stone-800 space-y-2">
            <p>1. Open <strong>Settings</strong> (⚙️ icon, top-right)</p>
            <p>2. Select <strong>Secrets</strong></p>
            <p>3. Add secret: <code className="text-orange-400">GOOGLE_MAPS_PLATFORM_KEY</code></p>
            <p>4. The application will rebuild automatically.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <APIProvider apiKey={API_KEY} version="weekly">
      <ProspectsFinder onConvert={onConvert} />
    </APIProvider>
  );
}
