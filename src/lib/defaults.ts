import type { IpadCursorConfig, IpadCursorStyle } from './types.ts';

export const DEFAULT_CLASS_NAME = 'ipad-cursor';

export function getDefaultConfig(): IpadCursorConfig {
	const normalStyle: IpadCursorStyle = {
		width: '20px',
		height: '20px',
		radius: '10px',
		durationBase: '0.23s',
		durationPosition: '0s',
		durationBackdropFilter: '0s',
		background: 'rgba(150, 150, 150, 0.2)',
		scale: 1,
		border: '1px solid rgba(100, 100, 100, 0.1)',
		zIndex: 9999,
		backdropBlur: '0px',
		backdropSaturate: '180%'
	};

	const textStyle: IpadCursorStyle = {
		background: 'rgba(100, 100, 100, 0.3)',
		scale: 1,
		width: '4px',
		height: '1.2em',
		border: '0px solid rgba(100, 100, 100, 0)',
		durationBackdropFilter: '1s',
		radius: '10px'
	};

	const blockStyle: IpadCursorStyle = {
		background: 'rgba(100, 100, 100, 0.3)',
		border: '1px solid rgba(100, 100, 100, 0.05)',
		backdropBlur: '0px',
		durationBase: '0.23s',
		durationBackdropFilter: '0.1s',
		backdropSaturate: '120%',
		radius: '10px'
	};

	const mouseDownStyle: IpadCursorStyle = {
		background: 'rgba(150, 150, 150, 0.3)',
		scale: 0.8
	};

	return {
		blockPadding: 'auto',
		adsorptionStrength: 10,
		className: DEFAULT_CLASS_NAME,
		normalStyle,
		textStyle,
		blockStyle,
		mouseDownStyle
	};
}

export function buildCursorStyleSheet(className: string): string {
	const selector = `.${className.split(/\s+/).filter(Boolean).join('.')}`;
	return `
    body, * {
      cursor: none;
    }
    ${selector} {
      --cursor-transform-duration: 0.23s;
      overflow: hidden;
      pointer-events: none;
      position: fixed;
      left: var(--cursor-x);
      top: var(--cursor-y);
      width: var(--cursor-width);
      height: var(--cursor-height);
      border-radius: var(--cursor-radius);
      background-color: var(--cursor-bg);
      border: var(--cursor-border);
      z-index: var(--cursor-z-index);
      font-size: var(--cursor-font-size);
      backdrop-filter:
        blur(var(--cursor-bg-blur))
        saturate(var(--cursor-bg-saturate));
      transition:
        width var(--cursor-duration) ease,
        height var(--cursor-duration) ease,
        border-radius var(--cursor-duration) ease,
        border var(--cursor-duration) ease,
        background-color var(--cursor-duration) ease,
        left var(--cursor-position-duration) ease,
        top var(--cursor-position-duration) ease,
        backdrop-filter var(--cursor-blur-duration) ease,
        transform var(--cursor-transform-duration) ease;
      transform:
        translateX(calc(var(--cursor-translateX, 0px) - 50%))
        translateY(calc(var(--cursor-translateY, 0px) - 50%))
        scale(var(--cursor-scale, 1));
    }
    ${selector}.block-active {
      --cursor-transform-duration: 0s;
    }
    ${selector} .lighting {
      display: none;
    }
    ${selector}.lighting--on .lighting {
      display: block;
      width: 0;
      height: 0;
      position: absolute;
      left: calc(var(--lighting-size) / -2);
      top: calc(var(--lighting-size) / -2);
      transform: translateX(var(--lighting-offset-x, 0)) translateY(var(--lighting-offset-y, 0));
      background-image: radial-gradient(
        circle at center,
        rgba(255, 255, 255, 0.1) 0%,
        rgba(255, 255, 255, 0) 30%
      );
      border-radius: 50%;
    }
    ${selector}.block-active .lighting {
      width: var(--lighting-size, 20px);
      height: var(--lighting-size, 20px);
    }
  `;
}
