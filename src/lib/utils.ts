import type {
	IpadCursorStyle,
	MaybeDuration,
	MaybeSize
} from './types.ts';

export function clamp(num: number, min: number, max: number): number {
	return Math.min(Math.max(num, min), max);
}

export function isNum(v: string | number): boolean {
	return typeof v === 'number' || /^\d+$/.test(v);
}

export function getSize(size: MaybeSize): string {
	if (isNum(size)) return `${size}px`;
	return String(size);
}

export function getDuration(duration: MaybeDuration): string {
	if (isNum(duration)) return `${duration}ms`;
	return `${duration}`;
}

export function objectKeys<T extends string>(obj: Partial<Record<T, any>>): T[] {
	return Object.keys(obj) as T[];
}

const STYLE_VAR_MAP: Record<keyof IpadCursorStyle, string> = {
	backdropBlur: '--cursor-bg-blur',
	backdropSaturate: '--cursor-bg-saturate',
	background: '--cursor-bg',
	border: '--cursor-border',
	durationBackdropFilter: '--cursor-blur-duration',
	durationBase: '--cursor-duration',
	durationPosition: '--cursor-position-duration',
	height: '--cursor-height',
	radius: '--cursor-radius',
	scale: '--cursor-scale',
	width: '--cursor-width',
	zIndex: '--cursor-z-index'
};

/**
 * Convert an {@link IpadCursorStyle} object into a map of CSS custom property
 * names to their stringified values, ready to be applied to the fake cursor.
 */
export function style2Vars(style: Partial<IpadCursorStyle>): Record<string, string> {
	const result: Record<string, string> = {};
	for (const key of objectKeys(style) as (keyof IpadCursorStyle)[]) {
		const raw = style[key];
		if (raw === undefined) continue;

		let value: string = raw as string;

		if (key === 'width' || key === 'height' || key === 'radius' || key === 'backdropBlur') {
			value = getSize(raw as MaybeSize);
		} else if (key.startsWith('duration')) {
			value = getDuration(raw as MaybeDuration);
		}

		const cssKey = STYLE_VAR_MAP[key] ?? key;
		result[cssKey] = value;
	}
	return result;
}

function isMergeableObject(obj: unknown): obj is Record<string, any> {
	return !!obj && typeof obj === 'object' && !Array.isArray(obj);
}

/**
 * Recursively merge `sources` into `obj` (mutating `obj`).
 * Returns the same reference as `obj`.
 */
export function mergeDeep<T>(obj: T, ...sources: any[]): T {
	if (!sources.length) return obj;
	const source = sources.shift();
	if (source === undefined) return obj;
	if (isMergeableObject(obj) && isMergeableObject(source)) {
		objectKeys(source).forEach((key) => {
			if (isMergeableObject(source[key])) {
				if (!obj[key]) Object.assign(obj, { [key]: {} });
				mergeDeep(obj[key], source[key]);
			} else {
				Object.assign(obj, { [key]: source[key] });
			}
		});
	}
	return mergeDeep(obj, ...sources);
}

/**
 * Parse a legacy `data-cursor-style="background: red; radius: 8px"` string
 * into a plain object. Used by the imperative API and the action's `style`
 * shorthand.
 */
export function parseStyleString(raw: string): Record<string, string> {
	const out: Record<string, string> = {};
	raw.split(';').forEach((segment) => {
		const [key, value] = segment.split(':').map((s) => s?.trim());
		if (key && value !== undefined) out[key] = value;
	});
	return out;
}

/**
 * Build a string compatible with the legacy `data-cursor-style` attribute.
 * Useful when porting existing markup or when you need to set the style
 * declaratively outside of the action.
 *
 * @example
 * ```ts
 * <div data-cursor="block" data-cursor-style={customCursorStyle({ background: 'red' })} />
 * ```
 */
export function customCursorStyle(style: IpadCursorStyle & Record<string, any>): string {
	return Object.entries(style)
		.filter(([, v]) => v !== undefined)
		.map(([k, v]) => `${k}: ${v}`)
		.join('; ');
}
