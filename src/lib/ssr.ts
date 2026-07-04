/**
 * `true` when the code is running in a browser environment.
 *
 * We use a manual `typeof` check instead of `$app/environment` so this
 * library can be consumed from a plain Vite + Svelte setup as well as
 * from a SvelteKit app.
 */
export const browser = typeof document !== 'undefined' && typeof window !== 'undefined';
