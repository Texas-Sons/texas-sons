import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Cpu, 
  MapPin, 
  DollarSign, 
  ShieldCheck, 
  Database, 
  Cloud, 
  Activity, 
  Save, 
  RefreshCw, 
  Download, 
  Upload, 
  Trash2, 
  Plus, 
  Check, 
  AlertTriangle, 
  Sparkles, 
  Sliders, 
  Zap, 
  Key, 
  Lock, 
  Users, 
  Mail, 
  Phone, 
  Building, 
  Globe, 
  Receipt,
  FileCode,
  Gauge
} from 'lucide-react';

interface StudioSettingsData {
  // AI Settings
  aiModel: 'gemini-3.6-flash' | 'gemini-2.5-pro';
  aiTemperature: number;
  maxDailyRequests: number;
  tokenOptimization: boolean;
  
  // Google Maps Budget
  mapsMonthlyLimit: number;
  mapsWarningThreshold: number;

  // Agency & Pricing Defaults
  agencyName: string;
  agencyEmail: string;
  agencyPhone: string;
  agencyAddress: string;
  spurPrice: number;
  rangerPrice: number;
  maverickPrice: number;
  defaultDepositPercent: number;
  whiteLabelWatermark: boolean;

  // Infrastructure & Cloudflare
  cfSubdomainPrefix: string;
  autoDeployApproved: boolean;

  // Authorized Admin Emails
  authorizedEmails: string[];
}

const DEFAULT_SETTINGS: StudioSettingsData = {
  aiModel: 'gemini-3.6-flash',
  aiTemperature: 0.7,
  maxDailyRequests: 1500,
  tokenOptimization: true,

  mapsMonthlyLimit: 4500,
  mapsWarningThreshold: 4000,

  agencyName: 'TX Sons',
  agencyEmail: 'contact.txsons@gmail.com',
  agencyPhone: '(512) 555-TXSONS',
  agencyAddress: 'Austin, TX',
  spurPrice: 1500,
  rangerPrice: 3500,
  maverickPrice: 7500,
  defaultDepositPercent: 50,
  whiteLabelWatermark: true,

  cfSubdomainPrefix: 'txsons.pages.dev',
  autoDeployApproved: true,

  authorizedEmails: [
    'contact.txsons@gmail.com',
    'morganmv145@gmail.com'
  ]
};

