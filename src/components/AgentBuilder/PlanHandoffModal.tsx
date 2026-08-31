import React, { useState } from 'react';
import { X, Copy, Check, Terminal, FileCode, Sparkles, ArrowRight, Layers, ShieldCheck } from 'lucide-react';
import type { ProjectSnapshot } from './AgentBuilderStudio';

interface PlanHandoffModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectSnapshot;
  selectedModel: string;
}

export const PlanHandoffModal: React.FC<PlanHandoffModalProps> = ({
  isOpen,
  onClose,
  project,
  selectedModel,
}) => {
  const [copied, setCopied] = useState(false);
  const [viewFormat, setViewFormat] = useState<'markdown' | 'json'>('markdown');

  if (!isOpen) return null;

  const markdownPlan = `# Texas Sons Master Experience Spec for Antigravity
**Generated via:** ${selectedModel.toUpperCase()}
**Client/Candidate:** ${project.profile.name}
**Theme System:** ${project.theme} (${project.profile.category})
**Accent Color:** ${project.profile.accentColor || '#C5A059'}

---

## 1. Executive Brand Identity & Vision
- **Official Name:** ${project.profile.name}
- **Authoritative Tagline:** ${project.profile.tagline || project.profile.name}
- **Authentic Narrative:** ${project.profile.description}
- **Contact Details:** ${project.profile.phone} | ${project.profile.email || 'N/A'} | ${project.profile.address || 'N/A'}
- **Operating / Volunteer Hours:** ${project.profile.hours || 'N/A'}
- **Proof Pill Badge:** ${project.proofBadgeText || 'Official 2026 Endorsements'}
- **Authority Badges:** ${(project.badges || []).map(b => `"${b}"`).join(', ')}

---

## 2. Core Pillars & Services (${project.services.length} Items)
${project.services.map((s, idx) => `### Pillar #${idx + 1}: ${s.title}
- **Category/Duration:** ${s.duration || 'Pillar'}
- **Highlight:** ${s.highlight ? 'YES (Hero Feature)' : 'Standard'}
- **Scope & Plan:** ${s.description}
${s.price ? `- **Pricing:** ${s.price}` : ''}
`).join('\n')}

---

## 3. Verified Endorsements / Testimonials (${project.testimonials.length} Items)
${project.testimonials.map((t, idx) => `### Item #${idx + 1} (${t.author} - ${t.role || 'Verified Endorsement'})
> "${t.quote}"
- Rating: ${t.rating || 5} Stars | Verified: ${t.verified ? 'YES' : 'Standard'}
`).join('\n')}

---

## 4. Antigravity Full-Stack Execution Directives
1. **Component Scaffolding:** Ensure \`NavbarBlock\`, \`CampaignHeroBlock\`, \`ServicesBlock\`, \`TestimonialsBlock\`, and \`BookingBlock\` are fully populated with these exact strings.
2. **Sub-Route Setup:** If campaign, wire \`#voting\` hash route to \`VotingPageBlock\` and display \`VotingBannerBlock\` beneath the Hero.
3. **Responsive Container Verification:** Use auto-fit minmax grids (\`minmax(280px,1fr)\`) to prevent mobile & tablet frame squishing.
4. **Database Injection:** Upsert this experience into the Supabase \`projects\` table for immediate live sync.
5. **Type Safety Test:** Run \`npx tsc --noEmit\` and ensure 0 compilation errors before committing.
`;

  const rawJson = JSON.stringify(project, null, 2);

  const textToCopy = viewFormat === 'markdown' ? markdownPlan : rawJson;

  const handleCopy = () => {
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl my-8 flex flex-col max-h-[85vh]">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-stone-800 flex items-center justify-between bg-stone-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Antigravity Master Experience Spec</h3>
              <p className="text-xs text-stone-400">Handoff spec for Antigravity Autonomous Code Execution</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Workflow Explainer Banner */}
        <div className="px-5 py-3 bg-stone-950 border-b border-stone-800/80 flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2 text-stone-300">
            <Sparkles className="w-4 h-4 text-orange-400 flex-shrink-0" />
            <span><strong>Workflow Split:</strong> Copy this plan and paste it directly into Antigravity to build the components.</span>
          </div>

          <div className="flex items-center bg-stone-800 rounded-lg p-0.5 border border-stone-700">
            <button
              onClick={() => setViewFormat('markdown')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                viewFormat === 'markdown' ? 'bg-orange-600 text-white shadow-sm' : 'text-stone-400 hover:text-white'
              }`}
            >
              Plan Spec
            </button>
            <button
              onClick={() => setViewFormat('json')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                viewFormat === 'json' ? 'bg-orange-600 text-white shadow-sm' : 'text-stone-400 hover:text-white'
              }`}
            >
              Raw JSON
            </button>
          </div>
        </div>

        {/* Code Content View */}
        <div className="p-5 flex-1 overflow-y-auto bg-stone-950/90 font-mono text-xs text-stone-300">
          <pre className="whitespace-pre-wrap leading-relaxed select-all">
            {textToCopy}
          </pre>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-stone-800 bg-stone-950/80 flex items-center justify-between gap-4">
          <span className="text-xs text-stone-400 hidden sm:inline">
            Includes all copy, pillars, testimonials, and execution directives.
          </span>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors"
            >
              Close
            </button>

            <button
              onClick={handleCopy}
              className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg transition-all ${
                copied 
                  ? 'bg-emerald-600 text-white ring-2 ring-emerald-400' 
                  : 'bg-orange-600 hover:bg-orange-500 text-white hover:scale-105 shadow-orange-600/30'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Master Plan for Antigravity</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
