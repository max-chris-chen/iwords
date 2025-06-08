<script lang="ts">
  export let onAdd: (() => void) | undefined;
  export let onClose: (() => void) | undefined;
  export let onEdit: ((payload: { title: string }) => void) | undefined;
  export let open: boolean;
  export let newTitle: string = "";
  export let error: string = "";
  export let loading: boolean = false;
  export let editMode: boolean = false;
  export let editTitle: string = "";

  function handleAdd() {
    if (onAdd) onAdd();
  }
  function handleClose() {
    if (onClose) onClose();
  }
  function handleEdit() {
    if (onEdit) onEdit({ title: editTitle });
  }
</script>

{#if open}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
    <div
      class="bg-white rounded-2xl p-8 w-full max-w-md relative border-2 border-black shadow-lg flex flex-col items-stretch min-w-[320px]"
    >
      <button
        class="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold"
        on:click={handleClose}
        aria-label="Close">&times;</button
      >
      <h3 class="text-2xl font-bold text-center mb-6 text-primary-700">
        {editMode ? "编辑 Section" : "添加 Section"}
      </h3>
      <div class="flex gap-2 mb-4 items-center">
        {#if editMode}
          <input
            class="border border-gray-300 rounded px-3 py-2 text-base focus:outline-none focus:border-primary-700 w-full"
            placeholder="Section title"
            bind:value={editTitle}
            aria-label="Section title"
            autofocus
            on:keydown={(e) => e.key === "Enter" && handleEdit()}
          />
        {:else}
          <input
            class="border border-gray-300 rounded px-3 py-2 text-base focus:outline-none focus:border-primary-700 w-full"
            placeholder="Section title"
            bind:value={newTitle}
            aria-label="Section title"
            autofocus
            on:keydown={(e) => e.key === "Enter" && handleAdd()}
          />
        {/if}
      </div>
      {#if error}
        <div class="text-red-600 font-medium mb-2 text-sm">{error}</div>
      {/if}
      <div class="flex gap-3 justify-end mt-2">
        {#if editMode}
          <button
            type="button"
            class="btn-gradient flex items-center gap-2 px-6 py-2 font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 w-full justify-center mt-2 disabled:opacity-60"
            on:click={handleEdit}
            disabled={loading}
          >
            {loading ? "保存中..." : "保存"}
          </button>
        {:else}
          <button
            type="button"
            class="btn-gradient flex items-center gap-2 px-6 py-2 font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 w-full justify-center mt-2 disabled:opacity-60"
            on:click={handleAdd}
            disabled={loading}
          >
            {loading ? "添加中..." : "添加"}
          </button>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .btn-gradient {
    background: linear-gradient(90deg, #2563eb 0%, #1d4ed8 100%) !important;
    color: #fff !important;
    opacity: 1 !important;
    box-shadow: 0 2px 8px 0 rgba(37, 99, 235, 0.1);
    border: 1px solid #2563eb;
    transition: background 0.2s;
  }
  .btn-gradient:hover {
    background: linear-gradient(90deg, #1d4ed8 0%, #2563eb 100%) !important;
  }
</style>
