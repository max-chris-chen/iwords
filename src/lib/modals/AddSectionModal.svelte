<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  export let open: boolean;
  export let newTitle: string = '';
  export let error: string = '';
  export let loading: boolean = false;
  export let editMode: boolean = false;
  export let editTitle: string = '';
  const dispatch = createEventDispatcher();
  function handleAdd() {
    dispatch('add');
  }
  function handleClose() {
    dispatch('close');
  }
  function handleEdit() {
    dispatch('edit', { title: editTitle });
  }
</script>

{#if open}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
    <div class="bg-white rounded-2xl p-8 w-full max-w-md relative border-2 border-black shadow-lg flex flex-col items-stretch min-w-[320px]">
      <button class="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold" on:click={handleClose} aria-label="Close">&times;</button>
      <h3 class="text-2xl font-bold text-center mb-6 text-primary-700">{editMode ? '编辑 Section' : '添加 Section'}</h3>
      <div class="flex gap-2 mb-4 items-center">
        {#if editMode}
          <input
            class="border border-gray-300 rounded px-3 py-2 text-base focus:outline-none focus:border-primary-700 w-full"
            placeholder="Section title"
            bind:value={editTitle}
            aria-label="Section title"
            autofocus
            on:keydown={(e) => e.key === 'Enter' && handleEdit()}
          />
        {:else}
          <input
            class="border border-gray-300 rounded px-3 py-2 text-base focus:outline-none focus:border-primary-700 w-full"
            placeholder="Section title"
            bind:value={newTitle}
            aria-label="Section title"
            autofocus
            on:keydown={(e) => e.key === 'Enter' && handleAdd()}
          />
        {/if}
      </div>
      {#if error}
        <div class="text-red-600 font-medium mb-2 text-sm">{error}</div>
      {/if}
      <div class="flex gap-3 justify-end mt-2">
        {#if editMode}
          <button class="bg-primary-700 text-white px-4 py-2 rounded font-semibold hover:bg-primary-800 disabled:opacity-60" on:click={handleEdit} disabled={loading}>保存</button>
        {:else}
          <button class="bg-primary-700 text-white px-4 py-2 rounded font-semibold hover:bg-primary-800 disabled:opacity-60" on:click={handleAdd} disabled={loading}>添加</button>
        {/if}
        <button class="bg-gray-200 text-gray-700 px-4 py-2 rounded font-semibold hover:bg-gray-300" on:click={handleClose}>取消</button>
      </div>
    </div>
  </div>
{/if}
