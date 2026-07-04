import { browser } from './ssr.ts';
import { getDefaultConfig, buildCursorStyleSheet, DEFAULT_CLASS_NAME } from './defaults.ts';
import {
	clamp,
	customCursorStyle,
	mergeDeep,
	objectKeys,
	parseStyleString,
	style2Vars,
	getSize,
	getDuration
} from './utils.ts';
import type { IpadCursorConfig, IpadCursorStyle, ICursorType } from './types.ts';

type NodeOverrides = IpadCursorStyle | Record<string, any> | string | undefined;
type HandlerEntry = { event: string; handler: (...args: any[]) => void };

/**
 * Singleton controller. Ported line-for-line from the original
 * `ipad-cursor` library, with a `$state` flag for the imperative
 * `cursor.ready` reactive binding.
 */
class CursorController {
	ready = $state(false);

	private cursorEle: HTMLDivElement | null = null;
	private styleTag: HTMLStyleElement | null = null;
	private activeDom: Element | null = null;
	private isBlockActive = false;
	private isTextActive = false;
	private isMouseDown = false;
	private latestCursorStyle: Record<string, string> = {};
	private mousedownStyleRecover: Record<string, string> = {};
	private position = { x: -100, y: -100 };
	private registeredNodeSet = new Set<Element>();
	private eventMap = new Map<Element, HandlerEntry[]>();
	private observer: MutationObserver | null = null;
	private rafId: number | null = null;
	private lastNode: Element | null = null;
	private config: IpadCursorConfig = getDefaultConfig();
	// Track the previous value of the auto-detect flags so we only re-scan
	// when they transition from `false` to `true`. Without this, every
	// `updateConfig` call (which happens on every `$effect` run) would
	// re-scan and clobber nodes that were registered by `use:blockCursor`
	// with custom overrides.
	private _lastAutoBlockEnabled = false;
	private _lastAutoTextEnabled = false;

	private onMousemove = (e: MouseEvent) => {
		this.position.x = e.clientX;
		this.position.y = e.clientY;
		this.autoApplyTextCursor(e.target as HTMLElement);
	};

	private onMousedown = () => {
		if (this.isMouseDown || !this.config.enableMouseDownEffect) return;
		this.isMouseDown = true;
		this.mousedownStyleRecover = { ...this.latestCursorStyle };
		this.updateCursorStyle(style2Vars(this.config.mouseDownStyle ?? {}));
	};

	private onMouseup = () => {
		if (!this.isMouseDown || !this.config.enableMouseDownEffect) return;
		this.isMouseDown = false;
		const target = this.mousedownStyleRecover;
		const styleToRecover = objectKeys(
			style2Vars(this.config.mouseDownStyle ?? {})
		).reduce<Record<string, string>>(
			(prev, curr) => ({ ...prev, [curr]: target[curr] ?? '' }),
			{}
		);
		this.updateCursorStyle(styleToRecover);
	};

	private scrollHandler = () => {
		if (!browser) return;
		const currentNode = document.elementFromPoint(this.position.x, this.position.y);
		const mouseLeaveEvent = new MouseEvent('mouseleave', {
			bubbles: true,
			cancelable: true,
			view: window
		});
		if (currentNode !== this.lastNode && this.lastNode && mouseLeaveEvent) {
			this.lastNode.dispatchEvent(mouseLeaveEvent);
		}
		this.lastNode = currentNode;
	};

	private tick = () => {
		if (!browser || !this.cursorEle) return;
		if (!this.isBlockActive) {
			this.updateCursorStyle('--cursor-x', `${this.position.x}px`);
			this.updateCursorStyle('--cursor-y', `${this.position.y}px`);
		}
		this.rafId = window.requestAnimationFrame(this.tick);
	};

	private onMutate = () => {
		this.updateCursor();
		this.scanInteractiveElements();
		this.scanTextElements();
	};

