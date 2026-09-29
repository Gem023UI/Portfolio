// Single source of truth for the social links and page nav, shared by Header (StaggeredMenu)
// and Footer so the two never drift out of sync.

export interface SocialLink {
  label: string;
  icon: string;
  link: string;
}

export interface NavLink {
  label: string;
  ariaLabel: string;
  link: string;
}

export const SOCIAL_LINKS: SocialLink[] = [
  { label: 'Facebook', icon: 'fi fi-brands-facebook', link: 'https://www.facebook.com/jemuel.malaga.023/' },
  { label: 'GitHub', icon: 'fi fi-brands-github', link: 'https://github.com/Gem023UI' },
  { label: 'Instagram', icon: 'fi fi-brands-instagram-circle', link: 'https://www.instagram.com/chase.jml/?hl=en' },
  { label: 'LinkedIn', icon: 'fi fi-brands-linkedin', link: 'https://www.linkedin.com/in/jemuel-malaga-870740287' },
];

// Header.tsx adds the Contact item's onClick (it opens the ContactModal, which is Header's own
// state); Footer just renders this list as-is with a plain anchor for Contact.
export const NAV_LINKS: NavLink[] = [
  { label: 'Home', ariaLabel: 'Go to home page', link: '/' },
  { label: 'Projects', ariaLabel: 'View my projects', link: '/projects' },
  { label: 'Stack', ariaLabel: 'View my technology stack', link: '/tech-stack' },
  { label: 'Certifications', ariaLabel: 'View my certifications', link: '/certifications' },
  { label: 'Blogs', ariaLabel: 'Read my blogs', link: '/blogs' },
  { label: 'Contact', ariaLabel: 'Open the contact form', link: '#contact' },
];