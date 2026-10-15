import * as css from '@plumeria/core';
import { HmrClientBox } from 'component/hmr-client-chromium';

const page = css.create({
  note: {
    color: '#4c4c4c',
  },
});

export default function HmrClientPage() {
  return (
    <main>
      <h1>HMR client edit</h1>
      <HmrClientBox>
        <p data-testid="hmr-client-server-child" classStyle={page.note}>
          a server child inside the client component
        </p>
      </HmrClientBox>
    </main>
  );
}
