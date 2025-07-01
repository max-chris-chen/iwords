<script lang="ts">
  import type { Section, Lesson } from "$lib/models/course";
  import SectionItem from "./SectionItem.svelte";

  type SectionWithLessons = Section & {
    lessons: Array<Lesson & { duration?: string }>;
  };

  let {
    sections,
    courseId,
    onOpenSectionModal,
    onAddLesson,
    onEditSection,
    onDeleteSection,
  }: {
    sections: SectionWithLessons[];
    courseId: string | undefined;
    onOpenSectionModal: () => void;
    onAddLesson: (sectionId: string, sectionTitle: string) => void;
    onEditSection: (section: Section) => void;
    onDeleteSection: (sectionId: string) => void;
  } = $props();
</script>

<div class="sections-container">
  <div class="sections-header">
    <h2>课程章节</h2>
    <button class="btn-add-section" onclick={onOpenSectionModal}>
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        ><line x1="12" y1="5" x2="12" y2="19" /><line
          x1="5"
          y1="12"
          x2="19"
          y2="12"
        /></svg
      >
      <span>添加章节</span>
    </button>
  </div>

  {#if sections?.length}
    <ul class="sections-list">
      {#each sections as section, i}
        <SectionItem
          {section}
          index={i}
          {courseId}
          {onAddLesson}
          {onEditSection}
          {onDeleteSection}
        />
      {/each}
    </ul>
  {:else}
    <div class="no-sections-card">
      <p>本课程还没有任何章节。</p>
      <button class="btn btn-primary" onclick={onOpenSectionModal}
        >创建第一个章节</button
      >
    </div>
  {/if}
</div>

<style>
  .sections-container {
    margin-top: 2.5rem;
  }
  .sections-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }
  .sections-header h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--text-primary);
  }
  .btn-add-section {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background-color: #10b981;
    color: white;
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 0.375rem;
    font-weight: 500;
    cursor: pointer;
  }
  .btn-add-section:hover {
    background-color: #059669;
  }
  .sections-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  .no-sections-card {
    background-color: var(--card-bg-color);
    border-radius: 0.75rem;
    padding: 2rem;
    text-align: center;
    box-shadow:
      0 1px 3px 0 rgba(0, 0, 0, 0.1),
      0 1px 2px -1px rgba(0, 0, 0, 0.1);
  }
  .no-sections-card p {
    color: var(--text-secondary);
    margin: 0 0 1rem;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.625rem 1.25rem;
    border-radius: 0.375rem;
    border: 1px solid transparent;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease-in-out;
    text-decoration: none;
  }
  .btn-primary {
    background-color: var(--primary-color);
    color: white;
  }
  .btn-primary:hover {
    background-color: var(--primary-hover-color);
  }
</style>
