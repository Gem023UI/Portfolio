import { useState } from 'react';
import './Header.css';
import StaggeredMenu from './StaggeredMenu';
import ContactModal from './ContactModal';
import { SOCIAL_LINKS, NAV_LINKS } from './SiteLinks';

function Header() {
  const [contactOpen, setContactOpen] = useState(false);

  const handleMenuOpen = () => {
    document.body.classList.add('staggered-menu-open');
  };

  const handleMenuClose = () => {
    document.body.classList.remove('staggered-menu-open');
  };

  // Same list Footer renders; Contact gets its modal-opening behaviour added here.
  const menuItems = NAV_LINKS.map((item) =>
    item.label === 'Contact' ? { ...item, onClick: () => setContactOpen(true) } : item
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
          menuButtonColor="#111111"
          openMenuButtonColor="#111111"
          changeMenuColorOnOpen
          colors={['#734dff', '#5fcb3c']}
          accentColor="#734dff"
          isFixed
          onMenuOpen={handleMenuOpen}
          onMenuClose={handleMenuClose}
        />
      </div>

      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
    </header>
  );
}

export default Header;