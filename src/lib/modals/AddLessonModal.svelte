<script lang="ts">
  import { createEventDispatcher } from "svelte";
  export let open = false;
  export let loading = false;
  export let error = "";
  export let newTitle = "";
  export let newContent = "";
  export let sectionTitle = "";
  export let editMode = false;
  export let editTitle = "";
  export let editContent = "";

  const dispatch = createEventDispatcher();

  let localTitle = editMode ? editTitle : newTitle;
  let localContent = editMode ? editContent : newContent;

  $: if (open) {
    localTitle = editMode ? editTitle : newTitle;
    localContent = editMode ? editContent : newContent;
  }

  function handleSave() {
    if (editMode) {
      dispatch("edit", { title: localTitle, content: localContent });
    } else {
      dispatch("save", { title: localTitle, content: localContent });
    }
  }
  function handleClose() {
    dispatch("close");
  }
</script>

{#if open}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
    <div
      class="bg-white rounded-2xl p-10 w-full max-w-3xl relative border-2 border-black shadow-lg flex flex-col items-stretch min-w-[600px] min-h-[500px]"
    >
      <button
        class="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold"
        on:click={handleClose}
        aria-label="Close">&times;</button
      >
      <h3 class="text-2xl font-bold text-center mb-6 text-primary-700">
        {editMode ? "编辑 Lesson" : "添加 Lesson"}{#if sectionTitle}
          <span class="section-name">({sectionTitle})</span>{/if}
      </h3>
      <div class="flex flex-col gap-3 mb-4">
        <input
          class="border border-gray-300 rounded px-3 py-2 text-base focus:outline-none focus:border-primary-700 w-full"
          placeholder="Lesson title"
          bind:value={localTitle}
          aria-label="Lesson title"
          autofocus
        />
        <textarea
          class="border border-gray-300 rounded px-3 py-2 text-base focus:outline-none focus:border-primary-700 w-full min-h-[220px] resize-y"
          placeholder="Lesson content"
          bind:value={localContent}
          aria-label="Lesson content"
          maxlength="10000"
        />
        <div class="text-xs text-gray-500 text-right">
          {localContent.length}/10000
        </div>
      </div>
      {#if error}
        <div class="text-red-600 font-medium mb-2 text-sm">{error}</div>
      {/if}
      <div class="flex gap-3 justify-end mt-2">
        {#if editMode}
          <button
            type="button"
            class="btn-gradient flex items-center gap-2 px-6 py-2 font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 w-full justify-center mt-2 disabled:opacity-60"
            on:click={handleSave}
            disabled={loading}
          >
            {loading ? "保存中..." : "保存"}
          </button>
        {:else}
          <button
            type="button"
            class="btn-gradient flex items-center gap-2 px-6 py-2 font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 w-full justify-center mt-2 disabled:opacity-60"
            on:click={handleSave}
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
  .section-name {
    color: #059669;
    font-weight: 500;
    margin-left: 0.5em;
  }
</style>
