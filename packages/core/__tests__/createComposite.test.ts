import { default as css } from '../src/css';

test('cx returns a string', () => {
  const composed = css.createComposite('className', {
    lightBox: {
      fontSize: '12px',
    },
    textBox: {
      color: 'white',
    },
  });
  expect(composed.lightBox.startsWith('className')).toBe(true);
  expect(composed.textBox.startsWith('className')).toBe(true);
  expect(composed.lightBox).toContain('lightBox');
  expect(composed.textBox).toContain('textBox');
});
