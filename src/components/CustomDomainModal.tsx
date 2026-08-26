import React, { useState, useEffect } from 'react';
import {
  Globe, X, Check, Copy, ExternalLink, ShieldCheck,
  AlertCircle, RefreshCw, Trash2, ArrowRight, Lock, Server, Sparkles, Cloud
} from 'lucide-react';

interface CustomDomainModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  currentDomain?: string;
  onDomainUpdated?: (domain: string) => void;
}

interface DomainInfo {
  id: string;
  name: string;
  status: string;
  ssl?: { status?: string };
  created_on?: string;
}

export default function CustomDomainModal({
  isOpen,
  onClose,
  projectName,
  currentDomain,
  onDomainUpdated
}: CustomDomainModalProps) {
  const [domainInput, setDomainInput] = useState('');
  const [selectedRegistrar, setSelectedRegistrar] = useState<'namecheap' | 'cloudflare' | 'other'>('namecheap');
  const [domains, setDomains] = useState<DomainInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const slug = projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'site';
  const targetCname = `${slug}.pages.dev`;

  const fetchDomains = async () => {
    if (!projectName) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/domains/list?project=${encodeURIComponent(projectName)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.domains)) {
        setDomains(data.domains);
      }
    } catch (err: any) {
      console.error('Fetch domains error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDomains();
      setFeedback(null);
    }
  }, [isOpen, projectName]);

  if (!isOpen) return null;

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domainInput.trim()) return;

    setIsLoading(true);
    setFeedback(null);

    const clean = domainInput.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');

    try {
      const res = await fetch('/api/domains/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectName, domainName: clean })
      });
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to attach domain');
      }

      setFeedback({
        type: 'success',
        message: `Successfully registered ${clean} on Cloudflare Pages! Follow the ${selectedRegistrar === 'namecheap' ? 'Namecheap' : 'DNS'} steps below.`
      });
      setDomainInput('');
      await fetchDomains();
      if (onDomainUpdated) onDomainUpdated(clean);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error connecting domain' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (domainName: string) => {
    setIsVerifying(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/domains/verify?project=${encodeURIComponent(projectName)}&domain=${encodeURIComponent(domainName)}`);
      const data = await res.json();
      if (data.success && data.domain) {
        const isLive = data.isLive;
        setFeedback({
          type: isLive ? 'success' : 'info',
          message: isLive
            ? `🎉 ${domainName} is verified and active with automated SSL!`
            : `⏳ DNS verification in progress for ${domainName}. DNS changes on Namecheap usually take 2-15 minutes.`
        });
        await fetchDomains();
      } else {
        throw new Error(data.error || 'Verification query failed');
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Verification check failed' });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRemove = async (domainName: string) => {
    if (!confirm(`Are you sure you want to remove ${domainName}?`)) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/domains/remove?project=${encodeURIComponent(projectName)}&domain=${encodeURIComponent(domainName)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'info', message: `Removed ${domainName}` });
        await fetchDomains();
        if (onDomainUpdated && domains.length <= 1) onDomainUpdated('');
      } else {
        throw new Error(data.error || 'Failed to remove domain');
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-stone-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[14px_6px_16px_8px/8px_16px_6px_14px] bg-[#C5A059]/10 border border-[#C5A059]/20 flex items-center justify-center text-[#C5A059]">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                <span>Custom Domain Manager</span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-stone-800 text-[#C5A059] border border-stone-700">
                  Cloudflare Edge
                </span>
              </h2>
              <p className="text-xs text-stone-400 mt-0.5">
                Attach Namecheap, GoDaddy, or Cloudflare domains to <span className="text-stone-200 font-mono font-semibold">{targetCname}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center gap-2.5 ${
            feedback.type === 'success' ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300' :
            feedback.type === 'error' ? 'bg-red-950/60 border-red-800 text-red-300' :
            'bg-blue-950/60 border-blue-800 text-blue-300'
          }`}>
            {feedback.type === 'success' ? <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" /> :
             feedback.type === 'error' ? <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" /> :
             <RefreshCw className="w-4 h-4 text-blue-400 animate-spin flex-shrink-0" />}
            <span className="leading-relaxed">{feedback.message}</span>
          </div>
        )}

        {/* Add Domain Form */}
        <form onSubmit={handleAddDomain} className="space-y-2.5">
          <label className="block text-[11px] font-bold text-stone-300 uppercase tracking-wider">
            Enter Domain Name
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Globe className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500" />
              <input
                type="text"
                placeholder="e.g. trevinoforsheriff.com or www.valdezsalon.com"
                value={domainInput}
                onChange={e => setDomainInput(e.target.value)}
                className="w-full h-11 pl-10 pr-4 rounded-xl bg-stone-950 border border-stone-700 text-xs font-medium text-white placeholder-stone-600 focus:outline-none focus:border-[#C5A059] focus:ring-2 focus:ring-[#C5A059]/25 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !domainInput.trim()}
              className="px-5 h-11 rounded-xl bg-[#C5A059]/90 hover:bg-[#C5A059] disabled:opacity-40 text-white text-xs font-bold transition-all shadow-lg shadow-[#C5A059]/30 flex items-center gap-1.5 cursor-pointer flex-shrink-0"
            >
              {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>Attach Domain</span>
            </button>
          </div>
        </form>

        {/* Registrar Provider Selector Tabs */}
        <div className="space-y-2">
          <label className="block text-[11px] font-bold text-stone-400 uppercase tracking-wider">
            Choose Your Registrar for Setup Instructions
          </label>
          <div className="flex items-center gap-1.5 p-1 bg-stone-950 rounded-2xl border border-stone-800">
            <button
              type="button"
              onClick={() => setSelectedRegistrar('namecheap')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                selectedRegistrar === 'namecheap'
                  ? 'bg-[#C5A059]/90 text-white shadow-md shadow-[#C5A059]/30'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <span>🏷️ Namecheap</span>
              <span className="text-[9px] uppercase px-1.5 py-0.2 bg-black/30 rounded font-semibold hidden sm:inline">Best Price</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRegistrar('cloudflare')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                selectedRegistrar === 'cloudflare'
                  ? 'bg-[#C5A059]/90 text-white shadow-md shadow-[#C5A059]/30'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>Cloudflare DNS</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRegistrar('other')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                selectedRegistrar === 'other'
                  ? 'bg-[#C5A059]/90 text-white shadow-md shadow-[#C5A059]/30'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <span>🌐 GoDaddy / Other</span>
            </button>
          </div>
        </div>

        {/* REGISTRAR 1: NAMECHEAP STEP-BY-STEP INSTRUCTIONS */}
        {selectedRegistrar === 'namecheap' && (
          <div className="bg-stone-950 border border-stone-800 rounded-2xl p-4 space-y-3.5 shadow-inner">
            <div className="flex items-center justify-between border-b border-stone-800/80 pb-2.5">
              <span className="text-xs font-black text-[#C5A059] uppercase tracking-wider flex items-center gap-2">
                <Server className="w-4 h-4 text-[#C5A059]" />
                <span>Step-by-Step Namecheap Setup (60 Seconds)</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/20">
                Recommended
              </span>
            </div>

            <ol className="space-y-3 text-xs text-stone-300">
              <li className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-stone-900 border border-stone-700 text-[#C5A059] font-bold text-[10px] flex-shrink-0 mt-0.5">
                  1
                </span>
                <span>
                  Buy domain on <strong className="text-white">Namecheap</strong> (e.g. <span className="font-mono text-[#C5A059] font-semibold">{domainInput.trim() || 'trevinoforsheriff.com'}</span>).
                </span>
              </li>

              <li className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-stone-900 border border-stone-700 text-[#C5A059] font-bold text-[10px] flex-shrink-0 mt-0.5">
                  2
                </span>
                <span>
                  In Texas Sons Studio, click <strong className="text-white">Custom Domain</strong> in the top bar.
                </span>
              </li>

              <li className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-stone-900 border border-stone-700 text-[#C5A059] font-bold text-[10px] flex-shrink-0 mt-0.5">
                  3
                </span>
                <span>
                  Type <span className="font-mono text-[#C5A059] font-semibold">{domainInput.trim() || 'trevinoforsheriff.com'}</span> and click <strong className="text-white">Attach Domain</strong>.
                </span>
              </li>

              <li className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-stone-900 border border-stone-700 text-[#C5A059] font-bold text-[10px] flex-shrink-0 mt-0.5">
                  4
                </span>
                <div className="space-y-2 w-full">
                  <span>
                    In Namecheap Dashboard ➔ <strong className="text-white">Domain List</strong> ➔ <strong className="text-white">Manage</strong> ➔ <strong className="text-white">Advanced DNS</strong>:
                  </span>
                  <div className="p-2.5 bg-stone-900/90 rounded-xl border border-stone-800 space-y-2">
                    <span className="text-[11px] font-bold text-stone-300 block">
                      Add CNAME Record: Host <strong className="text-[#C5A059] font-mono">www</strong> (or <strong className="text-[#C5A059] font-mono">@</strong>), Target <strong className="text-[#C5A059] font-mono">{targetCname}</strong>:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="p-2 bg-stone-950 rounded-lg border border-stone-800 flex items-center justify-between">
                        <div>
                          <span className="text-[9px] uppercase font-bold text-stone-500 block">Type</span>
                          <span className="text-xs font-mono font-bold text-stone-200">CNAME Record</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard('CNAME', 'type')}
                          className="p-1 rounded text-stone-400 hover:text-white"
                          title="Copy Type"
                        >
                          {copiedKey === 'type' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>

                      <div className="p-2 bg-stone-950 rounded-lg border border-stone-800 flex items-center justify-between">
                        <div>
                          <span className="text-[9px] uppercase font-bold text-stone-500 block">Host</span>
                          <span className="text-xs font-mono font-bold text-stone-200">www (or @)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard('www', 'host')}
                          className="p-1 rounded text-stone-400 hover:text-white"
                          title="Copy Host"
                        >
                          {copiedKey === 'host' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>

                      <div className="p-2 bg-stone-950 rounded-lg border border-stone-800 flex items-center justify-between truncate">
                        <div className="truncate pr-1">
                          <span className="text-[9px] uppercase font-bold text-stone-500 block">Target / Value</span>
                          <span className="text-xs font-mono font-bold text-[#C5A059] truncate block">{targetCname}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(targetCname, 'target')}
                          className="p-1 rounded text-stone-400 hover:text-white flex-shrink-0"
                          title="Copy Target"
                        >
                          {copiedKey === 'target' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </li>

              <li className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-stone-900 border border-stone-700 text-[#C5A059] font-bold text-[10px] flex-shrink-0 mt-0.5">
                  5
                </span>
                <span>
                  Back in Texas Sons Studio, click <strong className="text-white">Verify</strong>. Once DNS resolves, Cloudflare automatically provisions the SSL certificate and secures the site!
                </span>
              </li>
            </ol>
          </div>
        )}

        {/* REGISTRAR 2: CLOUDFLARE INSTRUCTIONS */}
        {selectedRegistrar === 'cloudflare' && (
          <div className="bg-stone-950 border border-stone-800 rounded-2xl p-4 space-y-3.5 shadow-inner">
            <div className="flex items-center justify-between border-b border-stone-800/80 pb-2.5">
              <span className="text-xs font-black text-blue-400 uppercase tracking-wider flex items-center gap-2">
                <Cloud className="w-4 h-4 text-blue-400" />
                <span>Cloudflare DNS / Registrar Setup (Zero-Config)</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Full DNS Automation
              </span>
            </div>

            <ol className="space-y-2.5 text-xs text-stone-300">
              <li className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-stone-900 border border-stone-700 text-blue-400 font-bold text-[10px] flex-shrink-0 mt-0.5">
                  1
                </span>
                <span>
                  If the domain is on Cloudflare (or pointed to Cloudflare Nameservers), type your domain above and click <strong className="text-white">"Attach Domain"</strong>.
                </span>
              </li>

              <li className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-stone-900 border border-stone-700 text-blue-400 font-bold text-[10px] flex-shrink-0 mt-0.5">
                  2
                </span>
                <span>
                  Cloudflare Pages automatically creates the CNAME record in your Cloudflare DNS Zone and flattens apex root domains (<span className="font-mono text-blue-300 font-semibold">@</span>) automatically.
                </span>
              </li>

              <li className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-stone-900 border border-stone-700 text-blue-400 font-bold text-[10px] flex-shrink-0 mt-0.5">
                  3
                </span>
                <span>
                  Click <strong className="text-white">"Verify"</strong> below to confirm live status. Universal SSL & Edge CDN are active immediately!
                </span>
              </li>
            </ol>
          </div>
        )}

        {/* REGISTRAR 3: GODADDY / OTHER INSTRUCTIONS */}
        {selectedRegistrar === 'other' && (
          <div className="bg-stone-950 border border-stone-800 rounded-2xl p-4 space-y-3.5 shadow-inner">
            <div className="flex items-center justify-between border-b border-stone-800/80 pb-2.5">
              <span className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <Globe className="w-4 h-4 text-amber-400" />
                <span>GoDaddy / Google Domains / Other Registrars</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Standard CNAME
              </span>
            </div>

            <ol className="space-y-2.5 text-xs text-stone-300">
              <li className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-stone-900 border border-stone-700 text-amber-400 font-bold text-[10px] flex-shrink-0 mt-0.5">
                  1
                </span>
                <span>
                  In your registrar's DNS Management panel, add a <strong className="text-white">CNAME record</strong>.
                </span>
              </li>

              <li className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-stone-900 border border-stone-700 text-amber-400 font-bold text-[10px] flex-shrink-0 mt-0.5">
                  2
                </span>
                <span>
                  Set Host to <strong className="text-amber-400 font-mono">www</strong> (or <strong className="text-amber-400 font-mono">@</strong>) and Points to / Target to <strong className="text-amber-400 font-mono">{targetCname}</strong>.
                </span>
              </li>

              <li className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-stone-900 border border-stone-700 text-amber-400 font-bold text-[10px] flex-shrink-0 mt-0.5">
                  3
                </span>
                <span>
                  Click <strong className="text-white">Verify</strong> below to activate automated SSL.
                </span>
              </li>
            </ol>
          </div>
        )}

        {/* Attached Custom Domains List */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="block text-[11px] font-bold text-stone-300 uppercase tracking-wider">
              Attached Domains ({domains.length})
            </label>
            <button
              type="button"
              onClick={fetchDomains}
              disabled={isLoading}
              className="text-[10px] font-bold text-stone-400 hover:text-[#C5A059] flex items-center gap-1 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Status</span>
            </button>
          </div>

          {domains.length === 0 ? (
            <div className="p-6 bg-stone-950/60 rounded-2xl border border-stone-800 text-center space-y-1">
              <Globe className="w-6 h-6 text-stone-600 mx-auto" />
              <p className="text-xs font-semibold text-stone-400">No custom domains attached yet.</p>
              <p className="text-[10px] text-stone-500">Your site is currently live on its primary Cloudflare edge: <span className="font-mono text-stone-300">{targetCname}</span></p>
            </div>
          ) : (
            <div className="space-y-2">
              {domains.map(d => {
                const isLive = d.status === 'active' || d.status === 'ready';
                return (
                  <div key={d.name} className="p-3.5 bg-stone-950 rounded-2xl border border-stone-800 flex items-center justify-between gap-3">
                    <div className="space-y-1 truncate">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white font-mono">{d.name}</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                          isLive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
                          {isLive ? 'Active & SSL Secured' : 'Pending DNS'}
                        </span>
                      </div>
                      <p className="text-[10px] text-stone-500">Target: {targetCname}</p>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleVerify(d.name)}
                        disabled={isVerifying}
                        className="px-2.5 py-1.5 rounded-xl border border-stone-700 bg-stone-900 hover:bg-stone-800 text-stone-200 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                        title="Check DNS and SSL status"
                      >
                        <RefreshCw className={`w-3 h-3 ${isVerifying ? 'animate-spin text-[#C5A059]' : ''}`} />
                        <span>Verify</span>
                      </button>
                      
                      <a
                        href={`https://${d.name}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl border border-stone-800 bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white transition-colors"
                        title="Open live domain"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>

                      <button
                        type="button"
                        onClick={() => handleRemove(d.name)}
                        className="p-2 rounded-xl border border-stone-800 bg-stone-900 hover:bg-red-950/50 text-stone-400 hover:text-red-400 transition-colors cursor-pointer"
                        title="Remove domain"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-stone-800">
          <div className="flex items-center gap-1.5 text-[11px] text-stone-400">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Automatic Let's Encrypt SSL/TLS Certificate Included</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}
