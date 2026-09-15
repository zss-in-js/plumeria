import '@plumeria/core';
import { keyframesStyle } from 'component/keyframes.styles';

export function KeyframesTest() {
  return (
    <div
      style={{ marginTop: '20px', border: '1px solid #ccc', padding: '10px' }}
    >
      <h3>Keyframes Test</h3>
      <div data-testid="keyframes-box" classStyle={keyframesStyle.box} />
    </div>
  );
}
