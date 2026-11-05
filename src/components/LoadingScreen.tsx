
import { useEffect, useState } from 'react';
import './LoadingScreen.css';

const MESSAGE_DURATION_MS = 3000;
const FADE_MS = 600;

const MESSAGES = [
  'Great design comes from curiosity.',
  "And you're right where you need to be.",
  "Name's Jem, welcome aboard.",
];

interface LoadingScreenProps {
  onDone: () => void;
}

export default function LoadingScreen({ onDone }: LoadingScreenProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [leaving, setLeaving] = useState(false);

  // Lock scroll while loading
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Sequential messages, followed by the exit animation
  useEffect(() => {
    const timers: number[] = [];

    const pageLoaded = new Promise<void>((resolve) => {
      if (document.readyState === 'complete') {
        resolve();
      } else {
        window.addEventListener('load', () => resolve(), {
          once: true,
        });
      }
    });

    MESSAGES.forEach((_, index) => {
      if (index === 0) return;

      timers.push(
        window.setTimeout(() => {
          setMessageIndex(index);
        }, MESSAGE_DURATION_MS * index),
      );
    });

    const sequenceComplete = new Promise<void>((resolve) => {
      timers.push(
        window.setTimeout(resolve, MESSAGE_DURATION_MS * MESSAGES.length),
      );
    });

    let fadeTimer: number | undefined;
    let cancelled = false;

    Promise.all([sequenceComplete, pageLoaded]).then(() => {
      if (cancelled) return;

      setLeaving(true);

      fadeTimer = window.setTimeout(() => {
        if (!cancelled) onDone();
      }, FADE_MS);
    });

    return () => {
      cancelled = true;

      timers.forEach(window.clearTimeout);

      if (fadeTimer !== undefined) {
        window.clearTimeout(fadeTimer);
      }
    };
  }, [onDone]);

  return (
    <div
      className={`loading-screen${leaving ? ' loading-screen--leaving' : ''}`}
      role="status"
      aria-live="polite"
    >
      <p
        key={messageIndex}
        className="loading-screen__text"
      >
        {MESSAGES[messageIndex]}
      </p>
    </div>
  );
}
