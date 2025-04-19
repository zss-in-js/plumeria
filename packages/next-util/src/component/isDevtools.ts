export function isDevTools(): boolean {
  const devtools = /./;
  (devtools as any).toString = function () {
    this.opened = true;
  };
  String(devtools);

  return Boolean((devtools as any).opened);
}
