/**
 * Model router.
 *
 * Every AI call in server.ts used to hardcode Gemini and hand-roll its own
 * fence-stripping and JSON.parse. Changing model meant editing five routes;
 * adding a provider meant duplicating all of it.
 *
 * This routes by *task*, so which model runs a job is configuration rather than
 * code. That matters for cost work: swapping DeepSeek in for one task and
 * measuring it should be a one-line change, and reverting should be too.
 *
 * Providers:
 *   gemini     — via the existing client in server.ts (registered below).
 *                Keeps the retry logic and is the only multimodal path.
 *   openrouter — one key, many models. DeepSeek, Llama, Qwen, and others behind
 *                a single OpenAI-shaped endpoint.
 */

export type TaskName =
  | 'extract-dossier'   // photos -> client dossier (MULTIMODAL — Gemini only)
  | 'extract-services'  // a screenshot of a price list -> services (MULTIMODAL)
  | 'scrape-extract'    // page text -> JSON
  | 'generate-config'   // business profile -> template tokens
  | 'draft-proposal'
  | 'draft-contract'
  | 'studio-edit'       // natural language -> blueprint edit
  | 'draft-outreach'    // cold email to a prospect
  | 'assistant';        // conversational; knows your business context

export interface ModelConfig {
  provider: 'gemini' | 'openrouter';
  model: string;
  /** Why this task is on this model — so a future change is an informed one. */
  why: string;
}

/**
 * Defaults. Override any single task without touching code by setting an env
 * var named MODEL_<TASK>, upper-cased with dashes as underscores:
 *
 *   MODEL_ASSISTANT=openrouter:deepseek/deepseek-chat
 *   MODEL_SCRAPE_EXTRACT=openrouter:deepseek/deepseek-chat
 *   MODEL_DRAFT_PROPOSAL=gemini:gemini-3.6-flash
 *
 * Format is `provider:model`. Provider must be `gemini` or `openrouter`.
 */
const DEFAULT_TASK_MODELS: Record<TaskName, ModelConfig> = {
  'extract-dossier': {
    provider: 'gemini',
    model: 'gemini-3.6-flash',
    why: 'Multimodal. DeepSeek text models cannot read photos at all.',
  },
  'extract-services': {
    provider: 'gemini',
    model: 'gemini-3.6-flash',
    why: 'Multimodal. Reads a screenshot of a booking page or printed price list.',
  },
  'scrape-extract': {
    provider: 'gemini',
    model: 'gemini-3.6-flash',
    why: 'Pure extraction — the obvious first candidate to move to a cheaper model.',
  },
  'generate-config': {
    provider: 'gemini',
    model: 'gemini-3.6-flash',
    why: 'Structured fill. Quality matters some; measure before switching.',
  },
  'draft-proposal': {
    provider: 'gemini',
    model: 'gemini-3.6-flash',
    why: 'Goes to a paying client in your voice. Last thing to cheapen.',
  },
  'draft-contract': {
    provider: 'gemini',
    model: 'gemini-3.6-flash',
    why: 'Legal-ish copy with compliance clauses. Last thing to cheapen.',
  },
  'studio-edit': {
    provider: 'gemini',
    model: 'gemini-3.6-flash',
    why: 'Must return strict JSON. Watch the parse-failure rate before switching.',
  },
  'draft-outreach': {
    provider: 'gemini',
    model: 'gemini-3.6-flash',
    why: 'Cold email in the operator voice. High volume, and the first thing a prospect reads.',
  },
  assistant: {
    provider: 'gemini',
    model: 'gemini-3.6-flash',
    why: 'Chat about your own business. Cheap and chatty is a good fit here.',
  },
};

/**
 * Models the operator may pick between in the assistant UI.
 *
 * An allowlist rather than a free-text field: the route is admin-gated, so this
 * is not a security boundary so much as a spend guard — a typo or a stale value
 * from an old browser tab should not silently route a conversation onto a model
 * costing twenty times more.
 *
 * Prices are per 1M tokens, checked against OpenRouter on 2026-08-29. They will
 * drift; they are here to make the tradeoff visible at the point of choosing,
 * not to be authoritative.
 */
export const ASSISTANT_MODEL_CHOICES = [
  {
    id: 'openrouter:deepseek/deepseek-v4-flash',
    label: 'DeepSeek V4 Flash',
    hint: '$0.08 / $0.17 · 1M context',
    detail: 'Fast and cheap. The right default for talking through your pipeline.',
  },
  {
    id: 'openrouter:deepseek/deepseek-v4-pro',
    label: 'DeepSeek V4 Pro',
    hint: '$0.68 / $1.36 · 1M context',
    detail: 'Stronger reasoning, ~8x the cost. Worth it for a genuinely hard decision.',
  },
  {
    id: 'gemini:gemini-3.6-flash',
    label: 'Gemini Flash',
    hint: 'Free tier · 1,500/day',
    detail: 'Costs nothing. Falls back here if OpenRouter is unreachable.',
  },
] as const;

