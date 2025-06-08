<script lang="ts">
  export let open = false;
  export let title = "";
  export let onClose: (() => void) | undefined;

  function close() {
    if (onClose) onClose();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (open && e.key === "Escape") {
      close();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if open}
  <div class="modal-backdrop" on:click={close}>
    <div class="modal-content" on:click|stopPropagation>
      <button class="modal-close-btn" on:click={close}>&times;</button>
      {#if title}
        <h2 class="modal-title">{title}</h2>
      {/if}
      <slot />
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
  }
  .modal-content {
    background-color: white;
    padding: 2rem;
    border-radius: 0.75rem;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
    position: relative;
    width: 90%;
    max-width: 500px;
  }
  .modal-close-btn {
    position: absolute;
    top: 0.75rem;
    right: 1rem;
    font-size: 1.75rem;
    font-weight: bold;
    color: #6b7280;
    border: none;
    background: none;
    cursor: pointer;
  }
  .modal-title {
    font-size: 1.5rem;
    font-weight: 600;
    text-align: center;
    margin-bottom: 1.5rem;
    color: #111827;
  }
</style>
