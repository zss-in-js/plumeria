import * as css from '@plumeria/core';

export const svg = {
  PlumeriaLogo({ size = 220, styleArray }: { size?: number; styleArray?: css.Style }) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 200 200"
        fill="url(#plumeria)"
        width={size}
        height={size}
        aria-label="Plumeria logo"
        role="img"
        classStyle={styleArray}
      >
        <defs>
          <linearGradient id="plumeria" x1="18" y1="18" x2="182" y2="182" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#22D3EE" />
            <stop offset="1" stopColor="#1B5CFF" />
          </linearGradient>
        </defs>
        <path d="M102.42 102.59C100.31 72.99 74.93 68.76 60.13 51.84C38.99 28.58 83.39-3.13 110.88 11.67C140.48 28.58 125.68 72.99 102.42 102.59Z" />
        <path d="M102.42 102.59C129.92 91.43 126.1 65.99 137.62 46.69C153.2 19.39 197.09 51.82 191.51 82.54C184.57 115.92 137.76 115.56 102.42 102.59Z" />
        <path d="M102.42 102.59C121.53 125.3 144.54 113.8 166.46 118.79C197.24 125.18 179.96 176.94 149.02 181.12C115.13 184.83 101 140.21 102.42 102.59Z" />
        <path d="M102.42 102.59C86.73 127.78 104.77 146.12 106.81 168.5C110.24 199.75 55.67 199.31 42.14 171.18C28.13 140.09 66.2 112.87 102.42 102.59Z" />
        <path d="M102.42 102.59C73.61 95.45 61.75 118.28 41.09 127.13C12.44 140.05-4.01 88.02 18.56 66.45C43.8 43.52 81.45 71.32 102.42 102.59Z" />
      </svg>
    );
  },

  Ghost() {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      >
        <title>Ghost SVG Icon</title>
        <path d="M12 3a7 7 0 0 0-7 7v10l2.33-2.33 2.34 2.33 2.33-2.33 2.34 2.33 2.33-2.33L19 20V10a7 7 0 0 0-7-7Z"></path>
        <circle cx="9.5" cy="11" r="1" fill="currentColor" stroke="none"></circle>
        <circle cx="14.5" cy="11" r="1" fill="currentColor" stroke="none"></circle>
      </svg>
    );
  },

  /*
   * Author: Gerrit Halfmann
   * License: MIT
   */
  Atom() {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
        <title>Atom 2 SVG Icon</title>
        <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
          <path d="M18.893 7.936a8.003 8.003 0 0 1-7.774 12.016m-6.012-3.888a8.003 8.003 0 0 1 7.774-12.016"></path>
          <circle cx="17.657" cy="6.343" r="2" fill="currentColor" transform="rotate(45 17.657 6.343)"></circle>
          <circle cx="6.343" cy="17.657" r="2" fill="currentColor" transform="rotate(45 6.343 17.657)"></circle>
          <circle cx="12" cy="12" r="2" fill="currentColor" transform="rotate(45 12 12)"></circle>
        </g>
      </svg>
    );
  },

  Graph() {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
        <title>Module Graph SVG Icon</title>
        <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
          <circle cx="12" cy="5" r="2" fill="currentColor"></circle>
          <circle cx="5" cy="19" r="2" fill="currentColor"></circle>
          <circle cx="19" cy="19" r="2" fill="currentColor"></circle>
          <path d="M10.5 8 6.5 16"></path>
          <path d="M13.5 8 17.5 16"></path>
          <path d="M8 19h8"></path>
        </g>
      </svg>
    );
  },

  Exchange() {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
        <title>Exchange SVG Icon</title>
        <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
          <path d="M4 8h16"></path>
          <path d="m16 4 4 4-4 4"></path>
          <path d="M20 16H4"></path>
          <path d="m8 12-4 4 4 4"></path>
        </g>
      </svg>
    );
  },

  /*
   * Author: Boxicons
   * License: MIT
   */
  Bluesky(props: React.SVGProps<SVGSVGElement>) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" {...props}>
        <title>Bluesky SVG Icon</title>
        <path
          fill="gray"
          d="M6.34 4.38C8.63 6.1 11.1 9.59 12 11.46c.91-1.87 3.37-5.36 5.66-7.08c1.65-1.24 4.34-2.2 4.34.86c0 .61-.35 5.13-.56 5.86c-.71 2.55-3.32 3.2-5.63 2.81c4.04.69 5.07 2.97 2.85 5.25c-4.22 4.33-6.07-1.09-6.54-2.47c-.09-.25-.13-.37-.13-.27c0-.1-.04.02-.13.27c-.47 1.39-2.32 6.81-6.54 2.47c-2.22-2.28-1.19-4.56 2.85-5.25c-2.31.39-4.92-.26-5.63-2.81c-.21-.73-.56-5.25-.56-5.86c0-3.06 2.68-2.1 4.34-.85Z"
        />
      </svg>
    );
  },

  /*
   * Author: Boxicons
   * License: MIT
   */
  Github(props: React.SVGProps<SVGSVGElement>) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" {...props}>
        <title>Bxl Github SVG Icon</title>
        <path
          d="M12.026 2c-5.509 0-9.974 4.465-9.974 9.974c0 4.406 2.857 8.145 6.821 9.465c.499.09.679-.217.679-.481c0-.237-.008-.865-.011-1.696c-2.775.602-3.361-1.338-3.361-1.338c-.452-1.152-1.107-1.459-1.107-1.459c-.905-.619.069-.605.069-.605c1.002.07 1.527 1.028 1.527 1.028c.89 1.524 2.336 1.084 2.902.829c.091-.645.351-1.085.635-1.334c-2.214-.251-4.542-1.107-4.542-4.93c0-1.087.389-1.979 1.024-2.675c-.101-.253-.446-1.268.099-2.64c0 0 .837-.269 2.742 1.021a9.582 9.582 0 0 1 2.496-.336a9.554 9.554 0 0 1 2.496.336c1.906-1.291 2.742-1.021 2.742-1.021c.545 1.372.203 2.387.099 2.64c.64.696 1.024 1.587 1.024 2.675c0 3.833-2.33 4.675-4.552 4.922c.355.308.675.916.675 1.846c0 1.334-.012 2.41-.012 2.737c0 .267.178.577.687.479C19.146 20.115 22 16.379 22 11.974C22 6.465 17.535 2 12.026 2z"
          fill="gray"
        ></path>
      </svg>
    );
  },

  /*
  /* Author: Lineicons
  /* License: MIT
  */
  Discord(props: React.SVGProps<SVGSVGElement>) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" {...props}>
        <title>Discord SVG Icon</title>
        <path
          fill="gray"
          d="M18.942 5.555a16.3 16.3 0 0 0-4.126-1.296a12 12 0 0 0-.529 1.097a15.2 15.2 0 0 0-4.573 0A12 12 0 0 0 9.18 4.26c-1.448.25-2.834.692-4.129 1.3c-2.611 3.946-3.319 7.794-2.965 11.587a16.5 16.5 0 0 0 5.06 2.593q.613-.841 1.084-1.785a10.7 10.7 0 0 1-1.706-.83q.215-.16.418-.331c3.29 1.539 6.866 1.539 10.118 0q.206.171.418.33a10.6 10.6 0 0 1-1.71.833a13 13 0 0 0 1.084 1.785a16.5 16.5 0 0 0 5.064-2.595c.415-4.398-.71-8.21-2.973-11.59M8.678 14.813c-.988 0-1.798-.922-1.798-2.045s.792-2.047 1.798-2.047c1.005 0 1.815.922 1.798 2.047c.001 1.123-.793 2.045-1.798 2.045m6.644 0c-.988 0-1.798-.922-1.798-2.045s.793-2.047 1.798-2.047c1.006 0 1.816.922 1.798 2.047c0 1.123-.793 2.045-1.798 2.045"
        ></path>
      </svg>
    );
  },
};
