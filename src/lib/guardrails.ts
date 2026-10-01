import { REPLIES } from './devProfile.js';

export const MAX_QUESTION_LENGTH = 140;

const LEET: Record<string, string> = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '@': 'a', $: 's', '!': 'i' };

// Words that must match a whole token (avoids false positives like "assistant").
const BAD_EXACT = new Set([
  'ass', 'arse', 'dick', 'dicks', 'cock', 'cocks', 'tits', 'twat', 'wank', 'porn', 'fag', 'fags',
  'retard', 'retarded', 'retards', 'gago', 'ulol', 'tarantado', 'pakyu', 'puta', 'bobo', 'tanga', 'siraulo', 'pokpok',
]);

// Stems that are unambiguous enough to match anywhere inside a token.
const BAD_STEMS = [
  'fuck', 'shit', 'bitch', 'bastard', 'asshole', 'cunt', 'pussy', 'whore', 'slut', 'nigg', 'faggot',
  'motherf', 'dickhead', 'jackass', 'dumbass', 'putang', 'tangina', 'kantot',
];

function normalize(input: string): string {
  let s = input.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
  s = s.replace(/[0134578@$!]/g, (c) => LEET[c] ?? c);
  // "f u c k", "f.u.c.k" -> "fuck"
  s = s.replace(/\b(?:[a-z][\s.\-_*]){2,}[a-z]\b/g, (m) => m.replace(/[\s.\-_*]/g, ''));
  // "fuuuck" -> "fuck"
  s = s.replace(/(.)\1{2,}/g, '$1');
  return s;
}

export function hasProfanity(input: string): boolean {
  const tokens = normalize(input).split(/[^a-z]+/).filter(Boolean);
  return tokens.some((t) => BAD_EXACT.has(t) || BAD_STEMS.some((stem) => t.includes(stem)));
}

const INJECTION_PATTERNS: RegExp[] = [
  /ignore (all |any |the )?(previous|prior|above|earlier)/i,
  /disregard (all |any |the )?(previous|prior|above|instructions|rules)/i,
  /(system|developer|hidden) (prompt|message|instructions?)/i,
  /(reveal|show|print|repeat) (your|the) (prompt|instructions|rules)/i,
  /you are now/i,
  /pretend (to be|you)/i,
  /\bact as\b/i,
  /role-?play/i,
  /jailbreak/i,
  /\bDAN\b/,
  /developer mode/i,
  /forget (everything|your|all)/i,
];

export function looksLikeInjection(input: string): boolean {
  return INJECTION_PATTERNS.some((re) => re.test(input));
}

export type Validation = { ok: true; text: string } | { ok: false; reply: string };

export function validateQuestion(raw: string): Validation {
  const text = raw.replace(/\s+/g, ' ').trim().slice(0, MAX_QUESTION_LENGTH);
  if (text.length < 2) return { ok: false, reply: REPLIES.tooShort };
  if (hasProfanity(text)) return { ok: false, reply: REPLIES.profanity };
  if (looksLikeInjection(text)) return { ok: false, reply: REPLIES.injection };
  return { ok: true, text };
}