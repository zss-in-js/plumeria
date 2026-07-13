'use client';

import * as React from 'react';
import * as css from '@plumeria/core';

let isCssInjected = false;
const injectInspectorCSS = () => {
  if (typeof document === 'undefined' || isCssInjected) return;
  const styleId = 'plumeria-inspector-styles';
  if (document.getElementById(styleId)) {
    isCssInjected = true;
    return;
  }
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = '__INLINE_CSS__';
  document.head.appendChild(style);
  isCssInjected = true;
};

// Style definitions using Plumeria
const styles = css.create({
  toggleBadge: {
    position: 'fixed',
    right: '16px',
    bottom: '16px',
    zIndex: 9999999,
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    padding: '8px 16px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize: '12px',
    fontWeight: 500,
    color: '#e5e7eb',
    cursor: 'pointer',
    userSelect: 'none',
    backgroundColor: 'rgba(17, 24, 39, 0.85)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '9999px',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.25)',
    backdropFilter: 'blur(12px)',
    transition: 'all 0.2s ease',
  },
  toggleBadgeActive: {
    borderColor: '#a855f7',
    boxShadow: '0 4px 20px rgba(168, 85, 247, 0.35)',
  },
  statusDot: {
    width: '8px',
    height: '8px',
    backgroundColor: '#9ca3af',
    borderRadius: '50%',
    transition: 'background-color 0.2s ease',
  },
  statusDotActive: {
    backgroundColor: '#a855f7',
    boxShadow: '0 0 8px #a855f7',
  },
  overlay: (top: string, left: string, width: string, height: string) => ({
    position: 'fixed',
    pointerEvents: 'none',
    border: '1px dashed #a855f7',
    backgroundColor: 'rgba(168, 85, 247, 0.06)',
    zIndex: 999999,
    transition: 'all 0.08s cubic-bezier(0.16, 1, 0.3, 1)',
    top,
    left,
    width,
    height,
  }),
  tooltip: (
    pointerEvents: 'auto' | 'none',
    top: string,
    left: string,
    opacity: number | string,
    transform: string,
  ) => ({
    position: 'fixed',
    zIndex: 1000000,
    backgroundColor: 'rgba(17, 24, 39, 0.9)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '12px',
    padding: '12px 16px',
    boxShadow:
      '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
    color: '#f3f4f6',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    width: '320px',
    transition: 'opacity 0.15s ease-out, transform 0.15s ease-out',
    pointerEvents,
    top,
    left,
    opacity,
    transform,
  }),
  title: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '6px',
    fontSize: '13px',
    fontWeight: 'bold',
  },
  tag: {
    marginRight: '6px',
    fontFamily: 'monospace',
    color: '#67e8f9',
  },
  classNameText: {
    padding: '2px 6px',
    fontFamily: 'monospace',
    fontSize: '11px',
    color: '#c084fc',
    wordBreak: 'break-all',
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    borderRadius: '4px',
  },
  rulesContainer: {
    maxHeight: '180px',
    paddingTop: '8px',
    marginTop: '6px',
    overflowY: 'auto',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
  },
  ruleBlock: {
    marginBottom: '8px',
  },
  selector: {
    display: 'block',
    marginBottom: '2px',
    fontFamily: 'monospace',
    fontSize: '11px',
    color: '#a5b4fc',
  },
  propertyLine: {
    display: 'block',
    paddingLeft: '12px',
    fontFamily: 'monospace',
    fontSize: '11px',
    lineHeight: '1.4',
    color: '#d1d5db',
  },
  propertyName: {
    color: '#f472b6',
  },
  propertyValue: {
    color: '#93c5fd',
  },
  emptyText: {
    fontSize: '11px',
    fontStyle: 'italic',
    color: '#9ca3af',
  },
  hintText: {
    paddingTop: '6px',
    marginTop: '8px',
    fontSize: '10px',
    fontStyle: 'italic',
    color: '#9ca3af',
    textAlign: 'center',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
  },
});

interface RuleInfo {
  selector: string;
  cssText: string;
}

