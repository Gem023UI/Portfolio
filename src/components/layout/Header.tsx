import "./Header.css";

const NAV_LINKS = [
  { label: "about", href: "#about" },
  { label: "ui/ux", href: "#ui-ux" },
  { label: "cloud", href: "#cloud" },
  { label: "certifications", href: "#certifications" },
  { label: "community", href: "#community" },
  { label: "contact", href: "#contact" },
];

export default function Header() {
  return (
    <header className="site-header">
      <a href="#" className="site-header__logo" aria-label="Home">
        <img src="/coffee.png" alt="" width={50} height={50} />
      </a>

      <nav className="site-header__nav" aria-label="Primary">
        <ul className="site-header__list">
          {NAV_LINKS.map(({ label, href }, i) => (
            <li
              key={label}
              className="site-header__item"
              style={{ animationDelay: `${0.15 + i * 0.08}s` }}
            >
              <a href={href} className="site-header__link">
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}