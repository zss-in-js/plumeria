import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execPromise = promisify(exec);

test('CSS compilation logs contain expected output', async () => {
  const { stdout } = await execPromise('npx css --log', {
    cwd: path.join(__dirname, '../../../test-e2e/site'),
  });

  console.log('stdout:', stdout);
  expect(stdout).toContain('Generated create CSS');
  expect(stdout).toContain('.e2e_');
  expect(stdout).toContain('color: pink;');
  expect(stdout).toContain('@media (max-width: 1024px)');
  expect(stdout).toContain('color: aqua;');
  // global and root are written at the same time.
  expect(stdout).toContain('Generated global CSS');
  expect(stdout).toContain('--mini: 12px');
  expect(stdout).toContain('color: cyan');
}, 15000);
