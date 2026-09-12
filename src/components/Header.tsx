import { useState } from 'react';
import './Header.css';
import StaggeredMenu from './StaggeredMenu';

const menuItems = [
  {
    label: 'Home',
    ariaLabel: 'Go to home page',
    link: '/',
  },
  {
    label: 'About',
    ariaLabel: 'Learn about me',
    link: '/about',
  },
  {
    label: 'Projects',
    ariaLabel: 'View my projects',
    link: '/projects',
  },
  {
    label: 'Tech Stack',
    ariaLabel: 'View my technology stack',
    link: '/tech-stack',
  },
  {
    label: 'Certifications',
    ariaLabel: 'View my certifications',
    link: '/certifications',
  },
  {
    label: 'Blogs',
    ariaLabel: 'Read my blogs',
    link: '/blogs',
  },
];

const socialItems = [
  {
    label: 'GitHub',
    link: 'https://github.com/Gem023UI',
  },
  {
    label: 'LinkedIn',
    link: 'https://linkedin.com',
  },
];

function Header() {
  return (
    <header className="header">
      <div className="header__backdrop" />

      <a href="/" className="header__logo" aria-label="Jemuel Malaga">
        Jemuel Malaga
      </a>

      <div className="header__menu">
        <StaggeredMenu
          position="left"
          items={menuItems}
          socialItems={socialItems}
          displaySocials
          displayItemNumbering
          menuButtonColor="#111111"
          openMenuButtonColor="#111111"
          changeMenuColorOnOpen
          colors={['#B497CF', '#5227FF']}
          accentColor="#7C3AED"
          isFixed
        />
      </div>
    </header>
  );
}

export default Header;