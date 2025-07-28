import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execPromise = promisify(exec);

test('CSS compilation logs contain expected output', async () => {
  const { stdout } = await execPromise('npx css --view', {
    cwd: path.join(__dirname, '../../../test-e2e/site'),
  });

  console.log('stdout:', stdout);
  expect(stdout).toContain('💫 css.props(...):');
  expect(stdout).toContain('color: pink;');
  expect(stdout).toContain('@media (max-width: 1024px)');
  expect(stdout).toContain('color: aqua;');
  // global and root are written at the same time.
  expect(stdout).toContain('💫 css.global(...):');
  expect(stdout).toContain('--mini: 12px');
  expect(stdout).toContain('color: #ffa0a0');
}, 15000);
