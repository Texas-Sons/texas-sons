import React, { useState, useEffect } from 'react';
import { Plus, Filter, Play, Code2, ArrowRight, Zap, Calendar, Users, MapPin, Wrench, Scissors, ChevronLeft, ChevronRight, Monitor, Smartphone, X, Vote, Flag, Heart, Settings, Loader2 } from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Scissors, Calendar, Users, Zap, MapPin, Wrench, ArrowRight, Vote, Flag, Heart,
};

interface TemplateVersion {
  id: string;
  name: string;
  style: string;
  desktopHtml: string;
  mobileHtml: string;
  thumbnail: string;
}

interface Template {
  id: string;
  title: string;
  category: string;
  industryTags: string[];
  features: { icon: string; label: string }[];
  versions: TemplateVersion[];
  defaultTokens?: Record<string, string>;
}

function TemplateCard({ template }: { template: Template; key?: React.Key }) {
  const [activeVersionIdx, setActiveVersionIdx] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [isBuilding, setIsBuilding] = useState(false);
  const activeVersion = template.versions[activeVersionIdx] || template.versions[0];
  const hasMultipleVersions = template.versions.length > 1;
  const hasMobile = !!activeVersion?.mobileHtml;
  const hasLivePreview = !!activeVersion?.desktopHtml;

  const handleUse = async () => {
    try {
      setIsBuilding(true);
      const res = await fetch('/api/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: template.id,
          versionId: activeVersion.id,
          configOverrides: {}
        })
      });

      if (!res.ok) throw new Error('Generation failed');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${template.id}-${activeVersion.id}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert("Failed to compile template!");
      console.error(error);
    } finally {
      setIsBuilding(false);
    }
  };

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
            {(template.features || []).map((feature, idx) => {
              const Icon = ICON_MAP[feature.icon] || Settings;
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
            <button
              onClick={handleUse}
              disabled={isBuilding}
              className="flex flex-col items-center justify-center gap-1.5 py-2 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 transition-colors disabled:opacity-50"
            >
              {isBuilding ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
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
              Live HTML Preview · {previewDevice === 'mobile' ? 'Mobile' : 'Desktop'}
            </span>
            <button
              onClick={handleUse}
              disabled={isBuilding}
              className="px-5 py-2 rounded-lg text-sm font-medium bg-orange-600 hover:bg-orange-500 text-white transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isBuilding ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              Use This Version
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default function TemplatesView() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/templates');
        const data = await res.json();
        if (data.success) setTemplates(data.templates);
        else setError(data.error || 'Failed to load templates');
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Failed to load templates');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

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

      {loading && (
        <div className="flex items-center justify-center py-24 text-stone-500">
          <Loader2 className="w-6 h-6 animate-spin text-orange-500 mr-3" />
          Loading templates...
        </div>
      )}

      {error && (
        <div className="border border-red-900/50 bg-red-950/30 rounded-xl p-6 text-red-400 text-sm">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {templates.map((template) => (
            <TemplateCard key={template.id} template={template} />
          ))}
        </div>
      )}
    </div>
  );
}