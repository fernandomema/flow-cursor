<script lang="ts">
	import { onDestroy } from 'svelte';
	import {
		blockCursor,
		disposeCursor,
		flowCursor,
		initCursor,
		textCursor,
		updateConfig
	} from '$lib';

	let lighting = $state(false);
	let mouseDownEffect = $state(false);
	let autoText = $state(false);
	let autoBlock = $state(false);

	initCursor({
		blockStyle: {
			background: 'rgba(255, 255, 255, 0.08)',
			border: '1px solid rgba(255,255,255,0.25)'
		},
		normalStyle: { background: 'rgba(255, 255, 255, 0.15)' }
	});

	$effect(() => {
		updateConfig({
			enableLighting: lighting,
			enableMouseDownEffect: mouseDownEffect,
			enableAutoTextCursor: autoText,
			enableAutoBlockCursor: autoBlock
		});
	});

	onDestroy(() => disposeCursor());
</script>

<svelte:head>
	<title>flow-cursor — iPad cursor for Svelte</title>
</svelte:head>

<main>
	<!-- ============================== HERO ============================== -->
	<header>
		<span class="eyebrow">flow-cursor</span>
		<h1>The iPad like cursor, ported natively to Svelte&nbsp;5.</h1>
		<p>
			A drop-in <code>use:flowCursor</code> action based on the work of
			<a href="https://github.com/CatsJuice/ipad-cursor">CatsJuice/ipad-cursor</a>
			— same algorithm, same defaults, native to Svelte.
		</p>
		<pre class="install"><code>npm install flow-cursor</code></pre>
	</header>

	<!-- ============================== SPLASH ============================== -->
	<section class="splash" aria-label="Live demos">
		<div class="splash-grid">
			<div class="splash-cell">
				<button type="button" use:blockCursor class="splash-target">Hover</button>
				<code class="splash-label">use:blockCursor</code>
			</div>

			<div class="splash-cell">
				<p use:textCursor class="splash-target splash-target--text">Hover me</p>
				<code class="splash-label">use:textCursor</code>
			</div>

			<div class="splash-cell">
				<button
					type="button"
					use:blockCursor={{ background: 'rgba(124, 92, 255, 0.4)' }}
					class="splash-target"
				>
					Override
				</button>
				<code class="splash-label">style=&#123;&#123;…&#125;&#125;</code>
			</div>

			<div class="splash-cell">
				<button
					type="button"
					use:blockCursor={{ radius: '50%' }}
					class="splash-target splash-target--circle"
					aria-label="Circle radius"
				>
					50%
				</button>
				<code class="splash-label">radius: 50%</code>
			</div>

			<div class="splash-cell">
				<button
					type="button"
					use:blockCursor={{ radius: '0' }}
					class="splash-target splash-target--square"
					aria-label="Square radius"
				>
					0
				</button>
				<code class="splash-label">radius: 0</code>
			</div>
		</div>
	</section>

	<!-- ============================ QUICKSTART ============================ -->
	<section class="quickstart">
		<h2 class="section-title">Quickstart</h2>
		<p class="section-sub">The minimum to get the cursor working. Three steps.</p>

		<ol class="steps">
			<li class="step">
				<h3><span class="step-num">1</span> Install</h3>
				<pre class="code"><code>npm install flow-cursor</code></pre>
			</li>

			<li class="step">
				<h3><span class="step-num">2</span> Mount the controller</h3>
				<p>
					Call <code>initCursor()</code> once at the start of your app. Do it at
					the top level of <code>&lt;script&gt;</code> (or inside
					<code>onMount</code>) and <code>disposeCursor()</code> in
					<code>onDestroy</code> to clean up on unmount.
				</p>
				<pre class="code"><code>{`import { initCursor, disposeCursor } from 'flow-cursor';
import { onDestroy } from 'svelte';

initCursor();                // mount the fake cursor + global listeners
onDestroy(disposeCursor);    // clean up on unmount`}</code></pre>
			</li>

			<li class="step">
				<h3><span class="step-num">3</span> Drop an action on any element</h3>
				<p>
					Use the <code>use:blockCursor</code> or <code>use:textCursor</code>
					shorthands, or the main <code>use:flowCursor</code> action with an
					explicit <code>type</code>. That's it — the cursor magnetizes on
					hover.
				</p>
				<pre class="code"><code>{`<button use:blockCursor>Hover me</button>
<p use:textCursor>Some text…</p>
<div use:flowCursor={{ type: 'block' }}>…</div>`}</code></pre>
			</li>
		</ol>
	</section>


	<!-- ============================== DEMOS ============================== -->
	<section class="demos">
		<h2 class="section-title">Directives <code>use:</code></h2>
		<p class="section-sub">
			Each directive is a Svelte action. They mount on any element and unmount
			automatically when the element leaves the DOM.
		</p>

		<!-- 1. blockCursor shorthand -->
		<article class="demo">
			<header class="demo-head">
				<h2><code>use:blockCursor</code></h2>
				<p>Magnetic cursor that wraps the block and moves toward the pointer.</p>
			</header>
			<div class="preview">
				<button type="button" use:blockCursor class="target target--block">
					Hover me
				</button>
			</div>
			<pre class="code"><code>{`<button use:blockCursor>
  Hover me
</button>`}</code></pre>
		</article>

		<!-- 2. textCursor shorthand -->
		<article class="demo">
			<header class="demo-head">
				<h2><code>use:textCursor</code></h2>
				<p>Thin vertical cursor that adjusts to the font size of the element.</p>
			</header>
			<div class="preview">
				<p use:textCursor class="target target--text">
					Hover this paragraph to see the text cursor snap to the font size.
				</p>
			</div>
			<pre class="code"><code>{`<p use:textCursor>
  Hover this paragraph…
</p>`}</code></pre>
		</article>

		<!-- 3. Per-element style override -->
		<article class="demo">
			<header class="demo-head">
				<h2>Per-element style</h2>
				<p>Pass a <code>style</code> object to the action and it gets merged on top
					of the global <code>blockStyle</code>. Also accepts the legacy
					<code>data-cursor-style</code> string.</p>
			</header>
			<div class="preview">
				<button
					type="button"
					use:blockCursor={{ background: 'rgba(124, 92, 255, 0.4)' }}
					class="target target--block"
				>
					Purple
				</button>
			</div>
			<pre class="code"><code>{`<button use:blockCursor={{
  background: 'rgba(124, 92, 255, 0.4)'
}}>
  Purple
</button>`}</code></pre>
		</article>

		<!-- 4. Custom radius -->
		<article class="demo">
			<header class="demo-head">
				<h2>Custom radius</h2>
				<p><code>'auto'</code> inherits the host's <code>border-radius</code>. Or pass
					an explicit value to override it.</p>
			</header>
			<div class="preview preview--row">
				<button type="button" use:blockCursor={{ radius: '50%' }} class="target target--circle">
					50%
				</button>
				<button type="button" use:blockCursor={{ radius: '0' }} class="target target--square">
					0
				</button>
				<button type="button" use:blockCursor={{ radius: 'auto' }} class="target target--auto">
					auto
				</button>
			</div>
			<pre class="code"><code>{`<button use:blockCursor={{ radius: '50%' }}>…</button>
<button use:blockCursor={{ radius: '0' }}>…</button>
<button use:blockCursor={{ radius: 'auto' }}>…</button>`}</code></pre>
		</article>

		<!-- 5. flowCursor (main action) -->
		<article class="demo">
			<header class="demo-head">
				<h2><code>use:flowCursor</code></h2>
				<p>The main action. Accepts <code>type</code>, <code>style</code> and
					<code>initConfig</code> — the shorthands are sugar for common cases.</p>
			</header>
			<div class="preview">
				<button
					type="button"
					use:flowCursor={{ type: 'block', initConfig: { enableLighting: true } }}
					class="target target--block"
				>
					Block + lighting
				</button>
			</div>
			<pre class="code"><code>{`<button
  use:flowCursor={{
    type: 'block',
    initConfig: { enableLighting: true }
  }}
>
  Block + lighting
</button>`}</code></pre>
		</article>
	</section>

	<!-- ========================== GLOBAL CONFIG ========================== -->
	<section class="configs" aria-label="Global configuration">
		<h2 class="section-title">Global config</h2>
		<p class="section-sub">
			These options are passed to <code>initCursor()</code> at mount, or to
			<code>updateConfig()</code> at any time. They apply to all elements with
			<code>use:flowCursor</code> / <code>use:blockCursor</code> /
			<code>use:textCursor</code>.
		</p>

		<!-- enableLighting -->
		<article class="config">
			<header class="config-head">
				<label use:blockCursor class="config-toggle">
					<input type="checkbox" bind:checked={lighting} />
					<span>enableLighting</span>
				</label>
				<p>
					Adds a radial halo inside the block that follows the pointer. Useful
					for extra visual feedback without changing the cursor shape.
				</p>
			</header>
			<div class="preview">
				<button use:blockCursor class="target target--block">
					Hover me
				</button>
			</div>
			<pre class="code"><code>{`// At init:
initCursor({ enableLighting: true });

// Or live, anywhere in your app:
updateConfig({ enableLighting: true });`}</code></pre>
		</article>

		<!-- enableMouseDownEffect -->
		<article class="config">
			<header class="config-head">
				<label use:blockCursor class="config-toggle">
					<input type="checkbox" bind:checked={mouseDownEffect} />
					<span>enableMouseDownEffect</span>
				</label>
				<p>
					Applies <code>mouseDownStyle</code> while the button is held. Defaults
					to <code>scale: 0.8</code> + a more opaque background.
				</p>
			</header>
			<div class="preview">
				<button use:blockCursor class="target target--block">
					Click &amp; hold
				</button>
			</div>
			<pre class="code"><code>{`// At init:
initCursor({ enableMouseDownEffect: true });

// Override the press style:
initCursor({
  enableMouseDownEffect: true,
  mouseDownStyle: { scale: 0.7, background: 'red' }
});`}</code></pre>
		</article>

		<!-- enableAutoTextCursor -->
		<article class="config">
			<header class="config-head">
				<label use:blockCursor class="config-toggle">
					<input type="checkbox" bind:checked={autoText} />
					<span>enableAutoTextCursor</span>
				</label>
				<p>
					Detects loose text nodes and automatically applies the text cursor.
					No <code>use:textCursor</code> required — plain text inside a
					container is enough.
				</p>
			</header>
			<div class="preview">
				<p class="target target--autotext">
					This paragraph has no action. The cursor turns into a text bar on hover
					because <code>enableAutoTextCursor</code> is on.
				</p>
			</div>
			<pre class="code"><code>{`// At init:
initCursor({ enableAutoTextCursor: true });`}</code></pre>
		</article>

		<!-- enableAutoBlockCursor -->
		<article class="config">
			<header class="config-head">
				<label use:blockCursor class="config-toggle">
					<input type="checkbox" bind:checked={autoBlock} />
					<span>enableAutoBlockCursor</span>
				</label>
				<p>
					Applies the block cursor to all native interactives:
					<code>&lt;button&gt;</code>, <code>&lt;a href&gt;</code>,
					<code>[role="button"]</code>, <code>&lt;summary&gt;</code>, etc. No
					markup changes, no <code>use:blockCursor</code>.
				</p>
			</header>
			<div class="preview preview--row">
				<button type="button" class="target target--block">Button</button>
				<button type="button" class="target target--block">Link</button>
				<button type="button" class="target target--circle" aria-label="Icon button">★</button>
			</div>
			<pre class="code"><code>{`// At init:
initCursor({ enableAutoBlockCursor: true });

// The controller scans the DOM and registers every:
//   <button>, <a href>, [role="button"],
//   <input type="submit|button">, <summary>, <label for>
// No action needed on the element itself.`}</code></pre>
		</article>
	</section>

	<footer>
		<p>
			Built on top of
			<a href="https://svelte.dev/docs/svelte/action">Svelte actions</a> ·
			<a href="https://svelte.dev/docs/svelte/$state">runes</a> ·
			<a href="https://github.com/CatsJuice/ipad-cursor">original library</a>
		</p>
	</footer>
