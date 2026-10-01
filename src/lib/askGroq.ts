import { validateQuestion } from './guardrails.ts';
import { groqAnswer, finalizeAnswer } from './groqCore.ts';
import { REPLIES } from './devProfile.js';

// LOCAL DEV ONLY: put VITE_GROQ_API_KEY in .env (gitignored) to call Groq directly.
// In production leave it unset: the app calls the /api/ask Vercel function, which holds GROQ_API_KEY.
const DEV_KEY = import.meta.env.VITE_GROQ_API_KEY as string | undefined;

const TIMEOUT_MS = 6500;
const COOLDOWN_MS = 2500;
let lastAsk = 0;

/** Never throws: always resolves to something the man can say. */
export async function askDeveloper(input: string): Promise<string> {
  const v = validateQuestion(input);
  if (!v.ok) return v.reply;

  const now = Date.now();
  if (now - lastAsk < COOLDOWN_MS) return REPLIES.cooldown;
  lastAsk = now;

  const ctrl = new AbortController();
  const timer = window.setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    if (DEV_KEY) return finalizeAnswer(await groqAnswer(DEV_KEY, v.text, ctrl.signal));

    const res = await fetch('/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: v.text }),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json();
    return finalizeAnswer(String(data.answer ?? ''));
  } catch {
    return REPLIES.error;
  } finally {
    window.clearTimeout(timer);
  }
}