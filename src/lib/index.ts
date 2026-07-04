export { flowCursor, ipadCursor } from './action.svelte.ts';
export type { FlowCursorOptions } from './action.svelte.ts';
export { blockCursor, textCursor } from './shortcuts.svelte.ts';
export type { CursorStyleOverride } from './shortcuts.svelte.ts';
export { cursor } from './controller.svelte.ts';
export {
	CursorType,
	customCursorStyle,
	disposeCursor,
	initCursor,
	resetCursor,
	updateConfig,
	updateCursor
} from './api.ts';
export type {
	IpadCursorActionParam,
	IpadCursorConfig,
	IpadCursorStyle,
	ICursorType,
	MaybeColor,
	MaybeDuration,
	MaybeSize
} from './types.ts';
