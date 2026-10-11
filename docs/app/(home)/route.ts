import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import generateSEOData from 'lib/generateSEOData';
import { latestBlogUrl } from 'lib/latestBlogUrl';

export const dynamic = 'force-static';

const seo = generateSEOData({
  title: 'Plumeria - Zero-cost abstraction layer',
  subtitle: 'Plumeria is a zero-cost abstraction layer for styling React components.',
});

const css = readFileSync(join(process.cwd(), 'app/(home)/top.css'), 'utf8').replace(/\n\s*/g, '');

const themeScript = `try{var t=localStorage.getItem('theme');var d=t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches);var e=document.documentElement;e.classList.toggle('dark',d);e.style.colorScheme=d?'dark':'light'}catch(_){}`;

const speculationRules = JSON.stringify({
  prerender: [{ urls: ['/docs'], eagerness: 'immediate' }],
  prefetch: [{ where: { and: [{ href_matches: '/*' }, { not: { href_matches: '/' } }] }, eagerness: 'immediate' }],
});

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <script>${themeScript}</script>
    <title>${seo.title}</title>
    <meta name="description" content="${seo.description}">
    <link rel="canonical" href="${seo.metadataBase}${seo.alternates.canonical}">
    <meta property="og:title" content="${seo.openGraph.title}">
    <meta property="og:description" content="${seo.openGraph.description}">
    <meta property="og:url" content="${seo.metadataBase}${seo.openGraph.url}">
    <meta property="og:type" content="website">
    <meta property="og:image" content="${seo.openGraph.images.url}">
    <meta property="og:image:width" content="${seo.openGraph.images.width}">
    <meta property="og:image:height" content="${seo.openGraph.images.height}">
    <meta name="twitter:card" content="${seo.twitter.card}">
    <meta name="twitter:title" content="${seo.twitter.title}">
    <meta name="twitter:description" content="${seo.twitter.description}">
    <meta name="twitter:image" content="${seo.twitter.images.url}">
    <link rel="icon" href="/favicon.ico" sizes="any">
    <link rel="icon" href="/icon.svg" type="image/svg+xml">
    <link rel="apple-touch-icon" href="/apple-icon.png">
    <link rel="preload" href="/fonts/inter-latin.woff2" as="font" type="font/woff2" crossorigin>
    <style>${css}</style>
    <script type="speculationrules">${speculationRules}</script>
    <script defer src="/_vercel/insights/script.js"></script>
  </head>
  <body>
    <header class="header">
      <nav class="nav">
        <a href="/" class="brand"><img src="/logo.svg" alt="" width="24" height="24">Plumeria</a>
        <button type="button" popovertarget="home-menu" aria-label="Toggle Menu" class="toggle">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
        </button>
        <div id="home-menu" popover="auto" class="menu">
          <a href="/docs" class="menu-link">Docs</a>
          <a href="/playground" class="menu-link">Playground</a>
          <a href="https://github.com/zss-in-js/plumeria" target="_blank" rel="noreferrer noopener" class="menu-link external">
            GitHub
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M11 5H4v15h15v-7"/><path d="M14 3h7v7M21 3 11 13"/></svg>
          </a>
        </div>
      </nav>
    </header>
    <main class="main">
      <div class="page">
        <div class="hero">
          <h1 class="title">Plumeria</h1>
          <p class="description">Type-safe styling for <span class="emphasis">React</span>.<br><span class="emphasis">Rust-compiled</span> zero-runtime atomic CSS.</p>
          <div class="actions">
            <a href="/docs" class="button primary">Get started</a>
            <a href="/docs/why-plumeria" class="button">Why Plumeria?</a>
          </div>
        </div>
        <footer class="footer">
          <nav aria-label="Resources" class="groups">
            <div>
              <h2 class="heading">Develop</h2>
              <ul class="list">
                <li><a href="/docs/api-reference" class="link">API</a></li>
                <li><a href="/docs/testing" class="link">Testing</a></li>
              </ul>
            </div>
            <div>
              <h2 class="heading">Explore</h2>
              <ul class="list">
                <li><a href="/playground" class="link">Playground</a></li>
                <li><a href="${latestBlogUrl}" class="link">Blog</a></li>
              </ul>
            </div>
            <div>
              <h2 class="heading">Concepts</h2>
              <ul class="list">
                <li><a href="/docs/specificity" class="link">Specificity</a></li>
                <li><a href="/docs/composition-laws" class="link">Composition laws</a></li>
              </ul>
            </div>
            <div>
              <h2 class="heading">Skill</h2>
              <ul class="list">
                <li><a href="/docs/ai-agent-resources" class="link">AI Agent Resources</a></li>
                <li><a href="/privacy" class="link">Privacy</a></li>
              </ul>
            </div>
          </nav>
        </footer>
      </div>
    </main>
  </body>
</html>
`;

export function GET() {
  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } });
}
