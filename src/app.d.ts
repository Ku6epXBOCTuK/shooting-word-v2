// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import "unplugin-icons/types/svelte";

declare global {
	const __APP_VARIANT_NODE__: boolean;

	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