const getClassName = (el: HTMLElement | SVGElement | null): string => {
  if (!el) return '';
  const className = el.className;
  if (typeof className === 'string') {
    return className;
  }
  if (className && typeof className.baseVal === 'string') {
    return className.baseVal;
  }
  return '';
};

const getStylesForElement = (el: HTMLElement): RuleInfo[] => {
  const rulesFound: RuleInfo[] = [];

  const traverse = (rule: CSSRule | CSSStyleSheet) => {
    try {
      const rules = 'cssRules' in rule ? Array.from(rule.cssRules) : [];
      for (const r of rules) {
        if (r instanceof CSSStyleRule) {
          if (el.matches(r.selectorText)) {
            rulesFound.push({
              selector: r.selectorText,
              cssText: r.style.cssText,
            });
          }
        } else if ('cssRules' in r) {
          traverse(r);
        }
      }
    } catch (e) {
      // Ignore cross-origin stylesheet / nested rule errors
    }
  };

  for (const sheet of Array.from(document.styleSheets)) {
    traverse(sheet);
  }

  return rulesFound;
};

const parseCssText = (cssText: string): { name: string; value: string }[] => {
  if (!cssText) return [];
  return cssText
    .split(';')
    .map((p) => p.trim())
    .filter(Boolean)
    .map((prop) => {
      const index = prop.indexOf(':');
      if (index === -1) return null;
      return {
        name: prop.substring(0, index).trim(),
        value: prop.substring(index + 1).trim(),
      };
    })
    .filter((x): x is { name: string; value: string } => x !== null);
};

