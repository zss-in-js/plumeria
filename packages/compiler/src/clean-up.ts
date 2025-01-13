import { writeFileSync } from 'fs';
import { join } from 'path';

export const cleanUp = async () => {
  const createFilePath = join(__dirname, '../../core/dist/styles/create.css');
  const globalFilePath = join(__dirname, '../../core/dist/styles/global.css');
  try {
    writeFileSync(createFilePath, '', 'utf-8');
    writeFileSync(globalFilePath, '', 'utf-8');
  } catch (err) {
    console.error('An error occurred:', err);
  }
};
