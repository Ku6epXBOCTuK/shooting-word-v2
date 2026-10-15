import "unplugin-icons/types/svelte";

declare global {
	const __APP_VARIANT_NODE__: boolean;
	const __APP_COMMIT__: string;

	namespace App {}
}

export {};
