import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import "./ContactModal.css";

const CONTACT_EMAIL = "malagajemuel@gmail.com";

export interface ContactModalProps {
  open: boolean;
  onClose: () => void;
}

function ContactModal({ open, onClose }: ContactModalProps) {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);

  // Entrance/exit animation
  useEffect(() => {
    const overlay = overlayRef.current;
    const card = cardRef.current;
    if (!overlay || !card) return;

    if (open) {
      gsap.set(overlay, { display: "flex" });
      gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "power2.out" });
      gsap.fromTo(
        card,
        { opacity: 0, y: 24, scale: 0.96 },
        { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: "back.out(1.6)" }
      );
    } else if (overlay.style.display !== "none") {
      gsap.to(card, { opacity: 0, y: 16, scale: 0.96, duration: 0.25, ease: "power2.in" });
      gsap.to(overlay, {
        opacity: 0,
        duration: 0.25,
        ease: "power2.in",
        onComplete: () => {
          gsap.set(overlay, { display: "none" });
        },
      });
    }
  }, [open]);

  // Escape key closes the modal
  useEffect(() => {
    if (!open) return undefined;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  // Prevent background scroll while the modal is up
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) onClose();
  };

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable — the address is still visible/selectable on screen
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = `Portfolio inquiry from ${name || "your site"}`;
    const body = `${message}\n\n— ${name}${email ? ` (${email})` : ""}`;
    const mailtoUrl = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  };

  return (
    <div
      className="contact-modal-overlay"
      ref={overlayRef}
      onClick={handleOverlayClick}
      role="presentation"
      style={{ display: "none" }}
    >
      <div
        className="contact-modal-card"
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-modal-title"
      >
        <div className="contact-modal-tab">
          <span className="contact-modal-tab__icon">✦</span>
          SAY HELLO
        </div>

        <button
          type="button"
          className="contact-modal-close"
          onClick={onClose}
          aria-label="Close contact form"
        >
          ✕
        </button>

        <div className="contact-modal-body">
          <h2 id="contact-modal-title" className="contact-modal-title">
            Let's build something together.
          </h2>
          <p className="contact-modal-subtitle">
            Fill this in and it'll open your email app with everything pre-filled — just hit send from there.
          </p>

          <form className="contact-modal-form" onSubmit={handleSubmit}>
            <label className="contact-modal-field">
              <span>Name</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
              />
            </label>

            <label className="contact-modal-field">
              <span>Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </label>

            <label className="contact-modal-field">
              <span>Message</span>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What's on your mind?"
                rows={4}
                required
              />
            </label>

            <button type="submit" className="contact-modal-submit">
              Open in email app ↗
            </button>
          </form>

          <div className="contact-modal-direct">
            <span>or email me directly:</span>
            <button type="button" className="contact-modal-email-chip" onClick={handleCopyEmail}>
              {CONTACT_EMAIL}
              <span className="contact-modal-copy-label">{copied ? "Copied!" : "Copy"}</span>
            </button>
          </div>
        </div>

        <div className="contact-modal-dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}

export default ContactModal;