import { buildSystemPrompt, REPLIES } from './devProfile.ts';
import { hasProfanity } from './guardrails.js';

export const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
export const GROQ_MODELS_URL = 'https://api.groq.com/openai/v1/models';
export const MAX_ANSWER_CHARS = 150; // keeps typing + reading inside the 8s budget

// Tried in order; the first one that works is remembered for later questions.
export const GROQ_MODELS = [
  'llama-3.1-8b-instant',
  'llama-3.3-70b-versatile',
  'openai/gpt-oss-20b',
  'openai/gpt-oss-120b',
];

// Models that can't answer chat questions (speech, safety classifiers, agent systems, embeddings).
const NOT_CHAT = /whisper|tts|guard|orpheus|compound|embed|safeguard/i;

let workingModel: string | null = null;

async function listUsableModels(apiKey: string, signal?: AbortSignal): Promise<string[]> {
  const res = await fetch(GROQ_MODELS_URL, {
    headers: { Authorization: `Bearer ${apiKey}` },
    signal,
  });
  if (!res.ok) return [];
  const data = await res.json();
  const ids: string[] = (data?.data ?? [])
    .map((m: { id: string }) => m.id)
    .filter((id: string) => !NOT_CHAT.test(id));
  console.info('[groq] chat models available to this key:', ids);
  return ids;
}

async function tryModel(
  apiKey: string,
  model: string,
  question: string,
  signal?: AbortSignal
): Promise<{ ok: true; text: string } | { ok: false; status: number }> {
  const reasoning = /gpt-oss/i.test(model); // reasoning models need headroom for their hidden thinking
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      max_tokens: reasoning ? 400 : 80,
      ...(reasoning ? { reasoning_effort: 'low' } : {}),
      messages: [
        { role: 'system', content: buildSystemPrompt() },
        { role: 'user', content: `Visitor question: """${question}"""` },
      ],
    }),
    signal,
  });

  if (!res.ok) {
    console.warn(`[groq] ${model} -> ${res.status}`, await res.text().catch(() => ''));
    return { ok: false, status: res.status };
  }

  const data = await res.json();
  return { ok: true, text: String(data?.choices?.[0]?.message?.content ?? '') };
}

export async function groqAnswer(apiKey: string, question: string, signal?: AbortSignal): Promise<string> {
  const tried = new Set<string>();

  const run = async (models: string[]): Promise<string | null> => {
    for (const model of models) {
      if (tried.has(model)) continue;
      tried.add(model);
      const r = await tryModel(apiKey, model, question, signal);
      if (r.ok) {
        workingModel = model;
        return r.text;
      }
      // 404 / 400 = this model isn't available to the key: try the next one.
      // Anything else (401 bad key, 429 rate limit, 5xx) won't be fixed by another model.
      if (r.status !== 404 && r.status !== 400) throw new Error(`Groq responded ${r.status}`);
    }
    return null;
  };

  const first = await run(workingModel ? [workingModel] : GROQ_MODELS);
  if (first !== null) return first;

  // every hard-coded model was refused: ask Groq what this key can actually use
  const second = await run((await listUsableModels(apiKey, signal)).slice(0, 4));
  if (second !== null) return second;

  throw new Error('No Groq model is available to this API key');
}

/** Last line of defence: sentinel handling, output profanity check, markdown strip, hard length cap. */
export function finalizeAnswer(raw: string): string {
  let out = raw
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/[*_`#>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^["“]|["”]$/g, '');

  if (!out || /^OFFTOPIC\b/i.test(out) || hasProfanity(out)) return REPLIES.offTopic;

  if (out.length > MAX_ANSWER_CHARS) {
    const cut = out.slice(0, MAX_ANSWER_CHARS);
    const end = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '));
    out = end > 40 ? cut.slice(0, end + 1) : cut.slice(0, MAX_ANSWER_CHARS - 1).trimEnd() + '…';
  }
  return out;
}