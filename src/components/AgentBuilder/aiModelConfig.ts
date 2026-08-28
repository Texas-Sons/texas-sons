export interface ModelInfo {
  id: string;
  name: string;
  badge: string;
  provider: 'Google' | 'DeepSeek' | 'Anthropic' | 'OpenAI';
  costPerTaskEst: string;
  speed: string;
  inputCostPerMillion: number;
  outputCostPerMillion: number;
  tagline: string;
  bestFor: string[];
  qaBestFor: string;
  tier: 'free' | 'ultra-low' | 'low' | 'premium';
}

export const SUPPORTED_MODELS: ModelInfo[] = [
  {
    id: 'gemini-3.6-flash',
    name: 'Gemini 3.6 Flash',
    badge: '⚡ Ultra-Fast',
    provider: 'Google',
    costPerTaskEst: '~$0.001',
    speed: '0.8s',
    inputCostPerMillion: 0.075,
    outputCostPerMillion: 0.30,
    tagline: 'High-speed multimodal workhorse with native 1M token context.',
    bestFor: [
      'Instant flyer & menu photo OCR',
      'PDF resume & document extraction',
      'Fast structural JSON blueprint drafting'
    ],
    qaBestFor: 'Instant 1-second scan for color contrast, missing contact info, broken links, and generic placeholder text.',
    tier: 'ultra-low'
  },
  {
    id: 'deepseek-v3',
    name: 'DeepSeek V3 / R1',
    badge: '🧠 Deep Reasoner',
    provider: 'DeepSeek',
    costPerTaskEst: 'Free / $0.002',
    speed: '1.8s',
    inputCostPerMillion: 0.14,
    outputCostPerMillion: 0.28,
    tagline: 'World-class reasoning engine for exhaustive copy & platform logic.',
    bestFor: [
      'Drafting in-depth campaign policy pillars & judicial platforms',
      'Structuring complex custom sub-routes & bylaws',
      'Zero-loss architectural planning'
    ],
    qaBestFor: 'Deep logical consistency audits, verifying facts against raw transcripts, detecting policy contradictions.',
    tier: 'free'
  },
  {
    id: 'claude-3-7-sonnet',
    name: 'Claude 3.7 Sonnet',
    badge: '🎭 Creative Director',
    provider: 'Anthropic',
    costPerTaskEst: '~$0.030',
    speed: '2.2s',
    inputCostPerMillion: 3.00,
    outputCostPerMillion: 15.00,
    tagline: 'Elite aesthetic judgment and luxury copywriting polish.',
    bestFor: [
      'High-ticket client proposals & luxury branding',
      'Nuanced, bespoke narrative tone of voice',
      'Creative direction & visual hierarchy styling'
    ],
    qaBestFor: 'Deep Creative Audit: visual balance, typography harmony, conversion hook psychology, and executive readiness.',
    tier: 'premium'
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o-mini',
    badge: '🤖 Balanced Fast',
    provider: 'OpenAI',
    costPerTaskEst: '~$0.003',
    speed: '1.2s',
    inputCostPerMillion: 0.15,
    outputCostPerMillion: 0.60,
    tagline: 'Lightweight multimodal generalist for quick structural edits.',
    bestFor: [
      'Quick single-field edits & copy tweaks',
      'General business schema generation'
    ],
    qaBestFor: 'Standard schema validation and contact completeness check.',
    tier: 'low'
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    badge: '🔬 Complex Logic',
    provider: 'Google',
    costPerTaskEst: '~$0.008',
    speed: '2.5s',
    inputCostPerMillion: 1.25,
    outputCostPerMillion: 5.00,
    tagline: 'Dense analytical reasoning and multi-page site architecture.',
    bestFor: [
      'Complex multi-page campaign setups with voting precincts',
      'Extensive document synthesis'
    ],
    qaBestFor: 'Multi-page cross-reference validation and thorough regulatory compliance audits.',
    tier: 'low'
  }
];

export interface SessionUsageStats {
  totalCalls: number;
  promptTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
  lastUpdated: string;
}

const STORAGE_KEY_USAGE = 'txsons_ai_usage';
const STORAGE_KEY_MODEL = 'txsons_selected_model';
const STORAGE_KEY_DAILY = 'txsons_ai_daily';

/** Requests and tokens used today, for the free-tier RPD panel in Settings. */
export interface DailyUsageStats {
  date: string; // YYYY-MM-DD
  requests: number;
  tokens: number;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Reads today's usage, rolling over automatically at the date boundary.
 *
 * Settings needs a genuinely daily number because it renders against
 * `maxDailyRequests` (Gemini's free-tier requests-per-day cap). The cumulative
 * session counter would creep to 100% and stay pinned there, which is why the
 * panel previously fell back to an invented figure instead.
 */
export function getDailyUsage(): DailyUsageStats {
  const fresh: DailyUsageStats = { date: today(), requests: 0, tokens: 0 };
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DAILY);
    if (!raw) return fresh;
    const parsed = JSON.parse(raw) as DailyUsageStats;
    return parsed.date === fresh.date ? parsed : fresh;
  } catch {
    return fresh;
  }
}

function recordDailyUsage(tokens: number): void {
  const current = getDailyUsage();
  const updated: DailyUsageStats = {
    date: current.date,
    requests: current.requests + 1,
    tokens: current.tokens + tokens,
  };
  try {
    localStorage.setItem(STORAGE_KEY_DAILY, JSON.stringify(updated));
  } catch {}
}

export function getStoredModel(): string {
  try {
    return localStorage.getItem(STORAGE_KEY_MODEL) || 'gemini-3.6-flash';
  } catch {
    return 'gemini-3.6-flash';
  }
}

export function setStoredModel(modelId: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_MODEL, modelId);
  } catch {}
}

export function getSessionUsage(): SessionUsageStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USAGE);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    totalCalls: 0,
    promptTokens: 0,
    outputTokens: 0,
    estimatedCostUsd: 0,
    lastUpdated: new Date().toISOString()
  };
}

export function recordUsage(modelId: string, promptTokens: number = 800, outputTokens: number = 400): SessionUsageStats {
  const current = getSessionUsage();
  const model = SUPPORTED_MODELS.find(m => m.id === modelId) || SUPPORTED_MODELS[0];
  
  const callCost = ((promptTokens / 1_000_000) * model.inputCostPerMillion) + 
                   ((outputTokens / 1_000_000) * model.outputCostPerMillion);
  
  const updated: SessionUsageStats = {
    totalCalls: current.totalCalls + 1,
    promptTokens: current.promptTokens + promptTokens,
    outputTokens: current.outputTokens + outputTokens,
    estimatedCostUsd: Number((current.estimatedCostUsd + callCost).toFixed(5)),
    lastUpdated: new Date().toISOString()
  };

  try {
    localStorage.setItem(STORAGE_KEY_USAGE, JSON.stringify(updated));
  } catch {}

  // Keep the daily bucket in step — Settings reads it for the RPD panel.
  recordDailyUsage(promptTokens + outputTokens);

  return updated;
}

export function resetSessionUsage(): SessionUsageStats {
  const empty: SessionUsageStats = {
    totalCalls: 0,
    promptTokens: 0,
    outputTokens: 0,
    estimatedCostUsd: 0,
    lastUpdated: new Date().toISOString()
  };
  try {
    localStorage.setItem(STORAGE_KEY_USAGE, JSON.stringify(empty));
  } catch {}
  return empty;
}
