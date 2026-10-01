import { buildSystemPrompt, REPLIES } from './devProfile.ts';
import { hasProfanity } from './Guardrails.ts';

export const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
export const GROQ_MODEL = 'llama-3.1-8b-instant'; // fast + cheap; swap for a larger Groq model if you want
export const MAX_ANSWER_CHARS = 150; // keeps typing + reading inside the 8s budget

export async function groqAnswer(apiKey: string, question: string, signal?: AbortSignal): Promise<string> {
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.3,
      max_tokens: 80,
      messages: [
        { role: 'system', content: buildSystemPrompt() },
        { role: 'user', content: `Visitor question: """${question}"""` },
      ],
    }),
    signal,
  });
  if (!res.ok) throw new Error(`Groq responded ${res.status}`);
  const data = await res.json();
  return String(data?.choices?.[0]?.message?.content ?? '');
}

/** Last line of defence: sentinel handling, output profanity check, markdown strip, hard length cap. */
export function finalizeAnswer(raw: string): string {
  let out = raw.replace(/[*_`#>]/g, '').replace(/\s+/g, ' ').trim().replace(/^["“]|["”]$/g, '');
  if (!out || /^OFFTOPIC\b/i.test(out) || hasProfanity(out)) return REPLIES.offTopic;
  if (out.length > MAX_ANSWER_CHARS) {
    const cut = out.slice(0, MAX_ANSWER_CHARS);
    const end = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '));
    out = end > 40 ? cut.slice(0, end + 1) : cut.slice(0, MAX_ANSWER_CHARS - 1).trimEnd() + '…';
  }
  return out;
}