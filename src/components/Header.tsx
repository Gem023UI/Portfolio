import './Header.css';
import StaggeredMenu from './StaggeredMenu';

const menuItems = [
  {
    label: 'Home',
    ariaLabel: 'Go to home page',
    link: '/',
  },
  {
    label: 'Projects',
    ariaLabel: 'View my projects',
    link: '/projects',
  },
  {
    label: 'Stack',
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
    label: 'Facebook',
    icon: 'fi fi-brands-facebook',
    link: 'https://www.facebook.com/jemuel.malaga.023/',
  },
  {
    label: 'GitHub',
    icon: 'fi fi-brands-github',
    link: 'https://github.com/Gem023UI',
  },
  {
    label: 'Instagram',
    icon: 'fi fi-brands-instagram-circle',
    link: 'https://www.instagram.com/chase.jml/?hl=en',
  },
  {
    label: 'LinkedIn',
    icon: 'fi fi-brands-linkedin',
    link: 'https://www.linkedin.com/in/jemuel-malaga-870740287',
  },
];

function Header() {
  const handleMenuOpen = () => {
    document.body.classList.add('staggered-menu-open');
  };

  const handleMenuClose = () => {
    document.body.classList.remove('staggered-menu-open');
  };

  return (
    <header className="header">
      <a href="/" className="header__logo" aria-label="Jemuel Malaga"></a>

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
          colors={['#734dff', '#5fcb3c']}
          accentColor="#734dff"
          isFixed
          onMenuOpen={handleMenuOpen}
          onMenuClose={handleMenuClose}
        />
      </div>
    </header>
  );
}

export default Header;