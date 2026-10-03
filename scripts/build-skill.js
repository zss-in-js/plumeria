const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const source = path.join(root, 'docs/content/docs/ai.md');
const target = path.join(root, 'plugins/plumeria/skills/plumeria/SKILL.md');

const FRONTMATTER = /^---\n[\s\S]*?\n---\n+/;

const buildSkill = (markdown) => {
  const body = markdown.replace(FRONTMATTER, '');
  return [
    '---',
    'name: plumeria',
    'description: Write, review, and fix styles with Plumeria (@plumeria/core) — css.create, the classStyle prop, css.use, selector rules, and compiler setup for Next.js, Vite, and other bundlers. Use whenever a project depends on @plumeria/core or the task touches Plumeria styles.',
    '---',
    '',
    '<!-- Generated from docs/content/docs/ai.md by scripts/build-skill.js. Do not edit. -->',
    '',
    'Before changing bundler or framework configuration, read https://plumeria.dev/docs/installation.md and the matching integration guide.',
    '',
    body,
  ].join('\n');
};

if (require.main === module) {
  fs.writeFileSync(target, buildSkill(fs.readFileSync(source, 'utf8')));
}

module.exports = { buildSkill };
