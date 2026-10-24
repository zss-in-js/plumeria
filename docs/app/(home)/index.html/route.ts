import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import generateSEOData from 'lib/generateSEOData';
import { copyright, footerGroups, footerSocialLinks } from 'lib/footerGroups';

export const dynamic = 'force-static';

const seo = generateSEOData({
  title: 'Plumeria - Zero-cost abstraction layer',
  subtitle: 'Plumeria is a zero-cost abstraction layer for styling React components.',
});

const cssVersion = (file: string) =>
  createHash('sha256')
    .update(readFileSync(join(process.cwd(), 'public', file)))
    .digest('hex')
    .slice(0, 8);

const themeScript = `try{var t=localStorage.getItem('theme');var d=t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches);var e=document.documentElement;e.classList.toggle('dark',d);e.style.colorScheme=d?'dark':'light'}catch(_){}`;

const themeToggleScript = `document.querySelector('.theme').addEventListener('click',()=>{var e=document.documentElement,d=!e.classList.contains('dark'),t=d?'dark':'light';try{localStorage.setItem('theme',t)}catch(_){}e.classList.toggle('dark',d);e.style.colorScheme=t})`;

const githubIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.026 2c-5.509 0-9.974 4.465-9.974 9.974c0 4.406 2.857 8.145 6.821 9.465c.499.09.679-.217.679-.481c0-.237-.008-.865-.011-1.696c-2.775.602-3.361-1.338-3.361-1.338c-.452-1.152-1.107-1.459-1.107-1.459c-.905-.619.069-.605.069-.605c1.002.07 1.527 1.028 1.527 1.028c.89 1.524 2.336 1.084 2.902.829c.091-.645.351-1.085.635-1.334c-2.214-.251-4.542-1.107-4.542-4.93c0-1.087.389-1.979 1.024-2.675c-.101-.253-.446-1.268.099-2.64c0 0 .837-.269 2.742 1.021a9.582 9.582 0 0 1 2.496-.336a9.554 9.554 0 0 1 2.496.336c1.906-1.291 2.742-1.021 2.742-1.021c.545 1.372.203 2.387.099 2.64c.64.696 1.024 1.587 1.024 2.675c0 3.833-2.33 4.675-4.552 4.922c.355.308.675.916.675 1.846c0 1.334-.012 2.41-.012 2.737c0 .267.178.577.687.479C19.146 20.115 22 16.379 22 11.974C22 6.465 17.535 2 12.026 2z"/></svg>`;

const sunIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2m-7.07-17.07 1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>`;

const moonIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`;

const heroHeightScript = `(()=>{var w=0,e=document.documentElement;function s(){if(innerWidth!==w){w=innerWidth;e.style.setProperty('--hero-height',innerHeight+'px')}}s();addEventListener('resize',s)})()`;

const speculationRules = JSON.stringify({
  prefetch: [{ where: { and: [{ href_matches: '/*' }, { not: { href_matches: '/' } }] }, eagerness: 'immediate' }],
});

const externalIcon = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M11 5H4v15h15v-7"/><path d="M14 3h7v7M21 3 11 13"/></svg>`;

const footerLinkHtml = ({ label, href, external }: { label: string; href: string; external?: boolean }) =>
  external
    ? `<a href="${href}" target="_blank" rel="noreferrer noopener" class="site-footer-link site-footer-external">${label}${externalIcon}</a>`
    : `<a href="${href}" class="site-footer-link">${label}</a>`;

const footerGroupsHtml = footerGroups
  .map(
    ({ heading, links }) =>
      `<div><h2 class="site-footer-heading">${heading}</h2><ul class="site-footer-list">${links.map((link) => `<li>${footerLinkHtml(link)}</li>`).join('')}</ul></div>`,
  )
  .join('');

const footerSocialHtml = footerSocialLinks
  .map(
    ({ label, href, path }) =>
      `<a href="${href}" target="_blank" rel="noreferrer noopener" aria-label="${label}" class="site-footer-social-link"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="${path}"/></svg></a>`,
  )
  .join('');

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <script>${themeScript}</script>
    <script>${heroHeightScript}</script>
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
    <link rel="stylesheet" href="/top.css?v=${cssVersion('top.css')}">
    <link rel="stylesheet" href="/footer.css?v=${cssVersion('footer.css')}">
    <script type="speculationrules">${speculationRules}</script>
    <script defer src="/_vercel/insights/script.js"></script>
    <script defer src="/_vercel/speed-insights/script.js"></script>
  </head>
  <body>
    <header class="header">
      <nav class="nav">
        <a href="/" class="brand"><img src="/logo.svg" alt="" width="24" height="24">Plumeria</a>
        <button type="button" popovertarget="home-menu" aria-label="Toggle Menu" class="toggle">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
        </button>
        <div id="home-menu" popover="auto" class="menu">
          <div class="menu-body">
            <a href="/docs" class="menu-link">Docs</a>
            <a href="/playground" class="menu-link">Playground</a>
            <div class="menu-actions">
              <a href="https://github.com/zss-in-js/plumeria" target="_blank" rel="noreferrer noopener" aria-label="GitHub" class="icon-link">${githubIcon}</a>
              <button type="button" aria-label="Toggle Theme" class="theme"><span class="theme-icon theme-light">${sunIcon}</span><span class="theme-icon theme-dark">${moonIcon}</span></button>
            </div>
          </div>
        </div>
      </nav>
    </header>
    <main class="main">
      <div class="page">
        <div class="hero">
          <h1 class="title">Plumeria</h1>
          <p class="description">Type-safe styling for <span class="emphasis">React</span>.<br><span class="emphasis">Rust-compiled</span> zero-runtime atomic CSS.</p>
          <div class="actions">
            <a href="/docs" class="button primary">Get started<svg class="arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a>
            <a href="/docs/why-plumeria" class="button">Why Plumeria?</a>
          </div>
        </div>
        <footer class="site-footer">
          <nav aria-label="Resources" class="site-footer-groups">
${footerGroupsHtml}
          </nav>
          <div class="site-footer-legal"><span>${copyright}</span><span aria-hidden="true">·</span><a href="/privacy" class="site-footer-link">privacy</a><div class="site-footer-social">${footerSocialHtml}</div></div>
        </footer>
      </div>
    </main>
    <script>${themeToggleScript}</script>
  </body>
</html>
`;

export function GET() {
  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } });
}
