import './CertificateCard.css';

interface CertificateCardProps {
  title: string;
  date: string;
}

// Display-only card: an image placeholder (swap the SVG for a real <img src="..." /> once
// certificate images are ready), a title and a date, all in Instrument Serif.
export default function CertificateCard({ title, date }: CertificateCardProps) {
  return (
    <div className="cert-card">
      <div className="cert-card__frame">
        <div className="cert-card__placeholder" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
            <rect x="2.5" y="4" width="19" height="15" rx="1.5" />
            <circle cx="8.5" cy="10" r="1.75" />
            <path d="M2.5 16.5l5-4.5 3.5 3 4-4.5 6.5 6" />
          </svg>
        </div>
      </div>
      <div className="cert-card__title">{title}</div>
      <div className="cert-card__date">{date}</div>
    </div>
  );
}