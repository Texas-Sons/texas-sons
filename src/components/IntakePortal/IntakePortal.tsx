import React, { useState, useEffect } from 'react';
import { resizeImage } from './imageUtils';
import TexasSonsLogo from '../TexasSonsLogo';
import { Upload, X, CheckCircle2, AlertCircle, Loader2, Camera, Plus, Trash2 } from 'lucide-react';

export default function IntakePortal() {
  const [token, setToken] = useState('');
  const [businessInfo, setBusinessInfo] = useState<{ businessName?: string; contactName?: string; category?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState('');

  // Form State
  const [logoBase64, setLogoBase64] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [hours, setHours] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [socialLinks, setSocialLinks] = useState('');
  const [notes, setNotes] = useState('');
  const [services, setServices] = useState([{ title: '', description: '', price: '' }]);

  useEffect(() => {
    const path = window.location.pathname;
    const parts = path.split('/');
    const t = parts[parts.length - 1];
    setToken(t);

    fetch('/api/intake/' + t)
      .then(r => r.json())
      .then(data => {
        if (!data.success) throw new Error(data.error || 'Invalid link');
        setBusinessInfo(data.intake);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isLogo: boolean) => {
    if (!e.target.files?.length) return;
    try {
      setProgress('Processing image...');
      if (isLogo) {
        const resized = await resizeImage(e.target.files[0], 800);
        setLogoBase64(resized);
      } else {
        const newPhotos = [];
        for (let i = 0; i < e.target.files.length; i++) {
          newPhotos.push(await resizeImage(e.target.files[i], 1600));
        }
        setPhotos(prev => [...prev, ...newPhotos]);
      }
    } catch (err) {
      alert('Failed to process image. Please try another one.');
    } finally {
      setProgress('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setProgress('Uploading your assets (this may take a minute)...');
    
    try {
      const payload = {
        logoBase64,
        photos,
        tagline,
        description,
        hours,
        address,
        phone,
        email,
        socialLinks,
        notes,
        services: services.filter(s => s.title || s.description)
      };

      const res = await fetch('/api/intake/' + token, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload })
      });
      const data = await res.json();
      
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to submit');
      setSuccess(true);
    } catch (err: any) {
      alert(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
      setProgress('');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center text-stone-400">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-[#C5A059]" />
        <p>Loading your secure portal...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mb-6" />
        <h1 className="text-2xl font-bold text-white mb-2">Link Expired or Invalid</h1>
        <p className="text-stone-400 mb-8 max-w-md">This setup link is no longer active. Please contact your Texas Sons representative for a new link.</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center p-6 text-center">
        <CheckCircle2 className="w-20 h-20 text-[#C5A059] mb-6" />
        <h1 className="text-3xl font-bold text-white mb-4">Received!</h1>
        <p className="text-stone-400 mb-8 max-w-md text-lg">Thanks for submitting your assets. Our studio team will review these and get back to you shortly.</p>
        <div className="w-48"><TexasSonsLogo /></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-200">
      <div className="max-w-3xl mx-auto px-4 py-8 md:py-16">
        <div className="flex justify-center mb-12 w-48 mx-auto">
          <TexasSonsLogo />
        </div>
        
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome, {businessInfo?.businessName}</h1>
          <p className="text-stone-400">Please provide your business assets so we can begin assembling your project.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-12">
          
          {/* Images Section */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white border-b border-stone-800 pb-2">1. Brand Assets & Photos</h2>
            
            <div className="bg-stone-900/50 p-6 rounded-xl border border-stone-800">
              <label className="block text-sm font-medium text-stone-300 mb-2">Logo</label>
              <p className="text-xs text-stone-500 mb-4">Please upload a high-quality logo (transparent PNG preferred).</p>
              
              {logoBase64 ? (
                <div className="relative inline-block">
                  <img src={logoBase64} alt="Logo" className="h-32 object-contain bg-stone-800 rounded p-2 border border-stone-700" />
                  <button type="button" onClick={() => setLogoBase64('')} className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"><X className="w-4 h-4 text-white" /></button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-stone-700 border-dashed rounded-lg cursor-pointer hover:bg-stone-800 transition">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 text-stone-400 mb-2" />
                    <p className="text-sm text-stone-400">Click to upload logo</p>
                  </div>
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, true)} />
                </label>
              )}
            </div>

            <div className="bg-stone-900/50 p-6 rounded-xl border border-stone-800">
              <label className="block text-sm font-medium text-stone-300 mb-2">Location & Team Photos</label>
              <p className="text-xs text-stone-500 mb-4">Upload a few photos of your business, work, or team.</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {photos.map((p, i) => (
                  <div key={i} className="relative aspect-square">
                    <img src={p} className="w-full h-full object-cover rounded border border-stone-700" alt="Upload" />
                    <button type="button" onClick={() => setPhotos(photos.filter((_, j) => j !== i))} className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"><X className="w-4 h-4 text-white" /></button>
                  </div>
                ))}
                
                <label className="flex flex-col items-center justify-center aspect-square border-2 border-stone-700 border-dashed rounded-lg cursor-pointer hover:bg-stone-800 transition">
                  <Camera className="w-6 h-6 text-stone-400 mb-2" />
                  <span className="text-xs text-stone-400">Add Photo</span>
                  <input type="file" className="hidden" accept="image/*" multiple onChange={(e) => handleImageUpload(e, false)} />
                </label>
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white border-b border-stone-800 pb-2">2. Business Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-stone-300 mb-1">Tagline</label>
                <input type="text" value={tagline} onChange={e => setTagline(e.target.value)} className="w-full bg-stone-900 border border-stone-700 rounded-lg p-3 text-white focus:border-[#C5A059] focus:outline-none" placeholder="e.g. Dedicated Texas Quality" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-stone-300 mb-1">Business Hours</label>
                <input type="text" value={hours} onChange={e => setHours(e.target.value)} className="w-full bg-stone-900 border border-stone-700 rounded-lg p-3 text-white focus:border-[#C5A059] focus:outline-none" placeholder="Mon-Fri 8am-5pm" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-300 mb-1">About the Business</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} className="w-full bg-stone-900 border border-stone-700 rounded-lg p-3 text-white focus:border-[#C5A059] focus:outline-none" placeholder="Tell us about what you do..."></textarea>
            </div>
          </div>

          {/* Contact Section */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white border-b border-stone-800 pb-2">3. Contact Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-stone-300 mb-1">Address</label>
                <input type="text" value={address} onChange={e => setAddress(e.target.value)} className="w-full bg-stone-900 border border-stone-700 rounded-lg p-3 text-white focus:border-[#C5A059] focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-300 mb-1">Phone</label>
                <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-stone-900 border border-stone-700 rounded-lg p-3 text-white focus:border-[#C5A059] focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-300 mb-1">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-stone-900 border border-stone-700 rounded-lg p-3 text-white focus:border-[#C5A059] focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-300 mb-1">Social Media Links</label>
                <input type="text" value={socialLinks} onChange={e => setSocialLinks(e.target.value)} className="w-full bg-stone-900 border border-stone-700 rounded-lg p-3 text-white focus:border-[#C5A059] focus:outline-none" placeholder="Facebook, Instagram, etc." />
              </div>
            </div>
          </div>

          {/* Services Section */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white border-b border-stone-800 pb-2">4. Top Services</h2>
            <p className="text-sm text-stone-400">List 1-3 core services you want highlighted.</p>
            
            {services.map((s, idx) => (
              <div key={idx} className="bg-stone-900/50 p-4 rounded-xl border border-stone-800 relative">
                <button type="button" onClick={() => setServices(services.filter((_, j) => j !== idx))} className="absolute top-4 right-4 text-stone-500 hover:text-red-500">
                  <Trash2 className="w-5 h-5" />
                </button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 pr-8">
                  <div>
                    <label className="block text-xs text-stone-400 mb-1">Service Name</label>
                    <input type="text" value={s.title} onChange={e => { const newS = [...services]; newS[idx].title = e.target.value; setServices(newS); }} className="w-full bg-stone-900 border border-stone-700 rounded p-2 text-white text-sm focus:border-[#C5A059] focus:outline-none" placeholder="e.g. General Contracting" />
                  </div>
                  <div>
                    <label className="block text-xs text-stone-400 mb-1">Price / Starting At (optional)</label>
                    <input type="text" value={s.price} onChange={e => { const newS = [...services]; newS[idx].price = e.target.value; setServices(newS); }} className="w-full bg-stone-900 border border-stone-700 rounded p-2 text-white text-sm focus:border-[#C5A059] focus:outline-none" placeholder="e.g. Call for pricing" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-stone-400 mb-1">Description</label>
                  <textarea value={s.description} onChange={e => { const newS = [...services]; newS[idx].description = e.target.value; setServices(newS); }} rows={2} className="w-full bg-stone-900 border border-stone-700 rounded p-2 text-white text-sm focus:border-[#C5A059] focus:outline-none"></textarea>
                </div>
              </div>
            ))}
            <button type="button" onClick={() => setServices([...services, { title: '', description: '', price: '' }])} className="flex items-center text-sm text-[#C5A059] hover:text-[#d4b06a]">
              <Plus className="w-4 h-4 mr-1" /> Add Service
            </button>
          </div>
          
          {/* Notes Section */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white border-b border-stone-800 pb-2">5. Additional Notes</h2>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="w-full bg-stone-900 border border-stone-700 rounded-lg p-3 text-white focus:border-[#C5A059] focus:outline-none" placeholder="Anything else we should know?"></textarea>
          </div>

          <div className="pt-8 border-t border-stone-800 flex flex-col items-center">
            {progress && <p className="text-[#C5A059] mb-4 text-sm font-medium">{progress}</p>}
            <button type="submit" disabled={submitting} className="bg-[#C5A059] hover:bg-[#d4b06a] text-stone-950 font-bold py-4 px-12 rounded-full transition-colors flex items-center shadow-lg shadow-[#C5A059]/20 disabled:opacity-50">
              {submitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
              {submitting ? 'Submitting...' : 'Submit Assets'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
