export type ICursorType = 'normal' | 'text' | 'block';

/**
 * If a number is provided, it is treated as `px`.
 * Strings are passed through as-is.
 */
export type MaybeSize = string | number;

/**
 * If a number is provided, it is treated as `ms`.
 * Strings are passed through as-is (e.g. `200ms`, `0.23s`).
 */
export type MaybeDuration = string | number;

/**
 * Any valid CSS color. Do not use `0x000000` shorthand — use `#000000`.
 */
export type MaybeColor = string;

export interface IpadCursorConfig {
  /**
   * Strength of the magnetic adsorption effect when hovering on `block` elements.
   * `0` disables it. Values are clamped between `0` and `30`.
   * @default 10
   */
  adsorptionStrength?: number;

  /**
   * Class name of the fake cursor element.
   * @default 'ipad-cursor'
   */
  className?: string;

  /**
   * Style applied when the cursor is idle (not hovering any tracked element).
   */
  normalStyle?: IpadCursorStyle;

  /**
   * Style applied when hovering on text (`type: 'text'`).
   */
  textStyle?: IpadCursorStyle;

  /**
   * Style applied when hovering on a block (`type: 'block'`).
   */
  blockStyle?: IpadCursorStyle;

  /**
   * Style applied while the mouse is held down. Only used when
   * `enableMouseDownEffect` is `true` and the cursor is not on a block.
   */
  mouseDownStyle?: IpadCursorStyle;

  /**
   * Extra padding (in px) added to the cursor dimensions when hovering on a block.
   * Use `'auto'` to compute it from the block size.
   * @default 'auto'
   */
  blockPadding?: number | 'auto';

	/**
	 * Detect text nodes and apply the text cursor automatically.
	 * Only used by the imperative `data-cursor` API.
	 * @default false
	 */
	enableAutoTextCursor?: boolean;

	/**
	 * Detect interactive elements (`<button>`, `<a>`, `[role="button"]`,
	 * `input[type="submit|button]`, `<summary>`) and apply the block cursor
	 * to them automatically — no action required on the element.
	 * @default false
	 */
	enableAutoBlockCursor?: boolean;

  /**
   * Observe the DOM and re-run `updateCursor` automatically.
   * Only used by the imperative `data-cursor` API.
   * @default false
   */
  enableAutoUpdateCursor?: boolean;

  /**
   * Render a soft radial light following the cursor inside a hovered block.
   * @default false
   */
  enableLighting?: boolean;

  /**
   * Apply a style change while the mouse is pressed.
   * @default false
   */
  enableMouseDownEffect?: boolean;
}

export interface IpadCursorStyle {
  width?: MaybeSize;
  height?: MaybeSize;
  /** Border radius. `'auto'` on `blockStyle` reads the host element's `border-radius`. */
  radius?: MaybeSize | 'auto';

  /** Transition duration for size, radius, border, background-color. */
  durationBase?: MaybeDuration;
  /** Transition duration for the position (`left`, `top`). */
  durationPosition?: MaybeDuration;
  /** Transition duration for `backdrop-filter`. */
  durationBackdropFilter?: MaybeDuration;

  background?: MaybeColor;
  border?: string;
  zIndex?: number;
  scale?: number;
  backdropBlur?: MaybeSize;
  backdropSaturate?: string;
}

/**
 * Parameters accepted by the `use:ipadCursor` Svelte action.
 *
 * @example
 * ```svelte
 * <div use:ipadCursor={{ type: 'block' }}>...</div>
 * <span use:ipadCursor={{ type: 'text' }}>...</span>
 * <div use:ipadCursor={{ type: 'block', style: { background: 'red' } }}>...</div>
 * ```
 */
export interface IpadCursorActionParam {
  /**
   * Which effect to apply. `'normal'` is a no-op (it removes the binding).
   */
  type: ICursorType;
  /**
   * Optional overrides merged on top of the matching style
   * (`blockStyle` for `type: 'block'`, `textStyle` for `type: 'text'`).
   *
   * Accepts either a typed object or the legacy `data-cursor-style` string
   * produced by {@link customCursorStyle}.
   */
  style?: IpadCursorStyle | Record<string, any> | string;
}
