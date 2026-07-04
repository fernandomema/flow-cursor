import type { Action } from 'svelte/action';
import { cursor } from './controller.svelte.ts';
import type { IpadCursorStyle } from './types.ts';

export type CursorStyleOverride = IpadCursorStyle | Record<string, any> | string | undefined;

function makeShortcut(
	type: 'block' | 'text'
): Action<HTMLElement, CursorStyleOverride> {
	return (node, style) => {
		if (!cursor.ready) cursor.init();

		const apply = (s: CursorStyleOverride) => {
			cursor.unregister(node);
			cursor.register(node, type, s);
		};

		apply(style);

		return {
			update(next) {
				apply(next);
			},
			destroy() {
				cursor.unregister(node);
			}
		};
	};
}

export const blockCursor = makeShortcut('block');
export const textCursor = makeShortcut('text');