export type AssistantModelId = (typeof ASSISTANT_MODEL_CHOICES)[number]['id'];

export function isAllowedAssistantModel(id: unknown): id is AssistantModelId {
  return typeof id === 'string' && ASSISTANT_MODEL_CHOICES.some(c => c.id === id);
}

/** Parses a `provider:model` string. Null when malformed or unknown provider. */
export function parseModelSpec(spec: string): ModelConfig | null {
  const [provider, ...rest] = spec.split(':');
  const model = rest.join(':');
  if ((provider !== 'gemini' && provider !== 'openrouter') || !model) return null;
  return { provider, model, why: 'Chosen per request' };
}

function envKeyFor(task: TaskName): string {
  return `MODEL_${task.toUpperCase().replace(/-/g, '_')}`;
}

export function resolveModel(task: TaskName): ModelConfig {
  const base = DEFAULT_TASK_MODELS[task];
  const override = process.env[envKeyFor(task)];
  if (!override) return base;

  const [provider, ...rest] = override.split(':');
  const model = rest.join(':'); // model ids contain slashes, sometimes colons
  if ((provider !== 'gemini' && provider !== 'openrouter') || !model) {
    console.warn(
      `[models] Ignoring ${envKeyFor(task)}="${override}" — expected "gemini:<model>" or "openrouter:<model>".`
    );
    return base;
  }
  return { provider, model, why: `Overridden by ${envKeyFor(task)}` };
}

// --- Gemini, delegated ------------------------------------------------------
// server.ts owns the Gemini client and its retry logic. Registering a caller
// here avoids duplicating either, and keeps this module import-light.

type GeminiCaller = (opts: { model: string; contents: any }) => Promise<any>;
let geminiCaller: GeminiCaller | null = null;

export function registerGeminiCaller(fn: GeminiCaller): void {
  geminiCaller = fn;
}

// --- OpenRouter -------------------------------------------------------------

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ModelResult {
  text: string;
  provider: string;
  model: string;
  promptTokens?: number;
  completionTokens?: number;
  /**
   * Tokens the model spent thinking before answering. DeepSeek V4 reasons by
   * default and can burn most of a small budget on it — verified 2026-08-29:
   * a request capped at 10 tokens returned 18 reasoning tokens and empty
   * content.
   */
  reasoningTokens?: number;
  /** Actual cost in USD, reported by OpenRouter. Undefined for Gemini. */
  costUsd?: number;
}

