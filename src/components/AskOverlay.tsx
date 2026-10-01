import { useEffect, useRef, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { MAX_QUESTION_LENGTH } from '../lib/guardrails';
import './AskOverlay.css';

interface AskOverlayProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (question: string) => void;
}

export default function AskOverlay({ open, onClose, onSubmit }: AskOverlayProps) {
  const [mounted, setMounted] = useState(open); // stays true during the fade-out
  const [shown, setShown] = useState(false); // drives the fade/blur transition
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setMounted(true);
      setValue('');
      const id = requestAnimationFrame(() => setShown(true));
      return () => cancelAnimationFrame(id);
    }
    setShown(false);
    const t = window.setTimeout(() => setMounted(false), 260);
    return () => window.clearTimeout(t);
  }, [open]);

  // The input exists in the same render pass as `open`, so it can take focus right away
  // (this also steals focus from the man button that was just clicked).
  useEffect(() => {
    if (open) inputRef.current?.focus({ preventScroll: true });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      // safety net: if anything else has focus, route typing into the field
      const input = inputRef.current;
      if (input && document.activeElement !== input && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        input.focus({ preventScroll: true });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open && !mounted) return null;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const q = value.trim();
    if (q) onSubmit(q);
  };

  return createPortal(
    <div
      className={`ask${shown ? ' ask--open' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="Ask anything about Jemuel"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form className="ask__form" onSubmit={submit}>
        <div className="ask__field">
          {!value && (
            <div className="ask__ph" aria-hidden="true">
              <span className="ask__bar" />
              <span>Ask anything about me</span>
            </div>
          )}
          <input
            ref={inputRef}
            className={`ask__input${value ? '' : ' ask__input--empty'}`}
            type="text"
            value={value}
            maxLength={MAX_QUESTION_LENGTH}
            aria-label="Your question"
            autoComplete="off"
            spellCheck={false}
            autoFocus
            onChange={(e) => setValue(e.target.value)}
          />
        </div>
      </form>
      <p className="ask__hint">Press Enter to ask · Esc to close</p>
    </div>,
    document.body
  );
}