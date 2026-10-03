const { buildSkill } = require('../build-skill');

test('replaces the docs frontmatter with the skill frontmatter', () => {
  const skill = buildSkill('---\ntitle: AI.md\n---\n\n## Rules\n');
  expect(skill.startsWith('---\nname: plumeria\ndescription: ')).toBe(true);
  expect(skill).not.toContain('title: AI.md');
  expect(skill.endsWith('## Rules\n')).toBe(true);
});
