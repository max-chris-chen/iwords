<script lang="ts">
  import type { Course } from "$lib/models/course";
  import { CourseStatus } from "$lib/models/course";

  let {
    open = $bindable(false),
    loading = false,
    error = "",
    editMode = false,
    course = null,
    onSave = undefined,
  } = $props<{
    open?: boolean;
    loading?: boolean;
    error?: string;
    editMode?: boolean;
    course?: Course | null;
    onSave?: (data: {
      title: string;
      description: string;
      isPublic: boolean;
      status: CourseStatus;
    }) => void;
  }>();

  let title = $state("");
  let description = $state("");
  let isPublic = $state(false);
  let status = $state(CourseStatus.Draft);

  $effect(() => {
    if (open) {
      if (editMode && course) {
        title = course.title;
        description = course.description || "";
        isPublic = course.isPublic;
        status = course.status || CourseStatus.Draft;
      } else {
        title = "";
        description = "";
        isPublic = false;
        status = CourseStatus.Draft;
      }
    }
  });

  function handleSave(event: Event) {
    event.preventDefault();
    onSave?.({ title, description, isPublic, status });
  }

  function handleClose() {
    open = false;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      handleClose();
    }
  }

  function handleModalClick(event: MouseEvent) {
    event.stopPropagation();
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
  <div class="modal-backdrop" role="presentation" onclick={handleClose}>
    <div class="modal-content" role="presentation" onclick={handleModalClick}>
      <button class="modal-close-btn" aria-label="关闭" onclick={handleClose}>
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
        <h2 class="modal-title">{editMode ? "编辑课程" : "创建新课程"}</h2>
        <p class="modal-subtitle">
          {editMode
            ? "编辑课程的基本信息"
            : "填写课程的基本信息，开始你的教学之旅。"}
        </p>
      </div>
      <form onsubmit={handleSave}>
        <div class="form-group">
          <label for="title">课程标题</label>
          <input
            type="text"
            id="title"
            bind:value={title}
            placeholder="例如：新概念英语"
            required
          />
        </div>
        <div class="form-group">
          <label for="description">课程描述</label>
          <textarea
            id="description"
            bind:value={description}
            rows="4"
            placeholder="简单介绍你的课程内容"
          ></textarea>
        </div>
        <div class="form-group">
          <label for="status">课程状态</label>
          <select id="status" bind:value={status} class="custom-select">
            {#each Object.values(CourseStatus) as s}
              <option value={s}>{s === "draft" ? "草稿" : "发布"}</option>
            {/each}
          </select>
        </div>
        <div class="flex items-center justify-between">
          <label
            for="is-public"
            class="flex items-center cursor-pointer select-none relative"
          >
            <input
              type="checkbox"
              id="is-public"
              class="custom-checkbox"
              bind:checked={isPublic}
            />
            <span class="checkbox-visual mr-2"></span>
            <span class="text-gray-700 font-medium">设为公开课程</span>
          </label>
        </div>
        {#if error}
          <p class="error-message">{error}</p>
        {/if}
        <div class="form-actions">
          <button type="button" class="btn-secondary" onclick={handleClose}
            >取消</button
          >
          <button type="submit" class="btn-primary" disabled={loading}>
            {#if loading}
              <span>{editMode ? "保存中..." : "创建中..."}</span>
            {:else}
              <span>{editMode ? "确认保存" : "确认创建"}</span>
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
  .form-group input,
  .form-group textarea {
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
  .form-group input:focus,
  .form-group textarea:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
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

  .custom-select {
    width: 100%;
    padding: 0.75rem 1rem;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 1rem;
    color: #1f2937;
    background-color: white;
    appearance: none;
    background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
    background-repeat: no-repeat;
    background-position: right 1rem center;
    background-size: 1.2em;
    transition:
      border-color 0.2s,
      box-shadow 0.2s;
  }
  .custom-select:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
  }

  .custom-checkbox {
    position: absolute;
    opacity: 0;
    width: 20px;
    height: 20px;
    margin: 0;
    z-index: 2;
    cursor: pointer;
  }
  .checkbox-visual {
    display: inline-block;
    width: 20px;
    height: 20px;
    border: 2px solid #2563eb;
    border-radius: 6px;
    background: #fff;
    transition:
      background 0.2s,
      border-color 0.2s;
    position: relative;
    vertical-align: middle;
    box-sizing: border-box;
    margin-right: 0.5rem;
  }
  .custom-checkbox:checked + .checkbox-visual {
    background: #2563eb;
    border-color: #2563eb;
  }
  .custom-checkbox:checked + .checkbox-visual::after {
    content: "";
    position: absolute;
    left: 5px;
    top: 2px;
    width: 6px;
    height: 12px;
    border: solid #fff;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
  }
  .custom-checkbox:focus + .checkbox-visual {
    box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
    border-color: #1d4ed8;
  }
  .custom-checkbox:hover + .checkbox-visual,
  .custom-checkbox:active + .checkbox-visual {
    border-color: #1d4ed8;
  }
</style>
