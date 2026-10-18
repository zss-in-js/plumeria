import { latestBlogUrl } from 'lib/latestBlogUrl';

export const footerGroups = [
  {
    heading: 'Develop',
    links: [
      { label: 'API', href: '/docs/api-reference' },
      { label: 'Testing', href: '/docs/testing' },
    ],
  },
  {
    heading: 'Explore',
    links: [
      { label: 'Playground', href: '/playground' },
      { label: 'Blog', href: latestBlogUrl },
    ],
  },
  {
    heading: 'Participate',
    links: [
      { label: 'GitHub', href: 'https://github.com/zss-in-js/plumeria', external: true },
      { label: 'Acknowledgements', href: '/docs/acknowledgements' },
    ],
  },
  {
    heading: 'AI',
    links: [
      { label: 'Claude Plugin', href: 'https://claude.ai/directory?q=Plumeria', external: true },
      { label: 'AI Agent Resources', href: '/docs/ai-agent-resources' },
    ],
  },
];

export const copyright = '© zss-in-js contributors';
