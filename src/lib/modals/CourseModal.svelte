<script lang="ts">
  export let open = false;
  export let title = '';
  export let onClose: (() => void) | undefined;

  function close() {
    if (onClose) onClose();
  }
</script>

{#if open}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
    <div class="bg-white rounded-2xl p-8 w-full max-w-xl relative border-2 border-black shadow-lg">
      <button class="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold" on:click={close}>&times;</button>
      {#if title}
        <h2 class="text-2xl font-bold text-center mb-6 text-primary-700">{title}</h2>
      {/if}
      <slot />
    </div>
  </div>
{/if}

<style>
  /* Modal styles are handled by Tailwind classes */
</style>
