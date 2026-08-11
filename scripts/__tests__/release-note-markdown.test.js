const { normalizeReleaseNote } = require('../release-note-markdown');

test('joins wrapped prose without turning it into a list', () => {
  expect(
    normalizeReleaseNote(
      'A component renders\non its own.\n\nThe styles\nstay in place.',
    ),
  ).toBe('A component renders on its own.\n\nThe styles stay in place.');
});

test('preserves bullets that the author explicitly wrote', () => {
  expect(
    normalizeReleaseNote(
      'Summary\n\n- First item\n  continues here\n- Second item',
    ),
  ).toBe('Summary\n\n- First item continues here\n\n- Second item');
});
