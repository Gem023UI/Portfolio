import { useEffect, useRef, useState } from 'react';

// Typing budget 5s + a 3s hold (set in Hero.tsx) = the 8s answer window.
const TYPING_BUDGET_MS = 5000;
const MAX_MS_PER_CHAR = 34;

interface ManBubbleProps {
  text: string;
  typed: boolean; // true = typing animation, false = appears at once
  loading?: boolean; // three bouncing dots while waiting for Groq
  x: number;
  y: number;
  onTyped?: () => void;
}

export default function ManBubble({ text, typed, loading = false, x, y, onTyped }: ManBubbleProps) {
  const [count, setCount] = useState(typed ? 0 : text.length);
  const cb = useRef(onTyped);
  cb.current = onTyped;

  useEffect(() => {
    if (loading) return;
    if (!typed) {
      setCount(text.length);
      return;
    }
    const per = Math.min(MAX_MS_PER_CHAR, TYPING_BUDGET_MS / Math.max(1, text.length));
    setCount(0);
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setCount(i);
      if (i >= text.length) {
        window.clearInterval(id);
        cb.current?.();
      }
    }, per);
    return () => window.clearInterval(id);
  }, [text, typed, loading]);

  return (
    <div className="hero__bubble" role="status" style={{ left: x, top: y }}>
      {loading ? (
        <span className="hero__bubble-dots" aria-label="Thinking">
          <i />
          <i />
          <i />
        </span>
      ) : (
        <>
          <span className="hero__bubble-ghost">{text}</span>
          <span className="hero__bubble-live">{text.slice(0, count)}</span>
        </>
      )}
    </div>
  );
}