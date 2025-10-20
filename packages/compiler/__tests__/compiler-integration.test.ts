import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { existsSync } from 'fs';
import fs from 'fs/promises';

const execPromise = promisify(exec);

const getStylesheetPath = () => {
  const corePackageJsonPath = require.resolve('@plumeria/core/package.json');
  return path.join(path.dirname(corePackageJsonPath), 'stylesheet.css');
};

test('CSS compilation generates expected stylesheet', async () => {
  const stylesheetPath = getStylesheetPath();

  if (existsSync(stylesheetPath)) {
    await fs.unlink(stylesheetPath);
  }

  await execPromise('pnpm exec css --view', {
    cwd: path.join(__dirname, '../../../test-e2e/site'),
  });

  const stylesheet = await fs.readFile(stylesheetPath, 'utf-8');

  expect(stylesheet).toContain('color: orange;');
  expect(stylesheet).toContain('color: pink;');
  expect(stylesheet).toContain('@media (max-width: 1024px)');
  expect(stylesheet).toContain('color: #0ff;');
  expect(stylesheet).toContain('font-size: 14px;');
  expect(stylesheet).toContain('color: green;');
}, 15000);