	init(_config?: IpadCursorConfig): void {
		if (!browser || this.ready) return;
		if (_config) this.updateConfig(_config);
		this.ready = true;

		window.addEventListener('mousemove', this.onMousemove, { passive: true });
		window.addEventListener('mousedown', this.onMousedown);
		window.addEventListener('mouseup', this.onMouseup);
		window.addEventListener('scroll', this.scrollHandler, true);

		this.createCursor();
		this.createStyle();
		this.updateCursorPosition();
		this.updateCursor();
		this.scanInteractiveElements();
		this.scanTextElements();
		this.createObserver();
	}

	dispose(): void {
		if (!this.ready) return;
		this.ready = false;

		window.removeEventListener('mousemove', this.onMousemove);
		window.removeEventListener('mousedown', this.onMousedown);
		window.removeEventListener('mouseup', this.onMouseup);
		window.removeEventListener('scroll', this.scrollHandler, true);

		if (this.rafId !== null) {
			cancelAnimationFrame(this.rafId);
			this.rafId = null;
		}

		this.cursorEle?.remove();
		this.styleTag?.remove();
		this.styleTag = null;
		this.cursorEle = null;

		this.registeredNodeSet.forEach((node) => this.unregisterNode(node));
		this.observer?.disconnect();
		this.observer = null;
	}

	updateConfig(_config: IpadCursorConfig): IpadCursorConfig {
		if ('adsorptionStrength' in _config) {
			this.config.adsorptionStrength = clamp(_config.adsorptionStrength ?? 10, 0, 30);
		}
		this.config = mergeDeep({ ...this.config }, _config);

		if (!this.isBlockActive && !this.isTextActive && _config.normalStyle) {
			this.updateCursorStyle(style2Vars(this.config.normalStyle!));
		} else if (this.isBlockActive && _config.blockStyle) {
			this.updateCursorStyle(style2Vars(this.config.blockStyle!));
		} else if (this.isTextActive && _config.textStyle) {
			this.updateCursorStyle(style2Vars(this.config.textStyle!));
		}

		// Only re-scan when an auto-detect flag transitions from `false` to
		// `true`. Re-scanning on every `updateConfig` would clobber
		// `use:blockCursor` overrides because the scan registers the
		// matching node with no overrides.
		if (this.config.enableAutoBlockCursor && !this._lastAutoBlockEnabled) {
			this.scanInteractiveElements();
		}
		if (this.config.enableAutoTextCursor && !this._lastAutoTextEnabled) {
			this.scanTextElements();
		}
		this._lastAutoBlockEnabled = !!this.config.enableAutoBlockCursor;
		this._lastAutoTextEnabled = !!this.config.enableAutoTextCursor;

		return this.config;
	}

	register(node: Element, type: ICursorType, customStyle?: NodeOverrides): void {
		// `registerBlockNode` / `registerTextNode` are now idempotent and
		// add the node to `registeredNodeSet` themselves, so we can call
		// them directly without unregistering first. The auto-scan will
		// see the node is already registered and skip it.
		if (type === 'text') this.registerTextNode(node, customStyle);
		else if (type === 'block') this.registerBlockNode(node, customStyle);
	}

	unregister(node: Element): void {
		this.unregisterNode(node);
	}

	updateCursor(): void {
		if (!browser) return;
		if (!this.ready) this.init();
		if (!this.ready) return;

		const nodesMap = new Map<Element, true>();
		document.querySelectorAll('[data-cursor]').forEach((node) => {
			nodesMap.set(node, true);
			if (this.registeredNodeSet.has(node)) return;
			const type = node.getAttribute('data-cursor') as ICursorType | null;
			if (!type) return;
			this.registerNode(node, type);
		});

		this.registeredNodeSet.forEach((node) => {
			if (nodesMap.has(node)) return;
			this.unregisterNode(node);
		});
	}

	reset(): void {
		this.isBlockActive = false;
		this.isTextActive = false;
		this.resetCursorStyle();
	}

	applyStyleOverride(overrides: NodeOverrides): IpadCursorStyle {
		if (!overrides) return {};
		if (typeof overrides === 'string') return parseStyleString(overrides);
		return { ...overrides };
	}

	// --- Internal helpers --------------------------------------------------

