<script>
	let props = $props();
</script>

{#if props.isLoading}
	<div
		class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/50 text-white backdrop-blur-xs"
	>
		<div
			class="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-blue-500"
		></div>
		<p class="text-sm font-medium tracking-wide">
			{props.loadingText || 'Loading, please wait...'}
		</p>
	</div>
{/if}
