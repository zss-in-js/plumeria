import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execPromise = promisify(exec);

test('Should be build successfully and logs contain expected output', async () => {
  const { stdout } = await execPromise('npm run build', {
    cwd: path.join(__dirname, '../../../test-e2e/site'),
  });

  console.log('stdout:', stdout);
  expect(stdout).toContain('Compiled successfully');
  expect(stdout).toContain('(Static)  prerendered as static content');
}, 35000);
