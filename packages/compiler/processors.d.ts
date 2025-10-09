declare module '@plumeria/core/processors' {
  export function buildGlobal(filePath: string): Promise<void>;
  export function buildProps(filePath: string): Promise<void>;
}
