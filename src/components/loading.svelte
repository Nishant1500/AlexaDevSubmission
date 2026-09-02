<script>
	let props = $props();
</script>

{#if props.isLoading}
	<div class="fixed inset-0 bg-black/50 backdrop-blur-xs flex flex-col justify-center items-center text-white z-50">
		<div class="w-12 h-12 border-4 border-white/20 border-t-blue-500 rounded-full animate-spin mb-4"></div>
		<p class="text-sm font-medium tracking-wide">{props.loadingText || 'Loading, please wait...'}</p>
	</div>
{/if}