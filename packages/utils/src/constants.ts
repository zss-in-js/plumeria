/**
 * The JSX prop that carries styles.
 *
 * Every consumer defaults to this; it is shared rather than repeated because
 * the name is checked in three independent passes — the turbopack loader, the
 * unplugin transform, and the compiler that collects the stylesheet — and they
 * have to agree or a style is transformed without its CSS being emitted.
 */
export const DEFAULT_STYLE_PROP = 'styleName';
