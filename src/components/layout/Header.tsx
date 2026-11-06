import "./Header.css";

const NAV_LINKS = [
  { label: "About", href: "#about" },
  { label: "UI/UX", href: "#ui-ux" },
  { label: "Cloud", href: "#cloud" },
  { label: "Certifications", href: "#certifications" },
  { label: "Community", href: "#community" },
  { label: "Contact", href: "#contact" },
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