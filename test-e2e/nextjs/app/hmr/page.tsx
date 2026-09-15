import '@plumeria/core';
import { hmrTarget } from 'component/hmr-target.styles';

export default function HmrPage() {
  return (
    <main>
      <h1>HMR rule order</h1>
      <div data-testid="hmr-box" classStyle={hmrTarget.box}>
        the media rule lands first, the base rule is added by a later edit
      </div>
    </main>
  );
}
