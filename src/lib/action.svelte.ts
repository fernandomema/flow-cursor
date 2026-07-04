import type { Action } from 'svelte/action';
import { cursor } from './controller.svelte.ts';
import type { IpadCursorActionParam, IpadCursorConfig } from './types.ts';

export interface FlowCursorOptions extends IpadCursorActionParam {
	initConfig?: IpadCursorConfig;
}

const apply = (node: HTMLElement, p: FlowCursorOptions | undefined) => {
	cursor.unregister(node);
	if (!p?.type || p.type === 'normal') return;
	cursor.register(node, p.type, p.style);
};

export const flowCursor: Action<HTMLElement, FlowCursorOptions | undefined> = (node, param) => {
	let initConfig: IpadCursorConfig | undefined = param?.initConfig;
	if (!cursor.ready) cursor.init(initConfig);

	apply(node, param);

	return {
		update(next) {
			if (initConfig === undefined && next?.initConfig) initConfig = next.initConfig;
			apply(node, next);
		},
		destroy() {
			cursor.unregister(node);
		}
	};
};

/** @deprecated Use `flowCursor` instead. */
export const ipadCursor = flowCursor;
