import { getLeadingCommentLength } from '../src/ast';

describe('getLeadingCommentLength', () => {
  it.each([
    ['', 0],
    ['const value = 1;', 0],
    ['\ufeffconst value = 1;', 1],
    [' \n\r\tconst value = 1;', 4],
    ['#!/usr/bin/env node', 19],
    ['#!/usr/bin/env node\nconst value = 1;', 20],
    [
      '\ufeff#!/usr/bin/env node\n// generated\n/* header */\nconst value = 1;',
      47,
    ],
    ['// comment', 10],
    ['// comment\nconst value = 1;', 11],
    ['/* comment */const value = 1;', 13],
    ['/* ** comment */const value = 1;', 16],
    ['/* unterminated', 14],
    ['/', 0],
    ['/not-a-comment', 0],
  ])('returns the leading trivia length for %j', (source, expected) => {
    expect(getLeadingCommentLength(source)).toBe(expected);
  });
});
