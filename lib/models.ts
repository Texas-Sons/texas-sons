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
  | 'scrape-extract'    // page text -> JSON
  | 'generate-config'   // business profile -> template tokens
  | 'draft-proposal'
  | 'draft-contract'
  | 'studio-edit'       // natural language -> blueprint edit
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
  assistant: {
    provider: 'gemini',
    model: 'gemini-3.6-flash',
    why: 'Chat about your own business. Cheap and chatty is a good fit here.',
  },
};

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
}

async function callOpenRouter(
  config: ModelConfig,
  messages: ChatMessage[],
  timeoutMs: number
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
      body: JSON.stringify({ model: config.model, messages }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`OpenRouter ${res.status}: ${body.slice(0, 300)}`);
    }

    const data: any = await res.json();
    const text = data?.choices?.[0]?.message?.content;
    if (typeof text !== 'string') {
      throw new Error(`OpenRouter returned no message content: ${JSON.stringify(data).slice(0, 300)}`);
    }

    return {
      text,
      provider: 'openrouter',
      model: data?.model || config.model,
      promptTokens: data?.usage?.prompt_tokens,
      completionTokens: data?.usage?.completion_tokens,
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
}

/**
 * Runs a task on whichever model is configured for it.
 *
 * Multimodal requests always go to Gemini regardless of configuration — a text
 * model silently ignoring the images would produce a confident, entirely
 * invented answer, which is the worst possible failure here.
 */
export async function callModel(options: CallOptions): Promise<ModelResult> {
  const config = resolveModel(options.task);
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

  return callOpenRouter(config, messages, timeoutMs);
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
  const cleaned = result.text
    .replace(/^\s*```(?:json)?/i, '')
    .replace(/```\s*$/, '')
    .trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    throw new Error(
      `${result.model} did not return valid JSON. First 200 chars: ${cleaned.slice(0, 200)}`
    );
  }
}