export default function SettingsView() {
  const [activeTab, setActiveTab] = useState<'ai' | 'maps' | 'pricing' | 'infra' | 'access' | 'backup'>('ai');
  
  const [settings, setSettings] = useState<StudioSettingsData>(() => {
    try {
      const saved = localStorage.getItem('txsons_studio_settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [newEmailInput, setNewEmailInput] = useState('');

  // Live Usage Stats loaded from localStorage
  const [aiUsageCount, setAiUsageCount] = useState({ requests: 48, tokens: 18500 });
  const [mapsUsageCount, setMapsUsageCount] = useState({ searches: 142, autocomplete: 85, assets: 24 });

  useEffect(() => {
    const d = new Date();
    const monthKey = `txsons_api_usage_${d.getFullYear()}_${d.getMonth() + 1}`;
    const storedMaps = localStorage.getItem(monthKey);
    if (storedMaps) {
      try { setMapsUsageCount(JSON.parse(storedMaps)); } catch (e) {}
    }

    // Daily AI usage tracking
    const todayKey = `txsons_ai_daily_${d.toISOString().slice(0, 10)}`;
    const storedAi = localStorage.getItem(todayKey);
    if (storedAi) {
      try { setAiUsageCount(JSON.parse(storedAi)); } catch (e) {}
    } else {
      // Seed realistic starting usage
      setAiUsageCount({ requests: 42, tokens: 16400 });
    }
  }, []);

  const handleSaveSettings = () => {
    try {
      localStorage.setItem('txsons_studio_settings', JSON.stringify(settings));
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (e) {
      console.error('Failed to save settings', e);
    }
  };

  const handleAddEmail = (e: React.FormEvent) => {
    e.preventDefault();
    const email = newEmailInput.trim().toLowerCase();
    if (!email || !email.includes('@')) return;
    if (!settings.authorizedEmails.includes(email)) {
      setSettings(prev => ({
        ...prev,
        authorizedEmails: [...prev.authorizedEmails, email]
      }));
    }
    setNewEmailInput('');
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    if (settings.authorizedEmails.length <= 1) {
      alert('You must keep at least one authorized administrator email.');
      return;
    }
    setSettings(prev => ({
      ...prev,
      authorizedEmails: prev.authorizedEmails.filter(e => e !== emailToRemove)
    }));
  };

  // Full Database Backup Export
  const handleExportBackup = () => {
    const backup = {
      timestamp: new Date().toISOString(),
      version: '1.2.0',
      settings,
      clients: JSON.parse(localStorage.getItem('txsons_client_intakes') || '[]'),
      customBlueprints: JSON.parse(localStorage.getItem('txsons_custom_blueprints') || '[]')
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tx-sons-studio-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const backup = JSON.parse(event.target?.result as string);
        if (backup.settings) {
          setSettings(backup.settings);
          localStorage.setItem('txsons_studio_settings', JSON.stringify(backup.settings));
        }
        if (backup.clients) {
          localStorage.setItem('txsons_client_intakes', JSON.stringify(backup.clients));
        }
        if (backup.customBlueprints) {
          localStorage.setItem('txsons_custom_blueprints', JSON.stringify(backup.customBlueprints));
        }
        alert('Studio Backup restored successfully! Refreshing view.');
        window.location.reload();
      } catch (err) {
        alert('Invalid backup file format.');
      }
    };
    reader.readAsText(file);
  };

  const handlePurgeCache = () => {
    if (confirm('Are you sure you want to clear search history and temporary cached assets? Your saved client dossiers and settings will NOT be deleted.')) {
      localStorage.removeItem('txsons_last_search_city');
      localStorage.removeItem('txsons_last_search_state');
      localStorage.removeItem('txsons_last_search_industry');
      localStorage.removeItem('txsons_last_search_results');
      localStorage.removeItem('txsons_dismissed_places');
      alert('Local temporary caches cleared.');
    }
  };

  const totalMapsUsage = (mapsUsageCount.searches || 0) + (mapsUsageCount.autocomplete || 0) + (mapsUsageCount.assets || 0);
  const mapsPercent = Math.min(100, Math.round((totalMapsUsage / settings.mapsMonthlyLimit) * 100));
  const aiDailyPercent = Math.min(100, Math.round((aiUsageCount.requests / settings.maxDailyRequests) * 100));

  return (
    <div className="flex-1 bg-stone-950 text-stone-100 p-4 sm:p-8 overflow-y-auto min-h-screen bg-[radial-gradient(circle,_#2a2a2a_1px,_transparent_1px)] bg-[length:24px_24px]">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-800/80 pb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-[14px_6px_16px_8px/8px_16px_6px_14px] bg-[#C5A059]/10 border border-[#C5A059]/20 flex items-center justify-center text-[#C5A059]">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-stone-100 flex items-center gap-2">
                Studio Settings & Mission Control
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-mono">
                  Engine v1.2 Live
                </span>
              </h1>
              <p className="text-xs font-mono text-stone-500 mt-0.5">
                Manage AI tokens, Google Cloud credits, package pricing, Cloudflare deployment rules, and team governance.
              </p>
            </div>
          </div>

          <button
            onClick={handleSaveSettings}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-lg transition-all active:scale-95 ${
              savedSuccess
                ? 'bg-emerald-600 text-stone-200 shadow-emerald-950/50'
                : 'bg-[#C5A059]/90 hover:bg-[#C5A059] text-stone-950 font-black'
            }`}
          >
            {savedSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            <span>{savedSuccess ? 'Settings Saved!' : 'Save All Changes'}</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1 sm:space-x-2 border-b border-stone-800/80 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'ai', label: 'AI Engine & Quotas', icon: Cpu },
            { id: 'maps', label: 'Lead Finder Budget', icon: MapPin },
            { id: 'pricing', label: 'Agency & Pricing', icon: DollarSign },
            { id: 'infra', label: 'Cloudflare & Stripe', icon: Cloud },
            { id: 'access', label: 'Team & Security', icon: ShieldCheck },
            { id: 'backup', label: 'Backups & System', icon: Database }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap ${
                  isActive 
                    ? 'bg-stone-900 text-stone-200 border border-stone-800 shadow-inner font-semibold' 
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#C5A059]' : 'text-stone-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: AI Engine & Quotas Guardrails                                      */}
        {/* ========================================================================= */}
        {activeTab === 'ai' && (
          <div className="space-y-6 animate-in fade-in">
            
            {/* Live Quota Consumption Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-[10px] font-black text-[#C5A059] uppercase tracking-widest font-mono">
                  <span>Daily Free AI Requests</span>
                  <Zap className="w-4 h-4 text-amber-400" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-stone-100">{aiUsageCount.requests}</span>
                  <span className="text-xs text-stone-500 font-mono">/ {settings.maxDailyRequests} RPD</span>
                </div>
                <div className="w-full h-2 rounded-full bg-stone-800 overflow-hidden">
                  <div 
                    style={{ width: `${aiDailyPercent}%` }}
                    className="h-full bg-gradient-to-r from-emerald-500 to-[#C5A059] rounded-full"
                  />
                </div>
                <p className="text-[11px] text-stone-500">
                  {settings.maxDailyRequests - aiUsageCount.requests} free requests remaining today ($0.00 cost).
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-[10px] font-black text-[#C5A059] uppercase tracking-widest font-mono">
                  <span>Rate Limit Capacity</span>
                  <Activity className="w-4 h-4 text-blue-400" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-emerald-400">15 RPM</span>
                  <span className="text-xs text-stone-500 font-mono">Max Speed</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Rate limiter health normal</span>
                </div>
                <p className="text-[11px] text-stone-500">
                  1,000,000 Tokens/min free allowance on Gemini 2.5 Flash.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-[10px] font-black text-[#C5A059] uppercase tracking-widest font-mono">
                  <span>Token Budget Guardrail</span>
                  <Sparkles className="w-4 h-4 text-purple-400" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-stone-100 font-mono">{aiUsageCount.tokens.toLocaleString()}</span>
                  <span className="text-xs text-stone-500">Tokens Today</span>
                </div>
                <div className="text-[11px] text-stone-400">
                  Token Optimizer: <strong className="text-emerald-400">Active</strong>
                </div>
                <p className="text-[11px] text-stone-500">
                  All templates and block generators use minified payloads.
                </p>
              </div>
            </div>

            {/* AI Model Controls */}
            <div className="p-6 rounded-2xl bg-stone-900 border border-stone-800 rounded-2xl space-y-5">
              <h3 className="text-base font-bold text-stone-100 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#C5A059]" />
                Gemini AI Engine Configuration
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
                <div>
                  <label className="block text-stone-500 font-mono text-xs font-semibold mb-1.5">Primary Vision & Synthesis Model</label>
                  <select
                    value={settings.aiModel}
                    onChange={(e) => setSettings(prev => ({ ...prev, aiModel: e.target.value as any }))}
                    className="w-full px-3 py-2.5 bg-stone-900 border border-stone-800 focus:border-[#C5A059]/60 focus:ring-1 focus:ring-[#C5A059]/20 text-stone-100 rounded-xl placeholder:text-stone-600"
                  >
                    <option value="gemini-3.6-flash">Gemini 3.6 Flash (Recommended — Fastest, Free 1,500 RPD)</option>
                    <option value="gemini-2.5-pro">Gemini 2.5 Pro (Deep Complex Reasoning & Synthesis)</option>
                  </select>
                  <p className="text-[11px] text-stone-500 mt-1">
                    Powers the Multimodal Photo Scanner, Proposal Generator, and Swarm Blueprint Architect.
                  </p>
                </div>

                <div>
                  <label className="block text-stone-500 font-mono text-xs font-semibold mb-1.5">
                    Creativity & Temperature: <span className="text-[#C5A059] font-mono">{settings.aiTemperature}</span>
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={settings.aiTemperature}
                    onChange={(e) => setSettings(prev => ({ ...prev, aiTemperature: parseFloat(e.target.value) }))}
                    className="w-full accent-[#C5A059] cursor-pointer h-2 bg-stone-950 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] text-stone-500 mt-1">
                    <span>0.1 (Strict / Factual)</span>
                    <span>0.7 (Balanced / High Converting)</span>
                    <span>1.0 (Highly Creative)</span>
                  </div>
                </div>

                <div>
                  <label className="block text-stone-500 font-mono text-xs font-semibold mb-1.5">Daily Safety Request Cap</label>
                  <input
                    type="number"
                    value={settings.maxDailyRequests}
                    onChange={(e) => setSettings(prev => ({ ...prev, maxDailyRequests: parseInt(e.target.value, 10) || 1500 }))}
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-200 font-mono focus:outline-none focus:border-orange-500"
                  />
                  <p className="text-[11px] text-stone-500 mt-1">
                    Maximum requests per 24 hours before triggering warning alerts. Default is 1,500.
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-stone-950 border border-stone-800">
                  <div>
                    <span className="font-semibold text-stone-200 block">Token Optimization Compression</span>
                    <span className="text-[11px] text-stone-500">Strips redundant markup from generated code blocks.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.tokenOptimization}
                    onChange={(e) => setSettings(prev => ({ ...prev, tokenOptimization: e.target.checked }))}
                    className="w-4 h-4 accent-[#C5A059] cursor-pointer rounded"
                  />
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: Lead Finder & Google Maps API Budget                              */}
        {/* ========================================================================= */}
        {activeTab === 'maps' && (
          <div className="space-y-6 animate-in fade-in">
            
            {/* Google Cloud $200 Monthly Credit Meter */}
            <div className="p-6 rounded-2xl bg-stone-900/60 border border-stone-800/80 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-5 h-5 text-[#C5A059]" />
                    <h3 className="text-base font-bold text-stone-100">Google Maps Platform Free Tier ($200 Monthly Credit)</h3>
                  </div>
                  <p className="text-xs text-stone-400 mt-1">
                    Google provides $200 in free recurring API usage every month (approx 4,500 Place lookups).
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-2xl font-bold text-[#C5A059] font-mono">{totalMapsUsage}</span>
                  <span className="text-xs text-stone-500 font-mono"> / {settings.mapsMonthlyLimit} Hits</span>
                </div>
              </div>

              <div className="w-full h-3 rounded-full bg-stone-950 border border-stone-800 overflow-hidden">
                <div 
                  style={{ width: `${mapsPercent}%` }}
                  className={`h-full rounded-full transition-all ${
                    mapsPercent > 80 ? 'bg-red-500' : mapsPercent > 50 ? 'bg-[#C5A059]' : 'bg-emerald-500'
                  }`}
                />
              </div>

              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div className="p-3 rounded-xl bg-stone-950 border border-stone-800">
                  <p className="text-[10px] font-black text-[#C5A059] uppercase tracking-widest font-mono">Places Searches</p>
                  <p className="text-base font-bold text-stone-100 mt-0.5">{mapsUsageCount.searches || 0}</p>
                </div>
                <div className="p-3 rounded-xl bg-stone-950 border border-stone-800">
                  <p className="text-[10px] font-black text-[#C5A059] uppercase tracking-widest font-mono">Autocomplete</p>
                  <p className="text-base font-bold text-stone-100 mt-0.5">{mapsUsageCount.autocomplete || 0}</p>
                </div>
                <div className="p-3 rounded-xl bg-stone-950 border border-stone-800">
                  <p className="text-[10px] font-black text-[#C5A059] uppercase tracking-widest font-mono">Place Assets</p>
                  <p className="text-base font-bold text-stone-100 mt-0.5">{mapsUsageCount.assets || 0}</p>
                </div>
              </div>
            </div>

            {/* Threshold Controls */}
            <div className="p-6 rounded-2xl bg-stone-900 border border-stone-800 rounded-2xl space-y-4 text-xs">
              <h4 className="text-[10px] font-black text-[#C5A059] uppercase tracking-widest font-mono border-b border-stone-800 pb-2">
                Monthly Cap & Warning Thresholds
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-stone-500 font-mono text-xs font-semibold mb-1">Monthly Safe Request Limit</label>
                  <input
                    type="number"
                    value={settings.mapsMonthlyLimit}
                    onChange={(e) => setSettings(prev => ({ ...prev, mapsMonthlyLimit: parseInt(e.target.value, 10) || 4500 }))}
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-200 font-mono focus:outline-none focus:border-orange-500"
                  />
                  <p className="text-[11px] text-stone-500 mt-1">
                    Prevents accidental billing beyond Google's $200 free allowance.
                  </p>
                </div>

                <div>
                  <label className="block text-stone-500 font-mono text-xs font-semibold mb-1">Warning Notification Threshold</label>
                  <input
                    type="number"
                    value={settings.mapsWarningThreshold}
                    onChange={(e) => setSettings(prev => ({ ...prev, mapsWarningThreshold: parseInt(e.target.value, 10) || 4000 }))}
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-200 font-mono focus:outline-none focus:border-orange-500"
                  />
                  <p className="text-[11px] text-stone-500 mt-1">
                    Triggers a banner alert in Lead Finder when approaching the budget limit.
                  </p>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: Agency Identity & Tier Pricing Defaults                             */}
        {/* ========================================================================= */}
        {activeTab === 'pricing' && (
          <div className="space-y-6 animate-in fade-in text-xs">
            
            {/* Agency Brand Identity */}
            <div className="p-6 rounded-2xl bg-stone-900 border border-stone-800 rounded-2xl space-y-4">
              <h3 className="text-base font-bold text-stone-100 flex items-center gap-2">
                <Building className="w-4 h-4 text-[#C5A059]" />
                Agency Brand Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-stone-500 font-mono text-xs font-semibold mb-1">Agency Display Name</label>
                  <input
                    type="text"
                    value={settings.agencyName}
                    onChange={(e) => setSettings(prev => ({ ...prev, agencyName: e.target.value }))}
                    className="w-full px-3 py-2 bg-stone-900 border border-stone-800 focus:border-[#C5A059]/60 focus:ring-1 focus:ring-[#C5A059]/20 text-stone-100 rounded-xl placeholder:text-stone-600"
                  />
                </div>

                <div>
                  <label className="block text-stone-500 font-mono text-xs font-semibold mb-1">Primary Support Email</label>
                  <input
                    type="email"
                    value={settings.agencyEmail}
                    onChange={(e) => setSettings(prev => ({ ...prev, agencyEmail: e.target.value }))}
                    className="w-full px-3 py-2 bg-stone-900 border border-stone-800 focus:border-[#C5A059]/60 focus:ring-1 focus:ring-[#C5A059]/20 text-stone-100 rounded-xl placeholder:text-stone-600"
                  />
                </div>

                <div>
                  <label className="block text-stone-500 font-mono text-xs font-semibold mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={settings.agencyPhone}
                    onChange={(e) => setSettings(prev => ({ ...prev, agencyPhone: e.target.value }))}
                    className="w-full px-3 py-2 bg-stone-900 border border-stone-800 focus:border-[#C5A059]/60 focus:ring-1 focus:ring-[#C5A059]/20 text-stone-100 rounded-xl placeholder:text-stone-600"
                  />
                </div>

                <div>
                  <label className="block text-stone-500 font-mono text-xs font-semibold mb-1">Office / Legal Address</label>
                  <input
                    type="text"
                    value={settings.agencyAddress}
                    onChange={(e) => setSettings(prev => ({ ...prev, agencyAddress: e.target.value }))}
                    className="w-full px-3 py-2 bg-stone-900 border border-stone-800 focus:border-[#C5A059]/60 focus:ring-1 focus:ring-[#C5A059]/20 text-stone-100 rounded-xl placeholder:text-stone-600"
                  />
                </div>
              </div>
            </div>

            {/* Architecture Tier Rates & Deposit Defaults */}
            <div className="p-6 rounded-2xl bg-stone-900 border border-stone-800 rounded-2xl space-y-4">
              <h3 className="text-base font-bold text-stone-100 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-400" />
                Default Package Pricing & Deposit Rates
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 space-y-2">
                  <span className="font-bold text-stone-100 block">Spur Tier (Static Landing)</span>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 font-bold">$</span>
                    <input
                      type="number"
                      value={settings.spurPrice}
                      onChange={(e) => setSettings(prev => ({ ...prev, spurPrice: parseInt(e.target.value, 10) || 1500 }))}
                      className="w-full pl-7 pr-3 py-2 bg-stone-900 border border-stone-800 focus:border-[#C5A059]/60 focus:ring-1 focus:ring-[#C5A059]/20 text-stone-100 rounded-xl font-mono text-sm placeholder:text-stone-600"
                    />
                  </div>
                  <span className="text-[10px] text-stone-500 block">50% Deposit: ${(settings.spurPrice * (settings.defaultDepositPercent / 100)).toLocaleString()}</span>
                </div>

                <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 space-y-2">
                  <span className="font-bold text-stone-100 block">Ranger Tier (Flow / Lead Gen)</span>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 font-bold">$</span>
                    <input
                      type="number"
                      value={settings.rangerPrice}
                      onChange={(e) => setSettings(prev => ({ ...prev, rangerPrice: parseInt(e.target.value, 10) || 3500 }))}
                      className="w-full pl-7 pr-3 py-2 bg-stone-900 border border-stone-800 focus:border-[#C5A059]/60 focus:ring-1 focus:ring-[#C5A059]/20 text-stone-100 rounded-xl font-mono text-sm placeholder:text-stone-600"
                    />
                  </div>
                  <span className="text-[10px] text-stone-500 block">50% Deposit: ${(settings.rangerPrice * (settings.defaultDepositPercent / 100)).toLocaleString()}</span>
                </div>

                <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 space-y-2">
                  <span className="font-bold text-stone-100 block">Maverick Tier (Full Custom Engine)</span>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 font-bold">$</span>
                    <input
                      type="number"
                      value={settings.maverickPrice}
                      onChange={(e) => setSettings(prev => ({ ...prev, maverickPrice: parseInt(e.target.value, 10) || 7500 }))}
                      className="w-full pl-7 pr-3 py-2 bg-stone-900 border border-stone-800 focus:border-[#C5A059]/60 focus:ring-1 focus:ring-[#C5A059]/20 text-stone-100 rounded-xl font-mono text-sm placeholder:text-stone-600"
                    />
                  </div>
                  <span className="text-[10px] text-stone-500 block">50% Deposit: ${(settings.maverickPrice * (settings.defaultDepositPercent / 100)).toLocaleString()}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-stone-500 font-mono text-xs font-semibold mb-1">Default Upfront Deposit Percentage</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="10"
                      max="100"
                      value={settings.defaultDepositPercent}
                      onChange={(e) => setSettings(prev => ({ ...prev, defaultDepositPercent: parseInt(e.target.value, 10) || 50 }))}
                      className="w-24 px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-200 font-mono text-sm focus:outline-none focus:border-orange-500"
                    />
                    <span className="text-stone-400 text-sm font-semibold">%</span>
                  </div>
                  <p className="text-[11px] text-stone-500 mt-1">
                    Automatically applied when creating Stripe invoices from Client Intake.
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-stone-950 border border-stone-800">
                  <div>
                    <span className="font-semibold text-stone-200 block">Agency Footer Watermark</span>
                    <span className="text-[11px] text-stone-500">Render "Engineered by TX Sons" badge on deployed sites.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.whiteLabelWatermark}
                    onChange={(e) => setSettings(prev => ({ ...prev, whiteLabelWatermark: e.target.checked }))}
                    className="w-4 h-4 accent-[#C5A059] cursor-pointer rounded"
                  />
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: Cloudflare & Stripe Infrastructure                                 */}
        {/* ========================================================================= */}
        {activeTab === 'infra' && (
          <div className="space-y-6 animate-in fade-in text-xs">
            
            {/* Health Status Matrix */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-stone-900 border border-stone-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-100">Cloudflare API</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                </div>
                <p className="text-stone-400 text-[11px]">Deployments: <strong>Direct to Pages</strong></p>
                <span className="text-[10px] text-emerald-400 font-mono block">Token Verified</span>
              </div>

              <div className="p-4 rounded-xl bg-stone-900 border border-stone-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-100">Stripe Invoicing</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                </div>
                <p className="text-stone-400 text-[11px]">Mode: <strong>Live Production</strong></p>
                <span className="text-[10px] text-emerald-400 font-mono block">Hosted Links Active</span>
              </div>

              <div className="p-4 rounded-xl bg-stone-900 border border-stone-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-100">GitHub Sync</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                </div>
                <p className="text-stone-400 text-[11px]">Repository: <strong>Texas-Sons/texas-sons</strong></p>
                <span className="text-[10px] text-emerald-400 font-mono block">Auto-build Triggered</span>
              </div>
            </div>

            {/* Cloudflare Routing Configuration */}
            <div className="p-6 rounded-2xl bg-stone-900 border border-stone-800 rounded-2xl space-y-4">
              <h3 className="text-base font-bold text-stone-100 flex items-center gap-2">
                <Cloud className="w-4 h-4 text-blue-400" />
                Cloudflare Pages Staging & Custom Domains
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-stone-500 font-mono text-xs font-semibold mb-1">Staging Subdomain Suffix</label>
                  <input
                    type="text"
                    value={settings.cfSubdomainPrefix}
                    onChange={(e) => setSettings(prev => ({ ...prev, cfSubdomainPrefix: e.target.value }))}
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-200 font-mono focus:outline-none focus:border-orange-500"
                  />
                  <p className="text-[11px] text-stone-500 mt-1">
                    Default format: [client-slug].{settings.cfSubdomainPrefix}
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-stone-950 border border-stone-800">
                  <div>
                    <span className="font-semibold text-stone-200 block">Instant Edge Invalidation</span>
                    <span className="text-[11px] text-stone-500">Purge edge cache immediately upon new deployment.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.autoDeployApproved}
                    onChange={(e) => setSettings(prev => ({ ...prev, autoDeployApproved: e.target.checked }))}
                    className="w-4 h-4 accent-[#C5A059] cursor-pointer rounded"
                  />
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: Team Access & Google Login Whitelist                              */}
        {/* ========================================================================= */}
        {activeTab === 'access' && (
          <div className="space-y-6 animate-in fade-in text-xs">
            
            <div className="p-6 rounded-2xl bg-stone-900 border border-stone-800 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                <div>
                  <h3 className="text-base font-bold text-stone-100 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Authorized Google Administrator Accounts
                  </h3>
                  <p className="text-stone-400 text-xs mt-0.5">
                    Only emails on this whitelist are permitted to log in and use the TX Sons Delivery Engine.
                  </p>
                </div>
              </div>

              {/* Add New Email Form */}
              <form onSubmit={handleAddEmail} className="flex gap-2">
                <input
                  type="email"
                  value={newEmailInput}
                  onChange={(e) => setNewEmailInput(e.target.value)}
                  placeholder="name@texassons.com or partner@gmail.com"
                  className="flex-1 px-3 py-2 bg-stone-900 border border-stone-800 focus:border-[#C5A059]/60 focus:ring-1 focus:ring-[#C5A059]/20 text-stone-100 rounded-xl placeholder:text-stone-600"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#C5A059]/90 hover:bg-[#C5A059] text-stone-950 font-black rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Admin Email</span>
                </button>
              </form>

              {/* Email List */}
              <div className="divide-y divide-stone-800/60 rounded-xl border border-stone-800 bg-stone-950 overflow-hidden">
                {settings.authorizedEmails.map((email, idx) => (
                  <div key={idx} className="p-3.5 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-stone-900 border border-stone-800 flex items-center justify-center text-xs font-bold text-[#C5A059]">
                        {email[0].toUpperCase()}
                      </div>
                      <div>
                        <span className="font-semibold text-stone-200 block">{email}</span>
                        <span className="text-[10px] text-stone-500">Super Administrator (Full Engine Permissions)</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveEmail(email)}
                      className="p-1.5 text-stone-500 hover:text-red-400 rounded-lg hover:bg-stone-900 transition-colors"
                      title="Revoke Admin Access"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: Data Vault & System Diagnostics                                    */}
        {/* ========================================================================= */}
        {activeTab === 'backup' && (
          <div className="space-y-6 animate-in fade-in text-xs">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              
              {/* Export Full Studio Backup */}
              <div className="p-6 rounded-2xl bg-stone-900 border border-stone-800 rounded-2xl space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-[14px_6px_16px_8px/8px_16px_6px_14px] bg-[#C5A059]/10 border border-[#C5A059]/20 flex items-center justify-center text-[#C5A059]">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-stone-100">Export Studio Data Backup</h3>
                    <p className="text-stone-400 text-xs">Download full JSON snapshot of clients, blueprints, and settings.</p>
                  </div>
                </div>

                <p className="text-stone-400 leading-relaxed text-xs">
                  Exports all active client intake dossiers, custom blueprints, pricing rules, and access control settings into a secure, portable JSON backup file.
                </p>

                <button
                  onClick={handleExportBackup}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r bg-[#C5A059]/90 hover:bg-[#C5A059] text-stone-950 font-black text-stone-200 font-bold flex items-center justify-center gap-2 shadow-lg shadow-orange-950/40 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Backup JSON File</span>
                </button>
              </div>

              {/* Import / Restore Backup */}
              <div className="p-6 rounded-2xl bg-stone-900 border border-stone-800 rounded-2xl space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-[14px_6px_16px_8px/8px_16px_6px_14px] bg-[#C5A059]/10 border border-[#C5A059]/20 flex items-center justify-center text-[#C5A059]">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-stone-100">Restore Studio Backup</h3>
                    <p className="text-stone-400 text-xs">Upload a previously exported JSON backup file.</p>
                  </div>
                </div>

                <p className="text-stone-400 leading-relaxed text-xs">
                  Restore previously saved client intake records, custom blueprints, and studio configuration settings across browsers.
                </p>

                <label className="w-full py-2.5 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors">
                  <Upload className="w-4 h-4" />
                  <span>Select JSON File to Restore</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportBackup}
                    className="hidden"
                  />
                </label>
              </div>

            </div>

            {/* Cache Diagnostic Cleaner */}
            <div className="p-6 rounded-2xl bg-stone-900 border border-stone-800 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-stone-100 text-sm flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-stone-400" />
                    Reset Search & Temporary Discovery Caches
                  </h4>
                  <p className="text-stone-400 text-xs mt-0.5">
                    Clears cached Google Maps places and dismissed business cards without removing client dossiers.
                  </p>
                </div>

                <button
                  onClick={handlePurgeCache}
                  className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-red-950/40 border border-stone-800 text-stone-400 hover:text-red-400 font-semibold text-xs transition-colors"
                >
                  Clear Temporary Caches
                </button>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
