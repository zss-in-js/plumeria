const BULLET = /^\s*([-*+])\s+(.*)$/;

/**
 * Keep the author's Markdown structure while undoing hard line wrapping.
 * Plain text becomes a paragraph; only text that was written as a list stays
 * a list.
 */
const normalizeReleaseNote = (markdown) => {
  const blocks = [];
  let paragraph = [];

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      blocks.push(paragraph.join(' '));
      paragraph = [];
    }
  };

  for (const raw of markdown.split('\n')) {
    const text = raw.trim();
    if (!text) {
      flushParagraph();
      continue;
    }

    const bullet = raw.match(BULLET);
    if (bullet) {
      flushParagraph();
      blocks.push(`- ${bullet[2].trim()}`);
      continue;
    }

    if (blocks.at(-1)?.startsWith('- ') && /^\s+/.test(raw)) {
      blocks[blocks.length - 1] += ` ${text}`;
    } else {
      paragraph.push(text);
    }
  }

  flushParagraph();
  return blocks.join('\n\n');
};

module.exports = { normalizeReleaseNote };
