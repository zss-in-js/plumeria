import { css } from '../dist/index.js';

const result = css.defineTokens({
  fontSize: {},
  textAlign: {},
  testPrimary222HtmlTest: {},
  HTML222Test: {},
  HTMLTest: {},
  HTML2HTMLTest: {},
  HTML2: {},
  test2Test: {},
  testHTMLTest: {},
  testHTML2Test: {},
  testAPIResponse: {},
});

test('cx returns a string', () => {
  expect(result.fontSize).toBe('var(--font-size)');
  expect(result.textAlign).toBe('var(--text-align)');
  expect(result.testPrimary222HtmlTest).toBe(
    'var(--test-primary222-html-test)',
  );
  expect(result.HTML222Test).toBe('var(--html222-test)');
  expect(result.HTML2HTMLTest).toBe('var(--html2-html-test)');
  expect(result.HTMLTest).toBe('var(--html-test)');
  expect(result.HTML2).toBe('var(--html2)');
  expect(result.test2Test).toBe('var(--test2-test)');
  expect(result.testHTMLTest).toBe('var(--test-html-test)');
  expect(result.testHTML2Test).toBe('var(--test-html2-test)');
  expect(result.testAPIResponse).toBe('var(--test-api-response)');
  console.log(result.testAPIResponse);
});
