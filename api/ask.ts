import { validateQuestion } from '../src/lib/guardrails.ts';
import { groqAnswer, finalizeAnswer } from '../src/lib/groqCore.ts';
import { REPLIES } from '../src/lib/devProfile.ts';

declare const process: { env: Record<string, string | undefined> };

// Best-effort per-instance rate limit (resets on cold start).
const hits = new Map<string, number[]>();
const LIMIT = 8;
const WINDOW_MS = 60_000;

function limited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > LIMIT;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

export async function POST(request: Request) {
  const key = process.env.VITE_GROQ_API_KEY;
  if (!key) return json({ answer: REPLIES.error }, 500);

  const ip = (request.headers.get('x-forwarded-for') ?? 'unknown').split(',')[0].trim();
  if (limited(ip)) return json({ answer: REPLIES.cooldown }, 429);

  let question = '';
  try {
    question = String((await request.json())?.question ?? '');
  } catch {
    /* fall through to validation */
  }

  const v = validateQuestion(question);
  if (!v.ok) return json({ answer: v.reply });

  try {
    const raw = await groqAnswer(key, v.text, AbortSignal.timeout(6000));
    return json({ answer: finalizeAnswer(raw) });
  } catch {
    return json({ answer: REPLIES.error }, 502);
  }
}