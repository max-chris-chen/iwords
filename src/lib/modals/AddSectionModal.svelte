<script lang="ts">
  let {
    onAdd,
    onEdit,
    open = $bindable(false),
    newTitle = $bindable(""),
    error = "",
    loading = false,
    editMode = false,
    editTitle = $bindable(""),
  } = $props<{
    onAdd?: () => void;
    onEdit?: () => void;
    open?: boolean;
    newTitle?: string;
    error?: string;
    loading?: boolean;
    editMode?: boolean;
    editTitle?: string;
  }>();

  function handleSubmit() {
    if (editMode) {
      if (onEdit) onEdit();
    } else {
      if (onAdd) onAdd();
    }
  }

  function handleClose() {
    open = false;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      handleClose();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if open}
  <div class="modal-backdrop" on:click={handleClose}>
    <div class="modal-content" on:click|stopPropagation>
      <button class="modal-close-btn" on:click={handleClose}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
      <div class="modal-header">
        <h2 class="modal-title">{editMode ? "编辑章节" : "添加新章节"}</h2>
        <p class="modal-subtitle">
          {editMode ? "修改章节标题" : "为你的课程添加一个新的章节"}
        </p>
      </div>
      <form on:submit|preventDefault={handleSubmit}>
        <div class="form-group">
          <label for="title">章节标题</label>
          {#if editMode}
            <input
              type="text"
              id="title"
              placeholder="例如：第一章：入门介绍"
              required
              bind:value={editTitle}
              autofocus
            />
          {:else}
            <input
              type="text"
              id="title"
              placeholder="例如：第一章：入门介绍"
              required
              bind:value={newTitle}
              autofocus
            />
          {/if}
        </div>
        {#if error}
          <p class="error-message">{error}</p>
        {/if}
        <div class="form-actions">
          <button type="button" class="btn-secondary" on:click={handleClose}
            >取消</button
          >
          <button type="submit" class="btn-primary" disabled={loading}>
            {#if loading}
              <span>{editMode ? "保存中..." : "添加中..."}</span>
            {:else}
              <span>{editMode ? "确认保存" : "确认添加"}</span>
            {/if}
          </button>
        </div>
      </form>
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
    background-color: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    -webkit-backdrop-filter: blur(3px);
    backdrop-filter: blur(3px);
  }
  .modal-content {
    background: #ffffff;
    border-radius: 12px;
    box-shadow:
      0 10px 25px -5px rgba(0, 0, 0, 0.1),
      0 10px 10px -5px rgba(0, 0, 0, 0.04);
    width: 90%;
    max-width: 520px;
    padding: 2rem;
    position: relative;
    transform: scale(0.95);
    opacity: 0;
    animation: fadeIn 0.3s forwards;
  }

  @keyframes fadeIn {
    to {
      transform: scale(1);
      opacity: 1;
    }
  }

  .modal-close-btn {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: transparent;
    border: none;
    cursor: pointer;
    color: #9ca3af;
    padding: 0.5rem;
    border-radius: 50%;
    transition:
      background-color 0.2s,
      color 0.2s;
  }
  .modal-close-btn:hover {
    background-color: #f3f4f6;
    color: #1f2937;
  }
  .modal-header {
    text-align: center;
    margin-bottom: 1.5rem;
  }
  .modal-title {
    font-size: 1.75rem;
    font-weight: 700;
    color: #1f2937;
  }
  .modal-subtitle {
    margin-top: 0.5rem;
    font-size: 1rem;
    color: #6b7280;
  }

  .form-group {
    margin-bottom: 1.25rem;
  }
  .form-group label {
    display: block;
    font-weight: 600;
    color: #374151;
    margin-bottom: 0.5rem;
  }
  .form-group input {
    width: 100%;
    padding: 0.75rem 1rem;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 1rem;
    color: #1f2937;
    transition:
      border-color 0.2s,
      box-shadow 0.2s;
  }
  .form-group input:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
  }

  .error-message {
    text-align: center;
    color: #dc2626;
    margin: 1rem 0;
    font-weight: 500;
  }
  .form-actions {
    margin-top: 2rem;
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
  }
  .btn-primary,
  .btn-secondary {
    padding: 0.65rem 1.5rem;
    border-radius: 8px;
    font-weight: 600;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
  }
  .btn-primary {
    background-color: #2563eb;
    color: white;
  }
  .btn-primary:hover {
    background-color: #1d4ed8;
  }
  .btn-primary:disabled {
    background-color: #93c5fd;
    cursor: not-allowed;
  }
  .btn-secondary {
    background-color: #e5e7eb;
    color: #374151;
  }
  .btn-secondary:hover {
    background-color: #d1d5db;
  }
</style>
