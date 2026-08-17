import React, { useState } from 'react';
import { Plus, Filter, Play, Code2, ArrowRight, Zap, Calendar, Users, MapPin, Wrench, Scissors, ChevronLeft, ChevronRight, Monitor, Smartphone, X, Vote, Flag, Heart, Settings } from 'lucide-react';

interface TemplateVersion {
  id: string;
  name: string;
  style: string;
  desktopHtml: string;
  mobileHtml: string;
  thumbnail: string;
  stitchDesktopId?: string;
  stitchMobileId?: string;
}

interface Template {
  id: string;
  title: string;
  category: string;
  features: { icon: React.ComponentType<any>; label: string }[];
  versions: TemplateVersion[];
}

const TEMPLATES: Template[] = [
  {
    id: 'universal-admin',
    title: 'Universal Admin Dashboard',
    category: 'Admin / CMS',
    features: [
      { icon: Settings, label: 'Basic Info Updates' },
      { icon: Calendar, label: 'Event Management' },
      { icon: Users, label: 'Volunteers & RSVPs' },
      { icon: Zap, label: 'Square Price Sync' },
    ],
    versions: [
      {
        id: 'v1',
        name: 'Default',
        style: 'Clean UI',
        desktopHtml: '/templates/admin/universal-admin.html',
        mobileHtml: '',
        thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800',
      }
    ],
  },
  {
    id: 'salon',
    title: 'Glow & Style Studio',
    category: 'Salon / Spa',
    features: [
      { icon: Calendar, label: 'Booking Calendar Wire' },
      { icon: Users, label: 'Staff Roster Section' },
      { icon: Scissors, label: '3 Design Variations' },
    ],
    versions: [
      {
        id: 'v1',
        name: 'Midnight Luxe',
        style: 'Dark & Gold',
        desktopHtml: '/templates/salon/v1-desktop.html',
        mobileHtml: '/templates/salon/v1-mobile.html',
        thumbnail: 'https://lh3.googleusercontent.com/aida/AP1WRLv4OCYlZbzoOpe7fxoaYHTEDRgW9VsjZDLDvz3AHR5U2pzrLLmTdAHjM1hH6wGo7PqdeMV78C9Q5Fm3nfhcqDla5U8gp_CGN-AJwYz3eLRu4irdlzuibfOLbbNjZlhL33swLAPexXTcSqwEuEikKuL4WvW_BwyRSnwiNS_7or2H0sq40kqhrdNkPVht3t2uKtxbZjoovMK_XKVPO0n6DqtdMlar_XCgf_6Jr84hYzDQBAMTIAhdvp3mzmKe',
      },
      {
        id: 'v2',
        name: 'Pure Minimalist',
        style: 'Clean & Modern',
        desktopHtml: '/templates/salon/v2-desktop.html',
        mobileHtml: '/templates/salon/v2-mobile.html',
        thumbnail: 'https://lh3.googleusercontent.com/aida/AP1WRLuRYsvuZ_GD6uIKfMFvx9_ZcqQ3MIT6jZzNDDMaRDW_plAPFtbGbmSs1oW-zulAg78NofGqpVY_UB-OvGOwYmNndDvsn3dkMzR9K9rKiYGzfOe5lpo3VPMVDhDFWIHH4OgC6t-yM5eT36ntXGQ3937A8rSWs-zFxpy_HGdb_30EGHtuuH_yKIEoPO3IR0ZKkSLvnl1S1-vRYTAWB73UrRR7ErOrbN7lOhbSJ-_Pui11TdPsX_o6b8N8u7wZ',
        stitchDesktopId: '5c6779ac1f1745f8856082ba359ffebe',
        stitchMobileId: '987591a4228f4fc3a25f7bcb3f015d3a',
      },
      {
        id: 'v3',
        name: 'Prismatic Glow',
        style: 'Bold & Vibrant',
        desktopHtml: '/templates/salon/v3-desktop.html',
        mobileHtml: '/templates/salon/v3-mobile.html',
        thumbnail: 'https://lh3.googleusercontent.com/aida/AP1WRLthHlPM9u-aqvRUnNmVNX4b9fMxPg8E8aVusfNuVIsDNRBx9l1ZQWo10ZcVAtjgUkNv3-G9x4xtu9Hz3ZxQWjHgSPIPyC4JDLgGKLuipndG0dizhLwkdiaNgRDfB56gxZ8k0I4aZ4MtNHW84_ICdDqH-doz5AtWgsAte5cU_n1Y-AKpTRC5EAFrSV7Oiu6TVRDYWdugUYrJfCfRtXZudH_OestlaOv8EEQNrDj4aB4oZnIgG4NdZzYZGfP3',
      },
    ],
  },
  {
    id: 'restaurant',
    title: 'Bistro & Bar Pro',
    category: 'Restaurant',
    features: [
      { icon: Zap, label: 'Swift KDS Menu Wire' },
      { icon: ArrowRight, label: 'Order Online Ready' },
    ],
    versions: [
      {
        id: 'v1',
        name: 'Default',
        style: 'Classic',
        desktopHtml: '',
        mobileHtml: '',
        thumbnail: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800',
      },
    ],
  },
  {
    id: 'contractor',
    title: 'Pro Contractor Blueprint',
    category: 'Home Services',
    features: [
      { icon: MapPin, label: 'Service Area Maps' },
      { icon: Wrench, label: 'Estimate Request Flow' },
    ],
    versions: [
      {
        id: 'v1',
        name: 'Default',
        style: 'Classic',
        desktopHtml: '',
        mobileHtml: '',
        thumbnail: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&q=80&w=800',
      },
    ],
  },
  {
    id: 'campaign',
    title: 'Campaign Blueprint',
    category: 'Political Campaign',
    features: [
      { icon: Vote, label: 'Candidate Bio & Platform' },
      { icon: Calendar, label: 'Events Calendar' },
      { icon: Flag, label: '3 Design Variations' },
      { icon: Heart, label: 'Donation CTA Ready' },
    ],
    versions: [
      {
        id: 'v1',
        name: 'Classic Authority',
        style: 'Navy & Gold',
        desktopHtml: '/templates/campaign/v1-classic-desktop.html',
        mobileHtml: '/templates/campaign/home-mobile.html',
        thumbnail: 'https://lh3.googleusercontent.com/aida/AP1WRLtQFvTTqImiOHA-TJ4Lggnn93KgC0pX72VAmSSzvQvtSNGwznfZTJw8Ngh3JvEj48075CWDLVG9EO7nu3TyvxI--GaUYXi2uaDdtyKq7K2JkVz7iuwutTf1wCBQxAHjmTgMtoY1Ya73XxbbiMXb_xwvNOu1F53FyXTSppg-TB0xkEk-H5dwBtLUM8o4Y4zIOsJOQIGD6M_ZTTssK2eXtblDNojkdYWzdQFB_6qA3UTetoUrZJM-y_uINS8',
      },
      {
        id: 'v2',
        name: 'Modern Progressive',
        style: 'Blue & Teal',
        desktopHtml: '/templates/campaign/v2-modern-desktop.html',
        mobileHtml: '',
        thumbnail: 'https://lh3.googleusercontent.com/aida/AP1WRLsKbwojcgNzRwq8cdMDYsWUDYHAHDQgkZ--bRY5lnja9qu6aRIfb0bgn8_Q9gPqkmvco7sbbUGEJQeCT0MF5kVal1MAE26ibeltlK4M1ny3pqnUwPqnqxEPUVtP6HUxto2__EAYf4qHuDWxCMIYE-uZspOFV-VVWapS5MQGL_1JWC1x_p640rQEh76ve1Kkc3KZ9njYvmM_lSSqwdQRVdrKfFKrb8Yma32WBBaGX1OPjF4GRoRllPXNvw',
      },
      {
        id: 'v3',
        name: 'Warm Community',
        style: 'Green & Brown',
        desktopHtml: '/templates/campaign/v3-community-desktop.html',
        mobileHtml: '',
        thumbnail: 'https://lh3.googleusercontent.com/aida/AP1WRLvvkNe8epTOt_NY6kFhpo9zE5GhiRi--nWWptBmOyhJXLKxcWhg3DICr0v_q_bUS9Gp0rJskaCqbzK_E9uETtY1fxkRUTttySlPE7rcofxUn33RTuu3oiutAy_0pPhzwu7zq1dqMC5thTGmxFVgdel4qelSpBK-c78KEnMg6lYgeUXr6qNm0Gy3iBb7MzmwZAmggXq7nsnVz47K5bTkVI3sc61qbblVh0_0fbWqDPXDhdYQRAHXY9z8cIg',
      },
    ],
  },
];

