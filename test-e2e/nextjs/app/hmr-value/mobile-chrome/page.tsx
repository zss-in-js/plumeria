import '@plumeria/core';
import { hmrValue } from 'component/hmr-value-mobile-chrome.styles';

export default function HmrValuePage() {
  return (
    <main>
      <h1>HMR value edit</h1>
      <div data-testid="hmr-value-box" classStyle={hmrValue.box}>
        the style module and the page update separately
      </div>
    </main>
  );
}
