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
  <div class="custom-modal-backdrop" on:click={handleClose}></div>
  <div class="custom-modal">
    <h3>{editMode ? '编辑 Section' : '添加 Section'}</h3>
    <div class="input-row" style="margin-top:1em;">
      {#if editMode}
        <input
          placeholder="Section title"
          bind:value={editTitle}
          aria-label="Section title"
          autofocus
          on:keydown={(e) => e.key === 'Enter' && handleEdit()}
        />
      {:else}
        <input
          placeholder="Section title"
          bind:value={newTitle}
          aria-label="Section title"
          autofocus
          on:keydown={(e) => e.key === 'Enter' && handleAdd()}
        />
      {/if}
    </div>
    {#if error}
      <div class="error">{error}</div>
    {/if}
    <div class="modal-actions" style="margin-top:1em;display:flex;gap:1em;justify-content:flex-end;">
      {#if editMode}
        <button on:click={handleEdit} disabled={loading}>Save</button>
      {:else}
        <button on:click={handleAdd} disabled={loading}>Add</button>
      {/if}
      <button on:click={handleClose}>Cancel</button>
    </div>
  </div>
{/if}

<style>
  .custom-modal-backdrop {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.18);
    z-index: 1000;
  }
  .custom-modal {
    position: fixed;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    background: #fff;
    border-radius: 10px;
    box-shadow: 0 8px 32px 0 rgba(0,0,0,0.18);
    padding: 2em 2.5em 1.5em 2.5em;
    z-index: 1001;
    min-width: 320px;
    display: flex;
    flex-direction: column;
    align-items: stretch;
  }
  .custom-modal h3 {
    margin: 0 0 1em 0;
    font-size: 1.2em;
    font-weight: 600;
    color: #2563eb;
    text-align: center;
  }
  .input-row {
    display: flex;
    gap: 0.7em;
    margin-bottom: 0.7em;
    align-items: center;
  }
  .error {
    color: #dc2626;
    font-weight: 500;
    margin-left: 0.5em;
  }
  .custom-modal input[type="text"], .custom-modal input {
    border: 1.5px solid #d1d5db;
    border-radius: 4px;
    padding: 0.4em 0.7em;
    font-size: 1em;
    background: #fff;
    color: #1e293b;
    outline: none;
    transition: border 0.15s;
    width: 260px;
    min-width: 200px;
    max-width: 100%;
  }
  .custom-modal input[type="text"]:focus, .custom-modal input:focus {
    border: 1.5px solid #2563eb;
  }
</style>
