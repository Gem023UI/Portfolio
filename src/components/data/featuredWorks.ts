export type FeaturedMedia =
  | { type: 'image'; src: string; alt?: string }
  | { type: 'video'; src: string; poster?: string };

export interface FeaturedProject {
  id: string;
  title: string;
  description: string;
  media: FeaturedMedia;
  href?: string;
}

export const FEATURED_TITLE = 'Featured Works';

export const featuredProjects: FeaturedProject[] = [
  {
    id: 'project-1',
    title: 'Sample Project',
    description: 'sample description sample description sample description',
    media: { type: 'image', src: 'https://i.pinimg.com/736x/32/16/82/32168265d299f371982d1353f149eaf0.jpg', alt: 'Sample Project 1' },
  },
  {
    id: 'project-2',
    title: 'Sample Project',
    description: 'sample description sample description sample description',
    media: { type: 'video', src: 'https://i.pinimg.com/1200x/39/bb/9e/39bb9eff586fe9ebdf7a0c3dba1d18a8.jpg', poster: 'https://i.pinimg.com/1200x/39/bb/9e/39bb9eff586fe9ebdf7a0c3dba1d18a8.jpg' },
  },
  {
    id: 'project-3',
    title: 'Sample Project',
    description: 'sample description sample description sample description',
    media: { type: 'image', src: 'https://i.pinimg.com/1200x/dc/fb/17/dcfb17e9334c906c8a62273ae0a34900.jpg', alt: 'Sample Project 3' },
  },
];