async function callOpenRouter(
  config: ModelConfig,
  messages: ChatMessage[],
  timeoutMs: number,
  maxTokens: number
): Promise<ModelResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error(
      'OPENROUTER_API_KEY is not set. Add it to .env.local — see .env.example.'
    );
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        // OpenRouter uses these for its dashboard attribution.
        'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
        'X-Title': 'Texas Sons Studio',
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        // Reasoning models spend output budget before writing a word, so a
        // small cap yields an empty reply rather than a short one.
        max_tokens: maxTokens,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`OpenRouter ${res.status}: ${body.slice(0, 300)}`);
    }

    const data: any = await res.json();
    const choice = data?.choices?.[0];
    const text = choice?.message?.content;
    const usage = data?.usage || {};
    const reasoningTokens = usage?.completion_tokens_details?.reasoning_tokens;

    // An empty answer from a reasoning model almost always means the token
    // budget went on thinking. Say that, rather than "no message content".
    if (typeof text !== 'string' || text.trim() === '') {
      if (choice?.finish_reason === 'length') {
        throw new Error(
          `${config.model} used its entire ${maxTokens}-token budget on reasoning ` +
          `(${reasoningTokens ?? 'unknown'} reasoning tokens) and returned nothing. ` +
          `Raise maxTokens or pick a non-reasoning model.`
        );
      }
      if (choice?.message?.refusal) {
        throw new Error(`${config.model} declined: ${choice.message.refusal}`);
      }
      throw new Error(
        `${config.model} returned no content (finish_reason: ${choice?.finish_reason ?? 'unknown'}).`
      );
    }

    return {
      text,
      provider: 'openrouter',
      model: data?.model || config.model,
      promptTokens: usage.prompt_tokens,
      completionTokens: usage.completion_tokens,
      reasoningTokens,
      // OpenRouter reports what the call actually cost. Real numbers beat an
      // estimate from a price table that drifts.
      costUsd: typeof usage.cost === 'number' ? usage.cost : undefined,
    };
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw new Error(`${config.model} timed out after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

// --- the entry point --------------------------------------------------------

export interface CallOptions {
  task: TaskName;
  /** Single-shot prompt. Ignored when `messages` is supplied. */
  prompt?: string;
  /** Full conversation, for chat. */
  messages?: ChatMessage[];
  system?: string;
  /** Gemini-only. Multimodal parts; presence forces the Gemini path. */
  parts?: any[];
  timeoutMs?: number;
  /** `provider:model`, overriding both the default and any env var for this call. */
  modelSpec?: string;
  /**
   * Output budget. Defaults to 4096, generous on purpose — reasoning models
   * consume it before producing any visible text.
   */
  maxTokens?: number;
}

/**
 * Runs a task on whichever model is configured for it.
 *
 * Multimodal requests always go to Gemini regardless of configuration — a text
 * model silently ignoring the images would produce a confident, entirely
 * invented answer, which is the worst possible failure here.
 */
export async function callModel(options: CallOptions): Promise<ModelResult> {
  const perRequest = options.modelSpec ? parseModelSpec(options.modelSpec) : null;
  if (options.modelSpec && !perRequest) {
    console.warn(`[models] Ignoring malformed modelSpec "${options.modelSpec}" — using the configured default.`);
  }
  const config = perRequest || resolveModel(options.task);
  const timeoutMs = options.timeoutMs ?? 60_000;

  const forcedGemini = Array.isArray(options.parts) && options.parts.length > 0;
  if (forcedGemini && config.provider !== 'gemini') {
    console.warn(
      `[models] ${options.task} is configured for ${config.provider} but this request has images — using Gemini instead.`
    );
  }

  if (forcedGemini || config.provider === 'gemini') {
    if (!geminiCaller) throw new Error('Gemini caller not registered — call registerGeminiCaller at startup.');
    const geminiModel = forcedGemini && config.provider !== 'gemini'
      ? DEFAULT_TASK_MODELS[options.task].model
      : config.model;

    const contents = options.parts
      ? [{ role: 'user', parts: options.parts }]
      : [options.system, options.prompt].filter(Boolean).join('\n\n');

    const response = await geminiCaller({ model: geminiModel, contents });
    return {
      text: response?.text || '',
      provider: 'gemini',
      model: geminiModel,
      promptTokens: response?.usageMetadata?.promptTokenCount,
      completionTokens: response?.usageMetadata?.candidatesTokenCount,
    };
  }

  const messages: ChatMessage[] = options.messages
    ? options.system
      ? [{ role: 'system', content: options.system }, ...options.messages]
      : options.messages
    : [
        ...(options.system ? [{ role: 'system' as const, content: options.system }] : []),
        { role: 'user' as const, content: options.prompt || '' },
      ];

  return callOpenRouter(config, messages, timeoutMs, options.maxTokens ?? 4096);
}

/**
 * Strips markdown fences and parses JSON.
 *
 * Cheaper models wrap JSON in ```json fences far more often than Gemini does,
 * and every route was hand-rolling this. Throws a message naming the model, so
 * "DeepSeek keeps returning prose" is diagnosable rather than a bare
 * SyntaxError.
 */
export function parseModelJson<T = any>(result: ModelResult): T {
  const fenced = (result.text || '')
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/, '')
    .trim();

  // Slice between the outermost braces (or brackets) rather than parsing the
  // whole string. Models — cheaper ones especially — like to wrap JSON in a
  // sentence of explanation, and a strict parse throws on the prose instead of
  // the data. Adapted from the parseJsonResponse helper this replaces.
  const candidates = [
    [fenced.indexOf('{'), fenced.lastIndexOf('}')],
    [fenced.indexOf('['), fenced.lastIndexOf(']')],
  ].filter(([a, b]) => a !== -1 && b > a);

  // Prefer whichever structure starts first, so an object containing an array
  // is not mistaken for a bare array.
  candidates.sort((a, b) => a[0] - b[0]);

  for (const [start, end] of candidates) {
    try {
      return JSON.parse(fenced.slice(start, end + 1)) as T;
    } catch {
      // try the next shape
    }
  }

  throw new Error(
    `${result.model} did not return valid JSON. First 200 chars: ${fenced.slice(0, 200)}`
  );
}

/**
 * Prints the resolved routing table at boot.
 *
 * Added after a confusing session: the assistant's model picker greyed out the
 * DeepSeek options because the server had not been restarted since the key was
 * added to .env.local, and nothing anywhere said so. A process that reads config
 * once at startup should report what it read.
 */
export function logRoutingTable(): void {
  const openRouterReady = !!process.env.OPENROUTER_API_KEY;
  const tasks = Object.keys(DEFAULT_TASK_MODELS) as TaskName[];

  console.log('[models] task routing:');
  for (const task of tasks) {
    const c = resolveModel(task);
    const overridden = c.why.startsWith('Overridden');
    const needsKey = c.provider === 'openrouter' && !openRouterReady;
    console.log(
      `  ${task.padEnd(17)} ${`${c.provider}:${c.model}`.padEnd(42)}` +
      `${overridden ? ' [env override]' : ''}${needsKey ? '  <-- NO OPENROUTER_API_KEY, calls will fail' : ''}`
    );
  }
  console.log(
    `[models] OpenRouter: ${openRouterReady ? 'configured' : 'NOT configured — DeepSeek options will be disabled in the assistant'}`
  );
}