	private createObserver(): void {
		const needsObserver =
			(this.config.enableAutoUpdateCursor || this.config.enableAutoBlockCursor) && browser;
		if (needsObserver) {
			this.observer = new MutationObserver(this.onMutate);
			this.observer.observe(document.body, { childList: true, subtree: true });
		}
	}

	/**
	 * Walk the DOM and register every native interactive element
	 * (`<button>`, `<a href>`, `[role="button"]`, submit inputs, `<summary>`,
	 * `<label for>`) as a block-cursor target. Uses `registerBlockNode` so
	 * the magnetic吸附, lighting and per-element event listeners all work
	 * exactly like a `use:blockCursor` action. Idempotent.
	 */
	private scanInteractiveElements(): void {
		if (!browser || !this.config.enableAutoBlockCursor) return;
		const selector =
			'button, a[href], [role="button"], input[type="submit"], input[type="button"], summary, label[for]';
		document.querySelectorAll(selector).forEach((el) => {
			if (el instanceof HTMLElement && !this.registeredNodeSet.has(el)) {
				this.registerBlockNode(el, undefined);
			}
		});
	}

	/**
	 * Walk the DOM and register every element that contains at least one
	 * direct text node (i.e. a child of `nodeType === 3` whose trimmed
	 * text is non-empty) as a text-cursor target. Elements that only
	 * contain child elements with text inside them (e.g. `<p><code>x</code></p>`)
	 * are skipped — we only register elements where a *direct* text node
	 * lives. Uses `registerTextNode` so it behaves exactly like
	 * `use:textCursor`. Idempotent.
	 */
	private scanTextElements(): void {
		if (!browser || !this.config.enableAutoTextCursor) return;
		const all = document.querySelectorAll('p, li, span, h1, h2, h3, h4, h5, h6, label, a, td, th, blockquote, article, section');
		all.forEach((el) => {
			if (!(el instanceof HTMLElement)) return;
			// If a block ancestor exists, this element must NOT be a text
			// target. If a previous scan pass already registered it as text,
			// undo that now.
			if (this.hasBlockAncestor(el)) {
				if (this.registeredNodeSet.has(el)) {
					this.unregisterNode(el);
					el.removeAttribute('data-cursor');
				}
				return;
			}
			// Already registered as a text target — idempotent.
			if (this.registeredNodeSet.has(el)) return;
			for (const child of el.childNodes) {
				if (child.nodeType === 3 && (child.textContent ?? '').trim() !== '') {
					this.registerTextNode(el, undefined);
					el.setAttribute('data-cursor', 'text');
					break;
				}
			}
		});
	}

	private hasBlockAncestor(el: Element): boolean {
		let current: Element | null = el.parentElement;
		while (current) {
			if (this.registeredNodeSet.has(current)) return true;
			current = current.parentElement;
		}
		return false;
	}

	private createCursor(): void {
		if (!browser) return;
		this.cursorEle = document.createElement('div');
		const lightingEle = document.createElement('div');
		this.cursorEle.classList.add(this.config.className ?? DEFAULT_CLASS_NAME);
		lightingEle.classList.add('lighting');
		this.cursorEle.appendChild(lightingEle);
		document.body.appendChild(this.cursorEle);
		this.resetCursorStyle();
	}

	private createStyle(): void {
		if (this.styleTag || !browser) return;
		this.styleTag = document.createElement('style');
		this.styleTag.innerHTML = buildCursorStyleSheet(this.config.className ?? DEFAULT_CLASS_NAME);
		document.head.appendChild(this.styleTag);
	}

	private updateCursorPosition(): void {
		if (!browser || !this.cursorEle) return;
		if (!this.isBlockActive) {
			this.updateCursorStyle('--cursor-x', `${this.position.x}px`);
			this.updateCursorStyle('--cursor-y', `${this.position.y}px`);
		}
		this.rafId = window.requestAnimationFrame(this.tick);
	}

