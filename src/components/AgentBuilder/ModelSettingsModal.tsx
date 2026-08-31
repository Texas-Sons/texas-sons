import React from 'react';
import { X, Zap, Cpu, Sparkles, CheckCircle2, RotateCcw, DollarSign, Activity, ShieldCheck, HelpCircle } from 'lucide-react';
import { SUPPORTED_MODELS, ModelInfo, SessionUsageStats, resetSessionUsage } from './aiModelConfig';

interface ModelSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  usageStats: SessionUsageStats;
  onResetUsage: () => void;
}

export const ModelSettingsModal: React.FC<ModelSettingsModalProps> = ({
  isOpen,
  onClose,
  selectedModel,
  onSelectModel,
  usageStats,
  onResetUsage,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-8">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-stone-800 flex items-center justify-between bg-stone-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-600/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">AI Engine & Cost Controls</h3>
              <p className="text-xs text-stone-400">Select model for intake, code generation & QA reviews</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
          
          {/* Real-time Usage & Spend Ticker Card */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950 border border-stone-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-stone-300 uppercase tracking-wider">Active Session Spend</span>
              </div>
              <div className="text-2xl font-extrabold text-white flex items-baseline gap-2 font-mono">
                ${usageStats.estimatedCostUsd.toFixed(4)}
                <span className="text-xs font-normal text-stone-400">USD</span>
              </div>
              <p className="text-[11px] text-stone-500">
                {usageStats.totalCalls} total calls · {((usageStats.promptTokens + usageStats.outputTokens) / 1000).toFixed(1)}k tokens processed
              </p>
            </div>

            <button
              onClick={onResetUsage}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white border border-stone-700 flex items-center gap-1.5 transition-all shadow-sm self-end sm:self-center"
              title="Reset session counter to $0.00"
            >
              <RotateCcw className="w-3.5 h-3.5 text-stone-400" />
              <span>Reset Counter</span>
            </button>
          </div>

          {/* Model Cards Grid */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center justify-between">
              <span>Available Model Engines</span>
              <span className="text-[10px] text-stone-500 font-normal">Click to set active engine</span>
            </div>

            {SUPPORTED_MODELS.map((m) => {
              const isSelected = selectedModel === m.id;
              return (
                <div
                  key={m.id}
                  onClick={() => onSelectModel(m.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-stone-800/90 border-orange-500/80 ring-1 ring-orange-500/40 shadow-lg'
                      : 'bg-stone-950/60 border-stone-800 hover:border-stone-700 hover:bg-stone-900/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                        isSelected ? 'border-orange-500 bg-orange-500' : 'border-stone-600'
                      }`}>
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <span className="font-bold text-sm text-white">{m.name}</span>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                        m.tier === 'free' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        m.tier === 'ultra-low' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                        m.tier === 'premium' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                        'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {m.badge}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-stone-200">{m.costPerTaskEst}</span>
                      <span className="text-[10px] text-stone-500 block font-mono">~{m.speed}</span>
                    </div>
                  </div>

                  <p className="text-xs text-stone-400 mb-2.5">{m.tagline}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 border-t border-stone-800/60 text-[11px]">
                    <div>
                      <span className="font-bold text-stone-300 flex items-center gap-1 mb-1">
                        <Zap className="w-3 h-3 text-orange-400" /> Best For Intake & Logic:
                      </span>
                      <ul className="space-y-0.5 text-stone-400 pl-4 list-disc">
                        {m.bestFor.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-stone-900/60 p-2 rounded-lg border border-stone-800/40">
                      <span className="font-bold text-stone-300 flex items-center gap-1 mb-0.5">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" /> QA & Critic Role:
                      </span>
                      <p className="text-stone-400 leading-tight text-[11px]">{m.qaBestFor}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-stone-800 bg-stone-950/80 flex items-center justify-between">
          <span className="text-xs text-stone-400 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-stone-500" />
            Selection is saved to your browser session.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white transition-all shadow-md shadow-orange-600/30"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