</main>

<style>
	:global(html),
	:global(body) {
		background: #0a0a0f;
		color: #e9e9ef;
		font-family:
			'Inter',
			ui-sans-serif,
			system-ui,
			-apple-system,
			'Segoe UI',
			Roboto,
			sans-serif;
	}

	:global(*) {
		box-sizing: border-box;
	}

	main {
		max-width: 920px;
		margin: 0 auto;
		padding: 80px 32px 120px;
	}

	/* ============================== HERO ============================== */
	header {
		margin-bottom: 56px;
	}

	.eyebrow {
		display: inline-block;
		font-size: 12px;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		color: #7c5cff;
		margin-bottom: 20px;
	}

	h1 {
		font-size: clamp(36px, 5vw, 52px);
		line-height: 1.05;
		letter-spacing: -0.02em;
		margin: 0 0 20px;
		font-weight: 600;
	}

	header p {
		color: #a1a1aa;
		font-size: 17px;
		line-height: 1.6;
		max-width: 640px;
	}

	a {
		color: #c4b5fd;
		text-decoration: none;
		border-bottom: 1px solid rgba(196, 181, 253, 0.3);
	}

	code {
		font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: 0.9em;
		padding: 2px 6px;
		background: rgba(255, 255, 255, 0.06);
		border-radius: 4px;
		color: #e9e9ef;
	}

	pre code {
		padding: 0;
		background: none;
	}

	.install {
		margin: 28px 0 0;
		padding: 14px 18px;
		background: rgba(124, 92, 255, 0.1);
		border: 1px solid rgba(124, 92, 255, 0.3);
		border-radius: 10px;
		font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: 14px;
		color: #c4b5fd;
		display: inline-block;
	}

	/* =========================== SPLASH =========================== */
	.splash {
		margin-bottom: 64px;
	}

	.splash-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
		gap: 12px;
	}

	.splash-cell {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 14px;
		padding: 28px 16px;
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid rgba(255, 255, 255, 0.06);
		border-radius: 14px;
		transition: border-color 0.15s ease;
	}

	.splash-cell:hover {
		border-color: rgba(124, 92, 255, 0.3);
	}

	.splash-target {
		font-family: inherit;
		font-size: 14px;
		font-weight: 500;
		color: #e9e9ef;
		cursor: none;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.12);
		padding: 10px 20px;
		border-radius: 8px;
		min-width: 80px;
	}

	.splash-target--text {
		font-size: 16px;
		padding: 6px 12px;
		min-width: 0;
		background: none;
		border: none;
	}

	.splash-target--circle {
		width: 64px;
		height: 64px;
		min-width: 0;
		padding: 0;
		border-radius: 50%;
		display: grid;
		place-items: center;
	}

	.splash-target--square {
		width: 64px;
		height: 64px;
		min-width: 0;
		padding: 0;
		border-radius: 0;
		display: grid;
		place-items: center;
	}

	.splash-label {
		font-size: 11px;
		color: #71717a;
		text-align: center;
	}

	/* ========================== QUICKSTART ========================== */
	.quickstart {
		margin-bottom: 64px;
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.steps {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.step {
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid rgba(255, 255, 255, 0.06);
		border-radius: 16px;
		padding: 24px 28px;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.step h3 {
		font-size: 16px;
		font-weight: 500;
		margin: 0;
		display: flex;
		align-items: center;
		gap: 10px;
		color: #e9e9ef;
	}

	.step-num {
		display: inline-grid;
		place-items: center;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background: rgba(124, 92, 255, 0.2);
		color: #c4b5fd;
		font-size: 12px;
		font-weight: 600;
		font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
	}

	.step p {
		font-size: 14px;
		color: #a1a1aa;
		line-height: 1.55;
		margin: 0;
	}

	/* ========================== GLOBAL CONFIG ========================== */
	.configs {
		margin-top: 80px;
		margin-bottom: 64px;
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.section-title {
		font-size: 22px;
		font-weight: 500;
		margin: 0 0 4px;
		letter-spacing: -0.01em;
	}

	.section-sub {
		font-size: 14px;
		color: #a1a1aa;
		line-height: 1.55;
		margin: 0 0 8px;
	}

	.config {
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid rgba(255, 255, 255, 0.06);
		border-radius: 16px;
		padding: 24px 28px;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.config-head {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.config-toggle {
		display: inline-flex;
		align-items: center;
		gap: 10px;
		cursor: none;
		font-size: 15px;
		font-weight: 500;
		color: #e9e9ef;
		padding: 10px 16px;
		border-radius: 8px;
		border: 1px solid transparent;
		transition: border-color 0.15s ease;
		align-self: flex-start;
	}

	.config-toggle:has(input:checked) {
		border-color: rgba(124, 92, 255, 0.4);
	}

	.config-toggle input[type='checkbox'] {
		accent-color: #7c5cff;
		cursor: none;
	}

	.config-head p {
		font-size: 14px;
		color: #a1a1aa;
		line-height: 1.55;
		margin: 0;
	}

	/* ============================== DEMOS ============================== */
	.demos {
		display: flex;
		flex-direction: column;
		gap: 24px;
	}

	.demo {
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid rgba(255, 255, 255, 0.06);
		border-radius: 16px;
		padding: 28px;
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.demo-head h2 {
		font-size: 18px;
		font-weight: 500;
		margin: 0 0 6px;
		letter-spacing: -0.01em;
	}

	.demo-head h2 code {
		font-size: 15px;
		color: #c4b5fd;
	}

	.demo-head p {
		font-size: 14px;
		color: #a1a1aa;
		line-height: 1.55;
		margin: 0;
	}

	.preview {
		min-height: 120px;
		padding: 24px;
		background: rgba(0, 0, 0, 0.3);
		border: 1px dashed rgba(255, 255, 255, 0.1);
		border-radius: 10px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.preview--row {
		flex-direction: row;
		flex-wrap: wrap;
		gap: 16px;
		justify-content: flex-start;
	}

	/* ============================== TARGETS ============================== */
	.target {
		font-family: inherit;
		font-size: 15px;
		color: inherit;
		cursor: none;
	}

	.target--block {
		padding: 14px 28px;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.15);
		border-radius: 8px;
		color: #e9e9ef;
	}

	.target--text {
		font-size: 18px;
		line-height: 1.4;
		color: #d4d4d8;
		max-width: 520px;
		text-align: center;
	}

	.target--circle {
		width: 64px;
		height: 64px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.15);
		display: grid;
		place-items: center;
		color: #e9e9ef;
		padding: 0;
	}

	.target--square {
		width: 64px;
		height: 64px;
		border-radius: 0;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.15);
		display: grid;
		place-items: center;
		color: #e9e9ef;
		padding: 0;
	}

	.target--auto {
		width: 64px;
		height: 64px;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.15);
		display: grid;
		place-items: center;
		color: #e9e9ef;
		padding: 0;
	}

	.target--autotext {
		font-size: 15px;
		line-height: 1.5;
		color: #d4d4d8;
		max-width: 560px;
		text-align: center;
		padding: 12px 20px;
		background: rgba(255, 255, 255, 0.03);
		border: 1px dashed rgba(255, 255, 255, 0.1);
		border-radius: 8px;
	}

	/* ============================== CODE ============================== */
	.code {
		margin: 0;
		padding: 16px 20px;
		background: rgba(0, 0, 0, 0.4);
		border-radius: 8px;
		font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: 13px;
		line-height: 1.6;
		color: #d4d4d8;
		overflow-x: auto;
		white-space: pre;
	}

	/* ============================== FOOTER ============================== */
	footer {
		margin-top: 80px;
		padding-top: 32px;
		border-top: 1px solid rgba(255, 255, 255, 0.06);
		color: #71717a;
		font-size: 13px;
		text-align: center;
	}
</style>
