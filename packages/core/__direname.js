const fs = require('fs/promises');

const filePaths = [
  './dist/esm/method/create-build-helper.js',
  './dist/esm/method/global-build-helper.js',
];

(async () => {
  await Promise.all(
    filePaths.map(async (filePath) => {
      try {
        let content = await fs.readFile(filePath, 'utf-8');
        const lines = content.split('\n');
        lines.splice(2, 0, 'const __dirname = import.meta.dirname;');
        const updatedContent = lines.join('\n');

        await fs.writeFile(filePath, updatedContent);

        console.log(
          `Updated ${filePath}: Added 'const __dirname = import.meta.dirname;'`,
        );
      } catch (error) {
        console.error(`Error processing ${filePath}:`, error);
      }
    }),
  );

  console.log('All specified files have been processed successfully.');
})();
