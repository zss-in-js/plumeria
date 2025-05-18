/* eslint-disable @plumeria/validate-values */
import { default as css } from '../src/css';

const result = css.defineVars({
  fontSize: '',
  textAlign: '',
  testPrimary220HtmlTest: '',
  HTML222Test: '',
  HTML2HTMLTest: '',
  testHTMLTest: '',
  testHTML2Test: '',
  test2Test: '',
});

test('cx returns a string', () => {
  expect(result.fontSize).toBe('var(--font-size)');
  expect(result.textAlign).toBe('var(--text-align)');
  expect(result.testPrimary220HtmlTest).toBe(
    'var(--test-primary220-html-test)',
  );
  expect(result.HTML222Test).toBe('var(--html-222-test)');
  expect(result.test2Test).toBe('var(--test2-test)');
  expect(result.testHTML2Test).toBe('var(--test-html-2-test)');
  expect(result.testHTMLTest).toBe('var(--test-htmltest)');
  expect(result.HTML2HTMLTest).toBe('var(--html-2-htmltest)');
});
