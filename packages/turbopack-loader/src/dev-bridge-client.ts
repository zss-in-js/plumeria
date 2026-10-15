export function carryStylesheet(css: string, id: string, bridgeId: string) {
  if (typeof document === 'undefined') return;
  const landed = () =>
    Array.from(document.styleSheets).some((sheet) => {
      if ((sheet.ownerNode as Element | null)?.id === bridgeId) return false;
      try {
        return Array.from(sheet.cssRules).some((rule) => {
          const selector = (rule as CSSStyleRule).selectorText;
          return typeof selector === 'string' && selector.includes(id);
        });
      } catch {
        return false;
      }
    });
  const current = document.getElementById(bridgeId);
  if (landed()) {
    if (current && current.dataset.generation === id) current.remove();
    return;
  }
  const style = current ?? document.createElement('style');
  style.id = bridgeId;
  style.dataset.generation = id;
  style.textContent = css;
  document.head.appendChild(style);
  const stop = () => {
    observer.disconnect();
    document.removeEventListener('load', settle, true);
  };
  const settle = () => {
    if (style.dataset.generation !== id) return stop();
    if (!landed()) return;
    style.remove();
    stop();
  };
  const observer = new MutationObserver(settle);
  observer.observe(document.head, {
    childList: true,
    subtree: true,
    attributes: true,
  });
  document.addEventListener('load', settle, true);
}
