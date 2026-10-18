import Link from 'next/link';
import { copyright, footerGroups } from 'lib/footerGroups';

const ExternalIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M11 5H4v15h15v-7" />
    <path d="M14 3h7v7M21 3 11 13" />
  </svg>
);

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <nav aria-label="Resources" className="site-footer-groups">
        {footerGroups.map(({ heading, links }) => (
          <div key={heading}>
            <h2 className="site-footer-heading">{heading}</h2>
            <ul className="site-footer-list">
              {links.map(({ label, href, external }) => (
                <li key={label}>
                  {external ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="site-footer-link site-footer-external"
                    >
                      {label}
                      <ExternalIcon />
                    </a>
                  ) : (
                    <Link href={href} className="site-footer-link">
                      {label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      <div className="site-footer-legal">
        <span>{copyright}</span>
        <span aria-hidden="true">·</span>
        <Link href="/privacy" className="site-footer-link">
          privacy
        </Link>
      </div>
    </footer>
  );
}
