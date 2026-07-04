/**
 * Imperative façade over the shared {@link import('./controller.svelte.ts').cursor}
 * controller. Mirrors the vanilla `ipad-cursor` API for users that prefer
 * an explicit `initCursor()` / `disposeCursor()` lifecycle, or that need
 * to use `data-cursor` attributes inside non-Svelte templates.
 */
import { cursor } from './controller.svelte.ts';
import { customCursorStyle as buildStyleString } from './utils.ts';
import type { IpadCursorConfig, IpadCursorStyle } from './types.ts';

export const CursorType = {
	TEXT: 'text',
	BLOCK: 'block'
} as const;

/**
 * Mount the fake cursor. Safe to call multiple times; subsequent calls
 * are no-ops unless the cursor was previously {@link disposeCursor disposed}.
 */
export function initCursor(_config?: IpadCursorConfig): void {
	cursor.init(_config);
}

/**
 * Tear down the cursor, the global stylesheet and all event listeners.
 */
export function disposeCursor(): void {
	cursor.dispose();
}

/**
 * Re-scan the document for `data-cursor` attributes and re-bind any
 * newly added nodes. Required by the imperative `data-cursor` API
 * after the DOM mutates, unless `enableAutoUpdateCursor` is on.
 */
export function updateCursor(): void {
	cursor.updateCursor();
}

/**
 * Merge a partial configuration into the current one. Properties are
 * deep-merged. The matching style is re-applied immediately.
 */
export function updateConfig(_config: IpadCursorConfig): IpadCursorConfig {
	return cursor.updateConfig(_config);
}

/**
 * Build a `data-cursor-style` compatible string from a typed style
 * object. Useful for declarative templates.
 *
 * @example
 * ```svelte
 * <div data-cursor="block" data-cursor-style={customCursorStyle({ background: 'red' })} />
 * ```
 */
export function customCursorStyle(style: IpadCursorStyle & Record<string, any>): string {
	return buildStyleString(style);
}

/**
 * Reset the cursor to the idle state, clearing any active hover.
 */
export function resetCursor(): void {
	cursor.reset();
}
