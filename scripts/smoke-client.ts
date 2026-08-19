import { createServer } from 'vite';
import { renderToString } from 'react-dom/server';
import React from 'react';

const vite = await createServer({
  server: { middlewareMode: true },
  appType: 'spa',
  logLevel: 'error',
});

const blueprints = [
  {
    id: 'prj-test',
    prompt: 'test',
    timestamp: 'now',
    profile: {
      name: 'Acme Plumbing Co',
      tagline: 'Fast Reliable Local Plumbers',
      description: 'We fix leaks fast in Austin, TX.',
      phone: '(512) 555-0100',
      email: 'hello@acmeplumbing.test',
      address: '500 Congress Ave, Austin, TX 78701',
      hours: 'Mon - Fri: 8:00 AM - 6:00 PM',
      heroImage: 'https://example.com/hero.jpg',
      category: 'Home & Trade Services',
      theme: 'dark',
      primaryColor: '#00081e',
      accentColor: '#d97706',
    },
    services: [
      { title: 'Emergency Repairs', description: '24/7 leak and burst pipe response.', price: 'From $99', highlight: true },
    ],
    testimonials: [
      { quote: 'Great work, on time, fair price.', author: 'Jane D.', role: 'Austin, TX', rating: 5, verified: true },
    ],
    theme: 'dark',
    heroVariant: 'split',
    badges: ['Licensed & Insured', '5-Star Rated'],
    proofBadgeText: '4.9 Stars (128+ Reviews)',
    seo: { title: 'Acme Plumbing Co — Fast Reliable Local Plumbers', description: 'We fix leaks fast in Austin, TX.' },
  },
  {
    id: 'prj-light',
    prompt: 'test light',
    timestamp: 'now',
    profile: {
      name: 'Sunny Day Nursery',
      tagline: 'Growing Bright Futures',
      description: 'A nurturing preschool for Austin families.',
      phone: '(512) 555-0200',
      email: 'hello@sunnynursery.test',
      address: '10 Garden Rd, Austin, TX 78704',
      hours: 'Mon - Fri: 7:30 AM - 6:00 PM',
      heroImage: 'https://example.com/nursery.jpg',
      category: 'Professional & Medical',
      theme: 'light',
      accentColor: '#3b82f6',
    },
    services: [
      { title: 'Full-Day Care', description: 'Safe, structured full-day programs.', price: 'From $45/day' },
    ],
    testimonials: [
      { quote: 'Our daughter loves it here.', author: 'Maria G.', rating: 5, verified: true },
    ],
    theme: 'light',
    heroVariant: 'centered',
    badges: ['Licensed', 'CPR Certified'],
    proofBadgeText: '5.0 Stars (200+ Reviews)',
  },
];

(globalThis as any).document = { getElementById: () => null };
(globalThis as any).window = { __TXSONS_BLUEPRINT__: null };

const mod: any = await vite.ssrLoadModule('/src/ClientApp.tsx');
if (typeof mod.ClientApp !== 'function') {
  throw new Error('FAIL: ClientApp not exported');
}

for (const blueprint of blueprints) {
  (globalThis as any).window.__TXSONS_BLUEPRINT__ = blueprint;
  const html = renderToString(React.createElement(mod.ClientApp));

  const checks: Array<[string, string]> = [
    ['business name', blueprint.profile.name],
    ['phone', blueprint.profile.phone],
    ['tagline/headline', blueprint.profile.tagline],
    ['description', blueprint.profile.description],
    ['first service', blueprint.services[0].title],
    ['first testimonial', blueprint.testimonials[0].quote],
  ];
  const missing = checks.filter(([, needle]) => !html.includes(needle));
  if (missing.length > 0) {
    throw new Error(`FAIL [${blueprint.id}]: missing content ` + JSON.stringify(missing.map(([label]) => label)));
  }
  if (html.includes('Error: Site configuration missing')) {
    throw new Error(`FAIL [${blueprint.id}]: rendered missing-config error state`);
  }
  if (!html.includes('data-ts-site')) {
    throw new Error(`FAIL [${blueprint.id}]: missing data-ts-site theme root`);
  }
  if (blueprint.profile.accentColor && !html.includes(blueprint.profile.accentColor)) {
    throw new Error(`FAIL [${blueprint.id}]: accent color ${blueprint.profile.accentColor} not applied as theme token`);
  }
}

(globalThis as any).window.__TXSONS_BLUEPRINT__ = blueprints[0];
const html = renderToString(React.createElement(mod.ClientApp));
if (!html.includes('--ts-accent')) {
  throw new Error('FAIL: theme CSS variables not emitted');
}

await vite.close();
console.log(`SMOKE PASS: ${blueprints.length} client sites render with theme tokens + client data`);
process.exit(0);
