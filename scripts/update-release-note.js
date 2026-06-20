const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const changesetDir = path.join(__dirname, '../.changeset');
const releaseNotePath = path.join(__dirname, '../RELEASENOTE.md');
const corePackageJsonPath = path.join(
  __dirname,
  '../packages/core/package.json',
);

function main() {
  const changes = [];

  if (fs.existsSync(changesetDir)) {
    const files = fs.readdirSync(changesetDir);
    for (const file of files) {
      if (file.endsWith('.md') && file !== 'README.md') {
        const filePath = path.join(changesetDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const parts = content.split('---');
        if (parts.length >= 3) {
          const description = parts.slice(2).join('---').trim();
          if (description) {
            const lines = description.split('\n');
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed) continue;
              const cleanLine = trimmed.replace(/^[-*\s]+/, '');
              if (cleanLine.toLowerCase().includes('bump version to')) {
                continue;
              }
              if (cleanLine) {
                changes.push(cleanLine);
              }
            }
          }
        }
      }
    }
  }

  console.log('Running changeset version...');
  execSync('pnpm changeset version', { stdio: 'inherit' });

  console.log('Updating lockfile...');
  execSync('pnpm install --lockfile-only', { stdio: 'inherit' });

  const corePackageJson = JSON.parse(
    fs.readFileSync(corePackageJsonPath, 'utf-8'),
  );
  const newVersion = corePackageJson.version;

  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const d = new Date();
  const month = months[d.getMonth()];
  const day = d.getDate();
  const year = d.getFullYear();
  const dateStr = `${month} ${day}, ${year}`;

  const uniqueChanges = Array.from(new Set(changes));
  if (uniqueChanges.length === 0) {
    console.log('No user-facing changes found to append to RELEASENOTE.md.');
    return;
  }

  const newEntryLines = [
    `## ${newVersion} (${dateStr})`,
    '',
    ...uniqueChanges.map((change) => `- ${change}`),
    '',
  ];
  const newEntry = newEntryLines.join('\n');

  let currentContent = '';
  if (fs.existsSync(releaseNotePath)) {
    currentContent = fs.readFileSync(releaseNotePath, 'utf-8');
  } else {
    currentContent = '# Release Notes\n';
  }

  const versionHeading = `## ${newVersion} `;
  if (currentContent.includes(versionHeading)) {
    const startIndex = currentContent.indexOf(versionHeading);
    let endIndex = currentContent.indexOf(
      '\n## ',
      startIndex + versionHeading.length,
    );
    if (endIndex === -1) {
      endIndex = currentContent.length;
    }
    currentContent =
      currentContent.slice(0, startIndex) + currentContent.slice(endIndex);
  }

  let updatedContent = '';
  const headerIndex = currentContent.indexOf('# Release Notes');
  if (headerIndex !== -1) {
    const nextNewLineIndex = currentContent.indexOf('\n', headerIndex);
    if (nextNewLineIndex !== -1) {
      updatedContent =
        currentContent.slice(0, nextNewLineIndex + 1) +
        '\n' +
        newEntry +
        currentContent.slice(nextNewLineIndex + 1);
    } else {
      updatedContent = currentContent + '\n\n' + newEntry;
    }
  } else {
    updatedContent = '# Release Notes\n\n' + newEntry + currentContent;
  }

  fs.writeFileSync(releaseNotePath, updatedContent.trim() + '\n', 'utf-8');
  console.log(`Successfully updated RELEASENOTE.md with version ${newVersion}`);
}

main();
