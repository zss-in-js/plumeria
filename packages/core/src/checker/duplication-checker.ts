const varDefinitions = new Map<string, Map<string, number>>();

export const recordVarDefinition = (
  varName: string,
  filePath: string,
): void => {
  let filesMap = varDefinitions.get(varName);
  if (!filesMap) {
    filesMap = new Map<string, number>();
    varDefinitions.set(varName, filesMap);
  }
  const count = filesMap.get(filePath) || 0;
  filesMap.set(filePath, count + 1);
};

export const checkVarDuplications = (projectRoot: string): void => {
  for (const [varName, filesMap] of varDefinitions.entries()) {
    // Check for definitions in multiple files
    if (filesMap.size > 1) {
      console.warn(
        `
[Plumeria Warning] Defines API property '${varName}' is defined in multiple files:`,
      );
      for (const filePath of filesMap.keys()) {
        const relativePath = filePath.replace(`${projectRoot}/`, '');
        const displayPath = relativePath.replace(/-temp\.ts$/, '.ts');
        console.warn(`  - ${displayPath}`);
      }
      console.warn(
        `If the API is the same, the value from the last processed file will be applied.\n`,
      );
    }

    // Check for multiple definitions within a single file
    for (const [filePath, count] of filesMap.entries()) {
      if (count > 1) {
        const relativePath = filePath.replace(`${projectRoot}/`, '');
        const displayPath = relativePath.replace(/-temp\.ts$/, '.ts');
        console.warn(
          `
[Plumeria Warning] Defines API property '${varName}' is defined ${count} times in '${displayPath}'.`,
        );
        console.warn(
          `If the APIs are the same, the last definition in the file will be applied.\n`,
        );
      }
    }
  }
};

export const clearVarDefinitions = (): void => {
  varDefinitions.clear();
};
