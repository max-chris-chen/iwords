<script lang="ts">
  import type { Section, Lesson } from "$lib/models/course";
  import LessonItem from "./LessonItem.svelte";

  type SectionWithLessons = Section & {
    lessons: Array<Lesson & { duration?: string }>;
  };

  let {
    section,
    courseId,
    index,
    onAddLesson,
    onEditSection,
    onDeleteSection,
  }: {
    section: SectionWithLessons;
    courseId: string | undefined;
    index: number;
    onAddLesson: (sectionId: string, sectionTitle: string) => void;
    onEditSection: (section: Section) => void;
    onDeleteSection: (sectionId: string) => void;
  } = $props();
</script>

<li class="section-item">
  <div class="section-item-header">
    <div class="section-item-title">
      <h3>第{index + 1}章: {section.title}</h3>
    </div>
    <div class="section-item-actions">
      <button
        class="btn-icon"
        aria-label="添加课时"
        onclick={() => section._id && onAddLesson(section._id, section.title)}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
      <button
        class="btn-icon"
        aria-label="编辑章节"
        onclick={() => onEditSection(section)}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          ><path
            d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
          /><path
            d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
          /></svg
        >
      </button>
      <button
        class="btn-icon"
        aria-label="删除章节"
        onclick={() => section._id && onDeleteSection(section._id)}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          ><polyline points="3 6 5 6 21 6" /><path
            d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
          /><line x1="10" y1="11" x2="10" y2="17" /><line
            x1="14"
            y1="11"
            x2="14"
            y2="17"
          /></svg
        >
      </button>
    </div>
  </div>

  {#if section.lessons?.length}
    <ul class="lessons-list">
      {#each section.lessons as lesson}
        <LessonItem {lesson} {courseId} sectionId={section._id} />
      {/each}
    </ul>
  {:else}
    <p class="no-lessons">本章节内还没有课时。</p>
  {/if}
</li>

<style>
  .section-item {
    background-color: var(--blue-bg-light);
    border: 1px solid #bfdbfe;
    border-radius: 0.75rem;
    padding: 1.5rem;
  }
  .section-item-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }
  .section-item-title h3 {
    margin: 0 0 0.25rem;
    font-size: 1.25rem;
    font-weight: 600;
    color: #1e3a8a;
  }
  .section-item-title p {
    margin: 0;
    color: #1e40af;
  }
  .section-item-actions {
    display: flex;
    gap: 0.5rem;
  }
  .btn-icon {
    background: transparent;
    border: none;
    color: #60a5fa;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 50%;
  }
  .btn-icon:hover {
    background-color: rgba(255, 255, 255, 0.5);
    color: #3b82f6;
  }
  .lessons-list {
    list-style: none;
    padding: 0;
    margin: 1.5rem 0 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .no-lessons {
    margin-top: 1rem;
    color: #1e40af;
  }
</style>
