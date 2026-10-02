import './Header.css';
import StaggeredMenu from './StaggeredMenu';
import { SOCIAL_LINKS, NAV_LINKS } from './SiteLinks';

function Header() {
  const handleMenuOpen = () => {
    document.body.classList.add('staggered-menu-open');
  };

  const handleMenuClose = () => {
    document.body.classList.remove('staggered-menu-open');
  };

  const openContactPage = () => {
    window.history.pushState({}, '', '/contact');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const menuItems = NAV_LINKS.map((item) =>
    item.label === 'Contact' ? { ...item, onClick: openContactPage } : item
  );

  return (
    <header className="header">
      <a href="/" className="header__logo" aria-label="Jemuel Malaga"></a>

      <div className="header__menu">
        <StaggeredMenu
          position="left"
          items={menuItems}
          socialItems={SOCIAL_LINKS}
          displaySocials
          displayItemNumbering
          menuButtonColor="var(--ink)"
          openMenuButtonColor="var(--ink)"
          changeMenuColorOnOpen
          accentColor="var(--hero-accent)"
          isFixed
          onMenuOpen={handleMenuOpen}
          onMenuClose={handleMenuClose}
        />
      </div>
    </header>
  );
}

export default Header;