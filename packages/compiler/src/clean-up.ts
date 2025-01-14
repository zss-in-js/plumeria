import { writeFileSync } from 'fs';
import path from 'path';

export const cleanUp = async () => {
  const projectRoot = process.cwd().split('node_modules')[0];
  const directPath = path.join(projectRoot, 'node_modules/@plumeria/core');

  const createFilePath = directPath + '/dist/styles/create.css';
  const globalFilePath = directPath + '/dist/styles/global.css';

  try {
    writeFileSync(createFilePath, '', 'utf-8');
    writeFileSync(globalFilePath, '', 'utf-8');
  } catch (err) {
    console.error('An error occurred:', err);
  }
};
