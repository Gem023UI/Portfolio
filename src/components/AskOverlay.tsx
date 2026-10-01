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
  const [mounted, setMounted] = useState(open);
  const [shown, setShown] = useState(false);
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setMounted(true);
      setValue('');
      const id = requestAnimationFrame(() => {
        setShown(true);
        inputRef.current?.focus();
      });
      return () => cancelAnimationFrame(id);
    }
    setShown(false);
    const t = window.setTimeout(() => setMounted(false), 260);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!mounted) return null;

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
        <span className={`ask__bar${value ? ' ask__bar--hidden' : ''}`} aria-hidden="true" />
        <input
          ref={inputRef}
          className="ask__input"
          type="text"
          value={value}
          maxLength={MAX_QUESTION_LENGTH}
          placeholder="Ask anything about me"
          aria-label="Your question"
          autoComplete="off"
          spellCheck={false}
          onChange={(e) => setValue(e.target.value)}
        />
      </form>
      <p className="ask__hint">Press Enter to ask · Esc to close</p>
    </div>,
    document.body
  );
}