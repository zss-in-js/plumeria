let currentlyExecutingFile: string | null = null;

export const setCurrentlyExecutingFile = (filePath: string | null): void => {
  currentlyExecutingFile = filePath;
};

export const getCurrentlyExecutingFile = (): string | null => {
  return currentlyExecutingFile;
};