const DevInspector = ({ initial }: { initial: boolean }) => {
  React.useEffect(() => {
    injectInspectorCSS();
  }, []);

  const [isActive, setIsActive] = React.useState(initial);
  const [isFrozen, setIsFrozen] = React.useState(false);
  const [hoveredElement, setHoveredElement] =
    React.useState<HTMLElement | null>(null);
  const [overlayStyle, setOverlayStyle] = React.useState<React.CSSProperties>({
    opacity: 0,
  });
  const [tooltipStyle, setTooltipStyle] = React.useState<React.CSSProperties>({
    opacity: 0,
  });
  const [rules, setRules] = React.useState<RuleInfo[]>([]);

  const tooltipRef = React.useRef<HTMLDivElement>(null);

  // Toggle active state with Alt + I or Cmd + I
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.altKey || e.metaKey) && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        setIsActive((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Listen to Shift key to toggle freeze state (fixed macOS Shift + scroll issue)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsFrozen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Listen to mouseover when active and not frozen
  React.useEffect(() => {
    if (!isActive) {
      setHoveredElement(null);
      setOverlayStyle({ opacity: 0 });
      setTooltipStyle({ opacity: 0 });
      return;
    }

    const handleMouseOver = (e: MouseEvent) => {
      if (isFrozen) return;

      const target = e.target as HTMLElement;
      if (!target) return;

      // If hovering over inspector UI, don't change target
      if (target.closest('[data-plumeria-inspector-ignore]')) {
        return;
      }

      // Clear target if hovering over root document structure
      if (target === document.documentElement || target === document.body) {
        setHoveredElement(null);
        return;
      }

      setHoveredElement(target);
    };

    document.addEventListener('mouseover', handleMouseOver);
    return () => {
      document.removeEventListener('mouseover', handleMouseOver);
    };
  }, [isActive, isFrozen]);

  // Fetch rules only when hoveredElement changes
  React.useEffect(() => {
    if (!hoveredElement || !isActive) {
      setRules([]);
      return;
    }
    setRules(getStylesForElement(hoveredElement));
  }, [hoveredElement, isActive]);

  // Track and position relative to hoveredElement
  React.useEffect(() => {
    if (!hoveredElement || !isActive) return;

    const update = () => {
      const rect = hoveredElement.getBoundingClientRect();
      setOverlayStyle({
        top: `${rect.top}px`,
        left: `${rect.left}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        opacity: 1,
      });

      // Measure tooltip dimensions dynamically
      const tooltipWidth = tooltipRef.current
        ? tooltipRef.current.offsetWidth
        : 320;
      const tooltipHeight = tooltipRef.current
        ? tooltipRef.current.offsetHeight
        : 180;
      const margin = 20; // Elegant distance
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Position tooltip near the top-right of the hovered element
      let top = rect.top - tooltipHeight - margin;
      let left = rect.right - tooltipWidth;

      if (top < margin) {
        // Position below if it overflows the top
        top = rect.bottom + margin;
      }
      if (left < margin) {
        left = margin;
      }
      if (left + tooltipWidth > viewportWidth - margin) {
        left = viewportWidth - tooltipWidth - margin;
      }
      if (top + tooltipHeight > viewportHeight - margin) {
        top = rect.top - tooltipHeight - margin;
      }

      setTooltipStyle({
        top: `${top}px`,
        left: `${left}px`,
        opacity: 1,
        transform: 'none',
      });
    };

    update();

    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });

    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [hoveredElement, isActive, isFrozen]);

  return (
    <React.Fragment>
      {/* Dynamic toggle badge */}
      <div
        data-plumeria-inspector-ignore="true"
        styleName={[styles.toggleBadge, isActive && styles.toggleBadgeActive]}
        onClick={() => setIsActive((prev) => !prev)}
      >
        <span
          styleName={[styles.statusDot, isActive && styles.statusDotActive]}
        />
        <span>
          Inspector: {isActive ? 'ON' : 'OFF'}{' '}
          <span style={{ opacity: 0.6 }}>(⌘ + I)</span>
        </span>
      </div>

      {/* Target element highlight overlay */}
      {isActive && hoveredElement && (
        <div
          data-plumeria-inspector-ignore="true"
          styleName={styles.overlay(
            (overlayStyle.top as string) || '0px',
            (overlayStyle.left as string) || '0px',
            (overlayStyle.width as string) || '0px',
            (overlayStyle.height as string) || '0px',
          )}
        />
      )}

      {/* CSS Properties Tooltip */}
      {isActive && hoveredElement && (
        <div
          ref={tooltipRef}
          data-plumeria-inspector-ignore="true"
          styleName={styles.tooltip(
            isFrozen ? 'auto' : 'none',
            (tooltipStyle.top as string) || '0px',
            (tooltipStyle.left as string) || '0px',
            tooltipStyle.opacity ?? 0,
            (tooltipStyle.transform as string) || 'none',
          )}
        >
          <div styleName={styles.title}>
            <span styleName={styles.tag}>
              &lt;{hoveredElement.tagName.toLowerCase()}&gt;
            </span>
            {getClassName(hoveredElement) && (
              <span styleName={styles.classNameText}>
                .
                {getClassName(hoveredElement)
                  .split(' ')
                  .filter(Boolean)
                  .join(' .')}
              </span>
            )}
          </div>
          <div styleName={styles.rulesContainer}>
            {rules.length === 0 ? (
              <div styleName={styles.emptyText}>No matching CSS rules</div>
            ) : (
              rules.map((rule, idx) => {
                const parsedProps = parseCssText(rule.cssText);
                return (
                  <div key={idx} styleName={styles.ruleBlock}>
                    <span styleName={styles.selector}>
                      {rule.selector} {'{'}
                    </span>
                    {parsedProps.map((prop, pIdx) => (
                      <span key={pIdx} styleName={styles.propertyLine}>
                        <span styleName={styles.propertyName}>{prop.name}</span>
                        {': '}
                        <span styleName={styles.propertyValue}>
                          {prop.value}
                        </span>
                        {';'}
                      </span>
                    ))}
                    <span styleName={styles.selector}>{'}'}</span>
                  </div>
                );
              })
            )}
          </div>
          <div styleName={styles.hintText}>
            {isFrozen
              ? '❄️ Targeting Locked (Press Shift to unlock)'
              : '⚡ Press Shift to lock targeting & scroll rules'}
          </div>
        </div>
      )}
    </React.Fragment>
  );
};

export const Inspector = ({
  production = false,
  initial = false,
}: {
  production?: boolean;
  initial?: boolean;
}) => {
  if (!production && process.env.NODE_ENV === 'production') {
    return null;
  }
  return <DevInspector initial={initial} />;
};
