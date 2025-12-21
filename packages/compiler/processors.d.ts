declare module '@plumeria/core/processors' {
  export const gQueue: {
    build(filePath: string): Promise<void>;
  };
  export const pQueue: {
    build(filePath: string): Promise<void>;
  };
}
