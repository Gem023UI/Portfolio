import { useEffect, useState } from 'react';
import '../styles/ContactPage.css';

const CONTACT_EMAIL = 'malagajemuel@gmail.com';

type Status = 'empty' | 'valid' | 'invalid';
interface Check {
  status: Status;
  hint: string;
}
type FieldKey = 'name' | 'email' | 'message';

// ---- profanity ----
const BAD_STEMS = ['fuck', 'shit', 'bitch', 'cunt', 'asshole', 'bastard', 'putang', 'tangina', 'tarantado'];
const BAD_EXACT = ['dick', 'ass', 'pussy', 'gago', 'bobo', 'ulol'];
const LEET: Record<string, string> = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '@': 'a', $: 's' };

function hasProfanity(text: string): boolean {
  const tokens = text
    .toLowerCase()
    .replace(/[01345@$]/g, (c) => LEET[c])
    .split(/[^a-z]+/)
    .filter(Boolean);
  return tokens.some((t) => BAD_EXACT.includes(t) || BAD_STEMS.some((b) => t.startsWith(b)));
}

// ---- validators ----
function checkName(v: string): Check {
  const s = v.trim();
  if (!s) return { status: 'empty', hint: '' };
  if (/\d/.test(s)) return { status: 'invalid', hint: "Numbers aren't allowed in a name." };
  if (hasProfanity(s)) return { status: 'invalid', hint: 'Please keep it respectful.' };
  if (!/^[\p{L}][\p{L}\s'.-]*$/u.test(s)) return { status: 'invalid', hint: 'Letters only, please.' };
  if (s.length < 2) return { status: 'invalid', hint: 'That name is too short.' };
  return { status: 'valid', hint: '' };
}

function checkEmail(v: string): Check {
  const s = v.trim();
  if (!s) return { status: 'empty', hint: '' };
  if (!s.includes('@')) return { status: 'invalid', hint: 'Email must contain an @.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s)) return { status: 'invalid', hint: "That doesn't look like a full email address." };
  return { status: 'valid', hint: '' };
}

function checkMessage(v: string): Check {
  const s = v.trim();
  if (!s) return { status: 'empty', hint: '' };
  if (hasProfanity(s)) return { status: 'invalid', hint: 'Please keep it respectful.' };
  if (s.length < 5) return { status: 'invalid', hint: 'Say a little more (5+ characters).' };
  return { status: 'valid', hint: '' };
}

const goHome = () => {
  window.history.pushState({}, '', '/');
  window.dispatchEvent(new PopStateEvent('popstate'));
};

export default function ContactPage() {
  const [values, setValues] = useState<Record<FieldKey, string>>({ name: '', email: '', message: '' });
  const [focused, setFocused] = useState<FieldKey | null>(null);
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState(false);

  const checks: Record<FieldKey, Check> = {
    name: checkName(values.name),
    email: checkEmail(values.email),
    message: checkMessage(values.message),
  };
  const allValid = (Object.keys(checks) as FieldKey[]).every((k) => checks[k].status === 'valid');

  useEffect(() => {
    window.scrollTo(0, 0);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') goHome();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const update = (key: FieldKey, value: string) => {
    setValues((v) => ({ ...v, [key]: value }));
    setSent(false);
  };

  // idle (not focused) = theme accent border; focused = green / red once there is input
  const stateClass = (key: FieldKey) => {
    if (focused !== key || checks[key].status === 'empty') return '';
    return checks[key].status === 'valid' ? ' is-valid' : ' is-invalid';
  };

  const fieldProps = (key: FieldKey) => ({
    id: `contact-${key}`,
    value: values[key],
    className: `contact-page__control${stateClass(key)}`,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => update(key, e.target.value),
    onFocus: () => setFocused(key),
    onBlur: () => setFocused((f) => (f === key ? null : f)),
    'aria-invalid': checks[key].status === 'invalid',
    'aria-describedby': `contact-${key}-hint`,
  });

  const hint = (key: FieldKey) => (
    <small id={`contact-${key}-hint`} className="contact-page__hint" aria-live="polite">
      {checks[key].status === 'invalid' ? checks[key].hint : ''}
    </small>
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!allValid) return;
    const subject = `Portfolio inquiry from ${values.name.trim()}`;
    const body = `${values.message.trim()}\n\n— ${values.name.trim()} (${values.email.trim()})`;
    const url =
      `https://mail.google.com/mail/?view=cm&fs=1` +
      `&to=${encodeURIComponent(CONTACT_EMAIL)}` +
      `&su=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(body)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    setSent(true);
  };

  const allEmpty = !values.name && !values.email && !values.message;

  const handleClear = () => {
    setValues({ name: '', email: '', message: '' });
    setSent(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — the address is still visible on screen
    }
  };

  return (
    <section className="contact-page" aria-labelledby="contact-page-title">
      <div className="contact-page__inner">
        <div className="contact-page__intro">
          <button type="button" className="contact-page__back" onClick={goHome}>
            ← Back to site
          </button>

          <h1 id="contact-page-title" className="contact-page__title">
            Let's build something, <span className="contact-page__hl">together.</span>
          </h1>

          <p className="contact-page__subtitle">
            Fill this in and it'll open Gmail in a new tab with everything pre-filled — just hit send from there.
          </p>

          <p className="contact-page__direct">or email me directly at:</p>
          <button type="button" className="contact-page__chip" onClick={handleCopy}>
            {CONTACT_EMAIL}
            <span className="contact-page__chip-label">{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>

        <form className="contact-page__form" onSubmit={handleSubmit} noValidate>
          <div className="contact-page__field">
            <label htmlFor="contact-name" className="contact-page__sr">Full name</label>
            <input type="text" placeholder="Full Name" autoComplete="name" {...fieldProps('name')} />
            {hint('name')}
          </div>

          <div className="contact-page__field">
            <label htmlFor="contact-email" className="contact-page__sr">Email</label>
            <input type="email" placeholder="Email" autoComplete="email" {...fieldProps('email')} />
            {hint('email')}
          </div>

          <div className="contact-page__field contact-page__field--grow">
            <label htmlFor="contact-message" className="contact-page__sr">Message</label>
            <textarea placeholder="Write something..." {...fieldProps('message')} />
            {hint('message')}
          </div>

          <div className="contact-page__actions">
            <button type="submit" className="contact-page__submit" disabled={!allValid}>
              Open in Gmail ↗
            </button>
            <button type="button" className="contact-page__clear" onClick={handleClear} disabled={allEmpty}>
              Clear entry
            </button>
          </div>
          <p className="contact-page__status" aria-live="polite">
            {sent ? 'Gmail opened in a new tab — hit send from there.' : ''}
          </p>
        </form>
      </div>
    </section>
  );
}