function TemplateCard({ template }: { template: Template; key?: React.Key }) {
  const [activeVersionIdx, setActiveVersionIdx] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const activeVersion = template.versions[activeVersionIdx];
  const hasMultipleVersions = template.versions.length > 1;
  const hasMobile = !!activeVersion.mobileHtml;
  const hasLivePreview = !!activeVersion.desktopHtml;

  return (
    <>
      <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden flex flex-col group transition-all hover:border-stone-700 hover:shadow-2xl hover:shadow-orange-900/10">
        {/* Card Thumbnail */}
        <div className="aspect-video relative overflow-hidden bg-stone-950 cursor-pointer" onClick={() => setPreviewOpen(true)}>
          <img 
            src={activeVersion.thumbnail} 
            alt={`${template.title} - ${activeVersion.name}`}
            className="w-full h-full object-cover object-top opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
          />
          <div className="absolute top-3 left-3 z-10">
            <span className="bg-stone-950/80 backdrop-blur-md border border-stone-700/50 text-stone-200 text-xs px-2.5 py-1 rounded-full font-medium">
              {template.category}
            </span>
          </div>
          <div className="absolute bottom-3 right-3 flex gap-1.5 z-10">
            {hasMultipleVersions && (
              <span className="bg-orange-600/90 backdrop-blur-md text-white text-xs px-2.5 py-1 rounded-full font-bold">
                {template.versions.length} Versions
              </span>
            )}
            {template.versions.some(v => v.mobileHtml) && (
              <span className="bg-blue-600/90 backdrop-blur-md text-white text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1">
                <Smartphone className="w-3 h-3" /> Mobile
              </span>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="p-6 flex-1 flex flex-col">
          <h3 className="text-xl font-bold text-white mb-1">{template.title}</h3>
          
          {/* Version Switcher */}
          {hasMultipleVersions && (
            <div className="mb-4">
              <div className="flex items-center gap-1 mt-2">
                {template.versions.map((v, idx) => (
                  <button
                    key={v.id}
                    onClick={() => setActiveVersionIdx(idx)}
                    className={`flex-1 text-xs py-1.5 px-2 rounded-lg font-medium transition-all ${
                      idx === activeVersionIdx 
                        ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/30' 
                        : 'bg-stone-800 text-stone-400 hover:text-stone-200 hover:bg-stone-700'
                    }`}
                  >
                    {v.name}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-stone-500 mt-1.5 text-center italic">
                {activeVersion.style}
              </p>
            </div>
          )}
          
          <div className="space-y-3 mb-6 flex-1">
            {template.features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div key={idx} className="flex items-center gap-3 text-stone-300">
                  <Icon className="w-4 h-4 text-orange-500" />
                  <span className="text-sm">{feature.label}</span>
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-stone-800">
            <button 
              onClick={() => setPreviewOpen(true)}
              className="flex flex-col items-center justify-center gap-1.5 py-2 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-white transition-colors"
            >
              <Play className="w-4 h-4" />
              <span className="text-xs font-medium">Preview</span>
            </button>
            <button className="flex flex-col items-center justify-center gap-1.5 py-2 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-white transition-colors">
              <Code2 className="w-4 h-4" />
              <span className="text-xs font-medium">Code</span>
            </button>
            <button className="flex flex-col items-center justify-center gap-1.5 py-2 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 transition-colors">
              <ArrowRight className="w-4 h-4" />
              <span className="text-xs font-medium">Use</span>
            </button>
          </div>
        </div>
      </div>

      {/* Full Preview Modal */}
      {previewOpen && (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
          {/* Modal Header */}
          <div className="px-6 py-3 border-b border-stone-800 flex justify-between items-center bg-stone-950 flex-shrink-0">
            <div>
              <h3 className="text-lg font-semibold text-white">{template.title}</h3>
              <p className="text-sm text-stone-400">{activeVersion.name} — {activeVersion.style}</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Device Toggle */}
              <div className="flex items-center bg-stone-800 rounded-lg p-0.5">
                <button
                  onClick={() => setPreviewDevice('desktop')}
                  className={`p-1.5 rounded-md transition-all ${
                    previewDevice === 'desktop' 
                      ? 'bg-stone-600 text-white' 
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                  title="Desktop view"
                >
                  <Monitor className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPreviewDevice('mobile')}
                  disabled={!hasMobile}
                  className={`p-1.5 rounded-md transition-all ${
                    previewDevice === 'mobile' 
                      ? 'bg-stone-600 text-white' 
                      : 'text-stone-400 hover:text-stone-200 disabled:opacity-30 disabled:cursor-not-allowed'
                  }`}
                  title={hasMobile ? 'Mobile view' : 'No mobile version available'}
                >
                  <Smartphone className="w-4 h-4" />
                </button>
              </div>

              {/* Version Switcher */}
              {hasMultipleVersions && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setActiveVersionIdx(Math.max(0, activeVersionIdx - 1))}
                    disabled={activeVersionIdx === 0}
                    className="p-1.5 rounded-lg bg-stone-800 text-stone-400 hover:text-white disabled:opacity-30 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {template.versions.map((v, idx) => (
                    <button
                      key={v.id}
                      onClick={() => setActiveVersionIdx(idx)}
                      className={`text-xs py-1.5 px-3 rounded-lg font-medium transition-all ${
                        idx === activeVersionIdx 
                          ? 'bg-orange-600 text-white' 
                          : 'bg-stone-800 text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      {v.name}
                    </button>
                  ))}
                  <button
                    onClick={() => setActiveVersionIdx(Math.min(template.versions.length - 1, activeVersionIdx + 1))}
                    disabled={activeVersionIdx === template.versions.length - 1}
                    className="p-1.5 rounded-lg bg-stone-800 text-stone-400 hover:text-white disabled:opacity-30 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
              <button 
                onClick={() => setPreviewOpen(false)}
                className="p-2 rounded-lg bg-stone-800 text-stone-400 hover:text-white hover:bg-stone-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Modal Body — Live iframe preview */}
          <div className="flex-1 flex items-start justify-center overflow-hidden bg-stone-950">
            {hasLivePreview ? (
              previewDevice === 'mobile' && hasMobile ? (
                <div className="flex items-center justify-center h-full py-6">
                  <div className="w-[390px] h-[calc(100vh-120px)] border-[8px] border-stone-700 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-black/50 bg-white">
                    <iframe
                      key={`${activeVersion.id}-mobile`}
                      src={activeVersion.mobileHtml}
                      title={`${template.title} - ${activeVersion.name} (Mobile)`}
                      className="w-full h-full border-0"
                      sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                    />
                  </div>
                </div>
              ) : (
                <iframe
                  key={`${activeVersion.id}-desktop`}
                  src={activeVersion.desktopHtml}
                  title={`${template.title} - ${activeVersion.name}`}
                  className="w-full h-full border-0 bg-white"
                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                />
              )
            ) : (
              <div className="flex items-center justify-center h-full text-stone-500">
                <p>No live preview available for this template.</p>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-3 border-t border-stone-800 bg-stone-950 flex justify-between items-center flex-shrink-0">
            <span className="text-xs text-stone-500">
              Live HTML Preview · {previewDevice === 'mobile' ? 'Mobile' : 'Desktop'} · Stitch Project: Opalescent Color Studio
            </span>
            <button className="px-5 py-2 rounded-lg text-sm font-medium bg-orange-600 hover:bg-orange-500 text-white transition-colors flex items-center gap-2">
              <ArrowRight className="w-4 h-4" />
              Use This Version
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default function TemplatesView() {
  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Core Templates</h1>
          <p className="text-stone-400 mt-1">Manage and deploy your baseline starter kits.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-stone-900 border border-stone-800 hover:border-stone-700 text-white px-4 py-2.5 rounded-xl transition-colors">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-500 text-white px-4 py-2.5 rounded-xl transition-colors font-medium">
            <Plus className="w-4 h-4" />
            <span>New Template</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {TEMPLATES.map((template) => (
          <TemplateCard key={template.id} template={template} />
        ))}
      </div>
    </div>
  );
}