	private updateCursorStyle(keyOrObj: string | Record<string, string>, value?: string): void {
		if (!this.cursorEle) return;
		if (typeof keyOrObj === 'string') {
			this.latestCursorStyle[keyOrObj] = value ?? '';
			if (value !== undefined) this.cursorEle.style.setProperty(keyOrObj, value);
		} else {
			for (const [key, val] of Object.entries(keyOrObj)) {
				this.cursorEle.style.setProperty(key, val);
				this.latestCursorStyle[key] = val;
			}
		}
	}

	private autoApplyTextCursor(target: HTMLElement): void {
		if (this.isBlockActive || this.isTextActive || !this.config.enableAutoTextCursor) return;
		// Triggered by scan: any element that has `data-cursor="text"` and
		// was registered via `scanTextElements` will enter the text mode
		// here when the cursor crosses it. The setAttribute on first hit
		// is just defensive — the scan already marks them.
		if (target.hasAttribute('data-cursor')) {
			this.applyTextCursor(target);
		}
	}

	private registerNode(node: Element, type: ICursorType): void {
		this.registeredNodeSet.add(node);
		if (type === 'text') this.registerTextNode(node);
		else if (type === 'block') this.registerBlockNode(node);
		else this.registeredNodeSet.delete(node);
	}

	private unregisterNode(node: Element): void {
		this.registeredNodeSet.delete(node);
		this.eventMap.get(node)?.forEach(({ event, handler }) => {
			node.removeEventListener(event, handler);
		});
		this.eventMap.delete(node);
		// If the unregistered node was the active text node, deactivate
		// text mode manually — we no longer call the mouseleave handler
		// because that resets the cursor style, which would clobber an
		// active block cursor.
		if (this.activeDom === node) {
			this.isTextActive = false;
			this.activeDom = null;
			this.cursorEle?.classList.remove('text-active');
			if (!this.isBlockActive) this.resetCursorStyle();
		}
		// Clean up the published custom properties so the host element
		// returns to its un-translated rest position.
		const el = node as HTMLElement;
		el.style.removeProperty('--flow-x');
		el.style.removeProperty('--flow-y');
	}

	// --- Text node ---------------------------------------------------------

	private registerTextNode(
		_node: Element,
		_overrides?: NodeOverrides
	): void {
		const node = _node as HTMLElement;
		// Idempotent: if the node is already registered (e.g. via a
		// `use:textCursor` action AND the `enableAutoTextCursor` scan),
		// skip. Otherwise we end up with duplicate listeners and the
		// cursor style gets applied twice.
		if (this.registeredNodeSet.has(node)) return;
		this.registeredNodeSet.add(node);
		const overrides = this.applyStyleOverride(_overrides);
		let timer: ReturnType<typeof setTimeout> | undefined;

		const toggleTextActive = (active?: boolean) => {
			this.isTextActive = !!active;
			if (!this.cursorEle) return;
			this.cursorEle.classList.toggle('text-active', !!active);
		};

		const onTextOver = (e: Event) => {
			if (timer) clearTimeout(timer);
			// Block wins: if the cursor is currently hovering a block element,
			// the text listener must NOT fire. Without this guard, a text node
			// registered as a side effect of an earlier scan (e.g. a `<span>`
			// inside a `<label use:blockCursor>`) would override the block
			// cursor with the text cursor every time the mouse crosses it.
			if (this.isBlockActive) return;
			toggleTextActive(true);
			timer = setTimeout(() => toggleTextActive(true));
			this.applyTextCursor(e.target as HTMLElement, overrides);
		};

		const onTextLeave = () => {
			if (timer) clearTimeout(timer);
			// If a block cursor is active, do not touch the cursor — the block
			// listener already owns its size/position. Resetting here would
			// wipe the block's width/height back to the 20px normalStyle.
			if (this.isBlockActive) return;
			timer = setTimeout(() => toggleTextActive(false));
			this.resetCursorStyle();
		};

		node.addEventListener('mouseover', onTextOver, { passive: true });
		node.addEventListener('mouseleave', onTextLeave, { passive: true });
		this.eventMap.set(node, [
			{ event: 'mouseover', handler: onTextOver },
			{ event: 'mouseleave', handler: onTextLeave }
		]);
	}

