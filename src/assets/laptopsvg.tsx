// Flat front-view laptop. The acute-angle look comes from a CSS 3D transform
// applied in FeaturedWorks.css, so the SVG and the screen media distort together.
// Screen area in viewBox units: x54 y38 w692 h420 (mirrored in .fw-screen).
export default function LaptopSvg({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 800 560"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="fw-lid" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3d3f44" />
          <stop offset="1" stopColor="#25262a" />
        </linearGradient>
        <linearGradient id="fw-deck" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a3c41" />
          <stop offset="1" stopColor="#26272b" />
        </linearGradient>
        <radialGradient id="fw-ground">
          <stop offset="0" stopColor="#000" stopOpacity="0.28" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx="400" cy="540" rx="400" ry="16" fill="url(#fw-ground)" />

      {/* lid */}
      <rect x="40" y="24" width="720" height="448" rx="24" fill="url(#fw-lid)" />
      <rect x="40.5" y="24.5" width="719" height="447" rx="23.5" fill="none" stroke="rgba(255,255,255,0.1)" />
      <rect x="54" y="38" width="692" height="420" rx="12" fill="#0b0b0c" />
      <circle cx="400" cy="31" r="2.5" fill="#15161a" />

      {/* deck */}
      <path d="M 24 468 H 776 L 800 506 H 0 Z" fill="url(#fw-deck)" />
      <path
        d="M 90 480 H 710 M 80 489 H 720 M 70 498 H 730"
        stroke="rgba(255,255,255,0.07)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <rect x="335" y="487" width="130" height="12" rx="4" fill="rgba(255,255,255,0.05)" />
      <rect x="0" y="506" width="800" height="22" rx="11" fill="#1b1c1f" />
    </svg>
  );
}