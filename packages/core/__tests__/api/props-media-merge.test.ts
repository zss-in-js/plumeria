import { props } from '../../src/api/props';
import { create } from '../../src/api/create';
import * as cssProcessor from '../../src/processors/css';

jest.mock('../../src/processors/css', () => ({
  ...jest.requireActual('../../src/processors/css'),
  initPromise_1: jest.fn(),
  resolvePromise_1: jest.fn(),
}));

describe('props media query merge', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should merge properties within the same media query from different style objects', () => {
    const s1 = create({
      test: {
        '@media (min-width: 500px)': {
          color: 'red',
        },
      },
    });

    const s2 = create({
      test: {
        '@media (min-width: 500px)': {
          background: 'blue',
        },
      },
    });

    // Combine both styles
    props(s1.test, s2.test);

    // Get the generated CSS passed to resolvePromise_1
    const generatedCSS = (cssProcessor.resolvePromise_1 as jest.Mock).mock
      .calls[0][0];

    // Both properties should be present in the CSS
    // Currently (with bug), one might be missing or overwritten
    expect(generatedCSS).toContain('color: red');
    expect(generatedCSS).toContain('background: blue');
  });
});