	private applyTextCursor(sourceNode: HTMLElement, overrides: IpadCursorStyle = {}): void {
		const base = style2Vars(this.config.textStyle ?? {});
		this.updateCursorStyle(base);
		const fontSize = window.getComputedStyle(sourceNode).fontSize;
		this.updateCursorStyle('--cursor-font-size', fontSize);
		this.updateCursorStyle(style2Vars({ ...(this.config.textStyle ?? {}), ...overrides }));
	}

	// --- Block node --------------------------------------------------------

	private registerBlockNode(
		_node: Element,
		_overrides?: NodeOverrides
	): void {
		const node = _node as HTMLElement;
		// Idempotent: if the node is already registered (e.g. via a
		// `use:blockCursor` action AND the `enableAutoBlockCursor` scan),
		// skip. Otherwise we end up with duplicate listeners and the
		// cursor style gets applied twice — which is why the Purple button
		// broke when toggling enableAutoBlockCursor live.
		if (this.registeredNodeSet.has(node)) return;
		this.registeredNodeSet.add(node);
		const overrides = this.applyStyleOverride(_overrides);
		let timer: ReturnType<typeof setTimeout> | undefined;

		const toggleBlockActive = (active?: boolean) => {
			this.isBlockActive = !!active;
			if (!this.cursorEle) return;
			this.cursorEle.classList.toggle('block-active', !!active);
			this.activeDom = active ? node : null;
		};

		const toggleNodeTransition = (enable?: boolean) => {
			const duration = enable
				? getDuration(
						this.config.blockStyle?.durationPosition ??
							this.config.blockStyle?.durationBase ??
							this.config.normalStyle?.durationBase ??
							'0.23s'
					)
				: '';
			node.style.setProperty(
				'transition',
				duration ? `all ${duration} cubic-bezier(.58,.09,.46,1.46)` : 'none'
			);
		};

		const onBlockEnter = () => {
			if (!this.cursorEle) return;
			this.cursorEle.classList.toggle('lighting--on', !!this.config.enableLighting);
			toggleNodeTransition(false);
			// Disable the transform transition so the cursor's outer ring
			// tracks the mouse 1:1 inside the block — the default 0.23s
			// transition makes the ring lag noticeably behind the pointer.
			this.cursorEle.style.setProperty('--cursor-transform-duration', '0s');

			const rect = node.getBoundingClientRect();
			if (timer) clearTimeout(timer);
			toggleBlockActive(true);
			timer = setTimeout(() => toggleBlockActive(true));
			this.cursorEle.classList.add('block-active');

			const updateStyleObj: IpadCursorStyle = { ...(this.config.blockStyle ?? {}) };
			const blockPadding = this.config.blockPadding ?? 0;
			let padding: number = blockPadding === 'auto' ? 0 : blockPadding;
			let radius = updateStyleObj.radius;
			if (blockPadding === 'auto') {
				const size = Math.min(rect.width, rect.height);
				padding = Math.max(2, Math.floor(size / 25));
			}
			if (radius === 'auto') {
				const paddingCss = getSize(padding);
				const nodeRadius = window.getComputedStyle(node).borderRadius;
				if (nodeRadius.startsWith('0') || nodeRadius === 'none') radius = '0';
				else radius = `calc(${paddingCss} + ${nodeRadius})`;
				updateStyleObj.radius = radius;
			}

			this.updateCursorStyle('--cursor-x', `${rect.left + rect.width / 2}px`);
			this.updateCursorStyle('--cursor-y', `${rect.top + rect.height / 2}px`);
			this.updateCursorStyle('--cursor-width', `${rect.width + padding * 2}px`);
			this.updateCursorStyle('--cursor-height', `${rect.height + padding * 2}px`);

			const styleToUpdate: IpadCursorStyle = { ...updateStyleObj, ...overrides };
			if (styleToUpdate.durationPosition === undefined) {
				styleToUpdate.durationPosition =
					styleToUpdate.durationBase ?? this.config.normalStyle?.durationBase;
			}
			this.updateCursorStyle(style2Vars(styleToUpdate));

			toggleNodeTransition(true);
			node.style.setProperty('transform', 'translate(var(--translateX), var(--translateY))');
		};

		const onBlockMove = () => {
			if (!this.isBlockActive) onBlockEnter();
			const rect = node.getBoundingClientRect();
			const halfHeight = rect.height / 2;
			const topOffset = (this.position.y - rect.top - halfHeight) / halfHeight;
			const halfWidth = rect.width / 2;
			const leftOffset = (this.position.x - rect.left - halfWidth) / halfWidth;

			const strength = this.config.adsorptionStrength ?? 10;
			const dx = leftOffset * ((rect.width / 100) * strength);
			const dy = topOffset * ((rect.height / 100) * strength);
			this.updateCursorStyle('--cursor-translateX', `${dx}px`);
			this.updateCursorStyle('--cursor-translateY', `${dy}px`);

			toggleNodeTransition(false);
			node.style.setProperty('--translateX', `${dx}px`);
			node.style.setProperty('--translateY', `${dy}px`);

			if (this.config.enableLighting) {
				const lightingSize = Math.max(rect.width, rect.height) * 3 * 1.2;
				const lightingOffsetX = this.position.x - rect.left;
				const lightingOffsetY = this.position.y - rect.top;
				this.updateCursorStyle('--lighting-size', `${lightingSize}px`);
				this.updateCursorStyle('--lighting-offset-x', `${lightingOffsetX}px`);
				this.updateCursorStyle('--lighting-offset-y', `${lightingOffsetY}px`);
			}
		};

		const onBlockLeave = () => {
			if (timer) clearTimeout(timer);
			timer = setTimeout(() => toggleBlockActive(false));
			this.resetCursorStyle();
			// Disable the transform transition while we reset the
			// translateX/translateY. The transform uses `calc(... - 50%)`
			// of the *current* width/height, so during the size animation
			// (block → circle) the cursor would drift visibly as the half
			// size changes. Snapping the transform for one frame avoids
			// that drift, then we restore the transition.
			this.cursorEle?.style.setProperty('--cursor-transform-duration', '0s');
			this.updateCursorStyle('--cursor-x', `${this.position.x}px`);
			this.updateCursorStyle('--cursor-y', `${this.position.y}px`);
			this.updateCursorStyle('--cursor-translateX', '0px');
			this.updateCursorStyle('--cursor-translateY', '0px');
			requestAnimationFrame(() => {
				this.cursorEle?.style.setProperty('--cursor-transform-duration', '0.23s');
			});
			toggleNodeTransition(true);
			node.style.setProperty('transform', 'translate(0px, 0px)');
		};

		node.addEventListener('mouseenter', onBlockEnter, { passive: true });
		node.addEventListener('mousemove', onBlockMove, { passive: true });
		node.addEventListener('mouseleave', onBlockLeave, { passive: true });
		this.eventMap.set(node, [
			{ event: 'mouseenter', handler: onBlockEnter },
			{ event: 'mousemove', handler: onBlockMove },
			{ event: 'mouseleave', handler: onBlockLeave }
		]);
	}

	private resetCursorStyle(): void {
		const normal = this.config.normalStyle ?? {};
		if (normal.radius === 'auto') normal.radius = normal.width;
		this.updateCursorStyle(style2Vars(normal));
	}
}

export const cursor = new CursorController();
export { customCursorStyle };

/**
 * CSS that opt-in elements paste into their own stylesheet to consume
 * the `--flow-x` / `--flow-y` custom properties the controller publishes
 * on hover. Keep this in the library so users only need a single import.
 *
 * If you'd rather roll your own `transform` / `transition`, just don't
 * import this — the custom properties still work with any CSS.
 */
export const flowHostCss = `
	transform: translate(var(--flow-x, 0px), var(--flow-y, 0px));
	transition: transform 0.23s cubic-bezier(0.58, 0.09, 0.46, 1.46);
	will-change: transform;
`;
