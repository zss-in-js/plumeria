type ClassStyle = unknown;

function collect(value: ClassStyle, classes: string[], atoms: Map<string, string>): void {
  if (!value) return;

  if (typeof value === 'string') {
    classes.push(value);
    return;
  }

  if (Array.isArray(value)) {
    for (const entry of value) collect(entry, classes, atoms);
    return;
  }

  if (typeof value === 'object') {
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      if (typeof entry !== 'string') {
        collect(entry, classes, atoms);
        continue;
      }
      atoms.delete(key);
      atoms.set(key, entry);
    }
  }
}

export function resolveClassStyle(value: ClassStyle): string {
  const classes: string[] = [];
  const atoms = new Map<string, string>();
  collect(value, classes, atoms);
  return [...classes, ...atoms.values()].join(' ');
}

export function withClassName<P extends Record<string, unknown>>(type: unknown, props: P | null): P | null {
  if (typeof type !== 'string' || !props || !('classStyle' in props)) return props;

  const { classStyle, className, ...rest } = props as P & {
    classStyle?: ClassStyle;
    className?: string;
  };

  const resolved = [className, resolveClassStyle(classStyle)].filter(Boolean).join(' ');
  return { ...rest, ...(resolved ? { className: resolved } : {}) } as unknown as P;
}
