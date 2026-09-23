type ClassStyle = unknown;

function collect(value: ClassStyle, into: string[]): void {
  if (!value) return;

  if (typeof value === 'string') {
    into.push(value);
    return;
  }

  if (Array.isArray(value)) {
    for (const entry of value) collect(entry, into);
    return;
  }

  if (typeof value === 'object') {
    for (const entry of Object.values(value as Record<string, unknown>)) {
      collect(entry, into);
    }
  }
}

export function resolveClassStyle(value: ClassStyle): string {
  const parts: string[] = [];
  collect(value, parts);
  return parts.join(' ');
}

export function withClassName<P extends Record<string, unknown>>(props: P | null): P | null {
  if (!props || !('classStyle' in props)) return props;

  const { classStyle, className, ...rest } = props as P & {
    classStyle?: ClassStyle;
    className?: string;
  };

  const resolved = [className, resolveClassStyle(classStyle)].filter(Boolean).join(' ');
  return { ...rest, ...(resolved ? { className: resolved } : {}) } as unknown as P;
}
