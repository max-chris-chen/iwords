<script lang="ts">
  import { goto } from "$app/navigation";
  import { stopPropagation } from "svelte/legacy";
  import type { Lesson } from "$lib/models/course";

  let {
    lesson,
    courseId,
    sectionId,
  }: {
    lesson: Lesson & { duration?: string };
    courseId: string | undefined;
    sectionId: string | undefined;
  } = $props();
</script>

<li class="lesson-item">
  <div class="lesson-info">
    <div class="lesson-play-icon">
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
        <path d="M8 7h6" />
        <path d="M8 11h8" />
      </svg>
    </div>
    <span class="lesson-title">{lesson.title}</span>
  </div>
  <div class="lesson-actions">
    {#if lesson.duration}
      <span class="lesson-duration">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          ><circle cx="12" cy="12" r="10" /><polyline
            points="12 6 12 12 16 14"
          /></svg
        >
        <span>{lesson.duration}</span>
      </span>
    {/if}
    <button
      class="btn-start-lesson"
      onclick={stopPropagation(() => {
        if (courseId && sectionId && lesson?._id) {
          goto(
            `/courses/${courseId}/sections/${sectionId}/lessons/${lesson._id}`,
          );
        }
      })}>开始学习</button
    >
  </div>
</li>

<style>
  .lesson-item {
    background-color: var(--card-bg-color);
    border: 1px solid var(--border-color);
    border-radius: 0.5rem;
    padding: 0.75rem 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .lesson-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  .lesson-play-icon {
    color: var(--primary-color);
    background-color: var(--blue-bg-light);
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .lesson-title {
    font-weight: 500;
    color: var(--text-primary);
  }
  .lesson-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  .lesson-duration {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    color: var(--text-light);
    font-size: 0.875rem;
  }
  .btn-start-lesson {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--primary-color);
    text-decoration: none;
    background: transparent;
    border: none;
    cursor: pointer;
  }
  .btn-start-lesson:hover {
    text-decoration: underline;
  }
</style>
