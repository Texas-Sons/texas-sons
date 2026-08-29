/**
 * Live AI smoke test — `npm run smoke:live`.
 *
 * Spends real API calls, so it is NOT part of `npm test` or CI. Run it before a
 * deploy, and after touching anything model-related.
 *
 * What it checks: that every task can complete a round trip and return usable
 * output. That is precisely the failure class that shipped twice unnoticed —
 * /api/scrape-site called a method the installed SDK does not expose and threw
 * on every request from the day it was added, and /api/lead returned HTTP 500
 * for an unknown period. Both typechecked. Both looked finished.
 *
 * What it deliberately does NOT check: output quality. "Is this tagline good" is
 * flaky, expensive, and a test you learn to ignore is worse than no test.
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { GoogleGenAI } from '@google/genai';
import {
  callModel, parseModelJson, registerGeminiCaller, resolveModel,
  type TaskName,
} from '../lib/models';

// Mirror the server's Gemini wiring — including its retry. Without this the
// smoke test is stricter than production: the server survives a transient 503,
// so a test that does not would report a code failure for a capacity blip.
const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

function isTransient(err: any): boolean {
  const text = String(err?.message || err);
  return /(429|500|502|503|504)/.test(text) || /UNAVAILABLE|high demand|overloaded|rate limit/i.test(text);
}

registerGeminiCaller(async opts => {
  let lastError: any;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await gemini.models.generateContent(opts as any);
    } catch (err) {
      lastError = err;
      if (!isTransient(err) || attempt === 3) throw err;
      await new Promise(r => setTimeout(r, attempt * 2000));
    }
  }
  throw lastError;
});

interface Probe {
  task: TaskName;
  label: string;
  /** Whether the route parses the reply as JSON. */
  expectsJson: boolean;
  build: () => { prompt?: string; parts?: any[]; messages?: any[]; system?: string };
}

/** A 1x1 PNG — enough to prove the multimodal path accepts image parts. */
const TINY_PNG =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

const PROBES: Probe[] = [
  {
    task: 'scrape-extract',
    label: 'website text -> dossier',
    expectsJson: true,
    build: () => ({
      prompt:
        'Extract a JSON dossier from this website text. Return ONLY JSON.\n' +
        'Text: "Pearl Barbershop. Fades and hot towel shaves in Pleasanton TX. Call 830-555-0100."\n' +
        '{"businessName":"","phone":"","category":"","description":""}',
    }),
  },
  {
    task: 'generate-config',
    label: 'business -> template tokens',
    expectsJson: true,
    build: () => ({
      prompt:
        'Fill these template tokens for a barbershop called Pearl Barbershop. Return ONLY JSON.\n' +
        '{"HEADLINE":"","SUBHEADLINE":"","CTA_TEXT":""}',
    }),
  },
  {
    task: 'studio-edit',
    label: 'instruction -> edited blueprint',
    expectsJson: true,
    build: () => ({
      prompt:
        'Apply the instruction to this snapshot and return the COMPLETE updated JSON, nothing else.\n' +
        'Snapshot: {"profile":{"name":"Pearl Barbershop","accentColor":"#f97316"},"heroVariant":"split"}\n' +
        'Instruction: make the accent color blue',
    }),
  },
  {
    task: 'draft-proposal',
    label: 'client proposal (subject + body)',
    expectsJson: true,
    build: () => ({
      prompt:
        'Draft a short project proposal email. Return ONLY JSON: {"subject":"","body":""}\n' +
        'Client: Pearl Barbershop, Pleasanton TX. Deliverable: a one-page website.',
    }),
  },
  {
    task: 'draft-contract',
    label: 'services agreement',
    expectsJson: true,
    build: () => ({
      prompt:
        'Draft a brief services agreement. Return ONLY JSON: {"title":"","contractText":""}\n' +
        'Client: Pearl Barbershop. Scope: one-page website. Total $1500, 50% deposit.',
    }),
  },
  {
    task: 'draft-outreach',
    label: 'cold outreach email (plain text)',
    expectsJson: false,
    build: () => ({
      prompt:
        'Write a short cold outreach email to Pearl Barbershop in Pleasanton TX, ' +
        'who has no website. Three short paragraphs, professional, not salesy.',
    }),
  },
  {
    task: 'extract-dossier',
    label: 'image -> dossier (multimodal)',
    expectsJson: true,
    build: () => ({
      parts: [
        { inlineData: { mimeType: 'image/png', data: TINY_PNG } },
        {
          text:
            'Describe what you can determine from this image as JSON. Return ONLY JSON. ' +
            'If the image is blank or unreadable, say so in the description field.\n' +
            '{"businessName":"","description":""}',
        },
      ],
    }),
  },
  {
    task: 'assistant',
    label: 'business chat',
    expectsJson: false,
    build: () => ({
      system: 'You are a terse business assistant. Answer in one sentence.',
      messages: [{ role: 'user', content: 'Say the word ready and nothing else.' }],
    }),
  },
];

const only = process.argv[2];
const probes = only ? PROBES.filter(p => p.task === only) : PROBES;

if (only && probes.length === 0) {
  console.error(`Unknown task "${only}". Known: ${PROBES.map(p => p.task).join(', ')}`);
  process.exit(1);
}

console.log(`Running ${probes.length} live probe(s). This spends real API calls.\n`);

let failures = 0;
let upstreamOutages = 0;
let totalCost = 0;

for (const probe of probes) {
  const config = resolveModel(probe.task);
  const target = `${config.provider}:${config.model}`;
  const started = Date.now();

  try {
    const result = await callModel({ task: probe.task, ...probe.build() });

    if (!result.text || !result.text.trim()) {
      throw new Error('returned empty output');
    }
    if (probe.expectsJson) {
      parseModelJson(result); // throws, naming the model, if unparseable
    }

    const ms = Date.now() - started;
    if (typeof result.costUsd === 'number') totalCost += result.costUsd;

    const cost = typeof result.costUsd === 'number' ? ` $${result.costUsd.toFixed(6)}` : '';
    const reasoning = result.reasoningTokens ? ` (+${result.reasoningTokens} reasoning)` : '';
    console.log(`  PASS  ${probe.task.padEnd(17)} ${probe.label}`);
    console.log(`        ${target}  ${ms}ms  ${result.promptTokens ?? '?'}/${result.completionTokens ?? '?'} tok${reasoning}${cost}`);
  } catch (err: any) {
    // A provider outage is not a defect in this codebase. Counting it as one
    // trains you to ignore the output, which defeats the whole test.
    if (isTransient(err)) {
      upstreamOutages++;
      console.warn(`  SKIP  ${probe.task.padEnd(17)} ${probe.label}`);
      console.warn(`        ${target} — provider unavailable after 3 attempts, not a code failure`);
    } else {
      failures++;
      console.error(`  FAIL  ${probe.task.padEnd(17)} ${probe.label}`);
      console.error(`        ${target}`);
      console.error(`        ${err?.message || err}`);
    }
  }
}

console.log('');
if (totalCost > 0) console.log(`Total metered cost: $${totalCost.toFixed(6)}`);

if (upstreamOutages > 0) {
  console.warn(`${upstreamOutages} task(s) skipped — the provider was unavailable. Re-run to cover them.`);
}
if (failures > 0) {
  console.error(`LIVE SMOKE FAIL: ${failures} of ${probes.length} task(s) are broken.`);
  process.exit(1);
}
console.log(`LIVE SMOKE PASS: ${probes.length - upstreamOutages} of ${probes.length} task(s) completed and returned usable output.`);
