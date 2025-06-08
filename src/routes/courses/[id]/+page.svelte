<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import AddLessonModal from "$lib/modals/AddLessonModal.svelte";
  import AddSectionModal from "$lib/modals/AddSectionModal.svelte";
  import type { Course, Lesson, Section } from "$lib/models/course";
  import { onMount } from "svelte";
  import { get } from "svelte/store";
  import {
    createLesson,
    updateLesson,
    deleteLesson as apiDeleteLesson,
  } from "$lib/api/lesson";
  import {
    createSection,
    updateSection,
    deleteSection as apiDeleteSection,
  } from "$lib/api/section";

  // Custom error type for API errors
  interface ApiError extends Error {
    message: string;
  }

  // Extended Course type that includes sections with lessons
  interface CourseWithSections extends Course {
    sections: Array<
      Section & {
        description?: string;
        lessons: Array<Lesson & { duration?: string }>;
      }
    >;
    totalHours?: number;
  }

  let course: CourseWithSections | null = null;
  let loading = true;
  let error = "";

  // UI state for adding section
  let newSectionTitle = "";
  let sectionError = "";

  // UI state for section modal
  let showSectionModal = false;
  let showEditSectionModal = false;
  let editSectionId: string | null = null;
  let editSectionTitle = "";
  let actionLoading = false;

  // UI state for add lesson modal
  let showAddLessonModal = false;
  let addLessonSectionId: string | null = null;
  let addLessonSectionTitle = "";
  let addLessonTitle = "";
  let addLessonContent = "";
  let addLessonError = "";
  let addLessonLoading = false;

  // UI state for edit lesson modal
  let showEditLessonModal = false;
  let editLessonSectionId: string | null = null;
  let editLessonId: string | null = null;
  let editLessonTitle = "";
  let editLessonContent = "";
  let editLessonError = "";
  let editLessonLoading = false;
  let editLessonSectionTitle = "";

  function openSectionModal() {
    showSectionModal = true;
    newSectionTitle = "";
    sectionError = "";
  }
  function closeSectionModal() {
    showSectionModal = false;
    newSectionTitle = "";
    sectionError = "";
  }
  async function handleAddSection() {
    sectionError = "";
    if (!newSectionTitle.trim()) {
      sectionError = "Section title required";
      return;
    }
    await addSection();
    if (!sectionError) {
      closeSectionModal();
    }
  }

  function openEditSectionModal(section: Section) {
    showEditSectionModal = true;
    editSectionId = section._id || null;
    editSectionTitle = section.title;
    sectionError = "";
  }
  function closeEditSectionModal() {
    showEditSectionModal = false;
    editSectionId = null;
    editSectionTitle = "";
    sectionError = "";
  }
  async function handleEditSection() {
    sectionError = "";
    if (!editSectionTitle.trim()) {
      sectionError = "Section title required";
      return;
    }
    if (!editSectionId) {
      sectionError = "Section not found";
      return;
    }
    actionLoading = true;
    const id = get(page).params.id;
    try {
      await updateSection(id, editSectionId, { title: editSectionTitle });
      showEditSectionModal = false;
      editSectionId = null;
      editSectionTitle = "";
      await fetchCourse();
    } catch (err: unknown) {
      const error = err as ApiError;
      sectionError = error.message || "更新失败";
    } finally {
      actionLoading = false;
    }
  }

  async function fetchCourse() {
    loading = true;
    error = "";
    const id = get(page).params.id;
    try {
      const res = await fetch(`/api/courses/${id}`);
      if (!res.ok) throw new Error(await res.text());
      course = await res.json();
    } catch (e: unknown) {
      const apiError = e as Error;
      error = apiError.message || "Failed to load course details";
    } finally {
      loading = false;
    }
  }

  onMount(fetchCourse);

  async function addSection() {
    sectionError = "";
    if (!newSectionTitle.trim()) {
      sectionError = "Section title required";
      return;
    }
    const id = get(page).params.id;
    try {
      await createSection(id, { title: newSectionTitle });
      newSectionTitle = "";
      await fetchCourse();
    } catch (err: unknown) {
      const error = err as ApiError;
      sectionError = error.message || "创建失败";
    }
  }

  async function deleteSection(sectionId: string) {
    if (!confirm("确定要删除该 Section 吗？")) return;
    actionLoading = true;
    const id = get(page).params.id;
    try {
      await apiDeleteSection(id, sectionId);
      await fetchCourse();
    } catch (err: unknown) {
      const error = err as ApiError;
      console.error(error.message || "删除失败");
    } finally {
      actionLoading = false;
    }
  }

  async function handleEditLessonModalEdit(e: CustomEvent) {
    editLessonError = "";
    editLessonLoading = true;
    if (!editLessonSectionId || !editLessonId) {
      editLessonError = "Lesson not found.";
      editLessonLoading = false;
      return;
    }
    if (!e.detail.title.trim()) {
      editLessonError = "Lesson title required";
      editLessonLoading = false;
      return;
    }
    const id = get(page).params.id;
    try {
      await updateLesson(id, editLessonSectionId, editLessonId, {
        title: e.detail.title,
        content: e.detail.content,
      });
      showEditLessonModal = false;
      editLessonSectionId = null;
      editLessonId = null;
      editLessonTitle = "";
      editLessonContent = "";
      editLessonSectionTitle = "";
      await fetchCourse();
    } catch (err: unknown) {
      const error = err as ApiError;
      editLessonError = error.message || "更新失败";
    } finally {
      editLessonLoading = false;
    }
  }

  async function deleteLesson(sectionId: string, lessonId: string) {
    actionLoading = true;
    const id = get(page).params.id;
    try {
      if (!confirm("确定要删除该 Lesson 吗？")) return;
      await apiDeleteLesson(id, sectionId, lessonId);
      await fetchCourse();
    } catch (err: unknown) {
      const error = err as ApiError;
      console.error(error.message || "删除失败");
    } finally {
      actionLoading = false;
    }
  }

  function startEditLesson(
    sectionId: string,
    lesson: Lesson,
    sectionTitle: string,
  ) {
    editLessonSectionId = sectionId;
    editLessonId = lesson._id || null;
    editLessonTitle = lesson.title;
    editLessonContent = lesson.content;
    editLessonSectionTitle = sectionTitle;
    editLessonError = "";
    showEditLessonModal = true;
  }

  function closeEditLessonModal() {
    showEditLessonModal = false;
    editLessonSectionId = null;
    editLessonId = null;
    editLessonTitle = "";
    editLessonContent = "";
    editLessonSectionTitle = "";
    editLessonError = "";
  }
  async function handleAddLesson() {
    addLessonError = "";
    addLessonLoading = true;
    if (!addLessonSectionId) {
      addLessonError = "Section not found.";
      addLessonLoading = false;
      return;
    }
    if (!addLessonTitle.trim()) {
      addLessonError = "Lesson title required";
      addLessonLoading = false;
      return;
    }
    const id = get(page).params.id;
    try {
      await createLesson(id, addLessonSectionId, {
        title: addLessonTitle,
        content: addLessonContent,
        text: "",
        sentences: [],
        sectionId: addLessonSectionId,
      });
      showAddLessonModal = false;
      addLessonSectionId = null;
      addLessonSectionTitle = "";
      addLessonTitle = "";
      addLessonContent = "";
      await fetchCourse();
    } catch (err: unknown) {
      const error = err as ApiError;
      addLessonError = error.message || "创建失败";
    } finally {
      addLessonLoading = false;
    }
  }

  function openAddLessonModal(sectionId: string, sectionTitle: string) {
    showAddLessonModal = true;
    addLessonSectionId = sectionId;
    addLessonSectionTitle = sectionTitle;
    addLessonTitle = "";
    addLessonContent = "";
    addLessonError = "";
  }

  function closeAddLessonModal() {
    showAddLessonModal = false;
    addLessonSectionId = null;
    addLessonSectionTitle = "";
    addLessonTitle = "";
    addLessonContent = "";
    addLessonError = "";
  }

  function handleAddLessonModalSave(e: CustomEvent) {
    addLessonError = "";
    addLessonLoading = true;
    if (!addLessonSectionId) {
      addLessonError = "Section not found.";
      addLessonLoading = false;
      return;
    }
    addLessonTitle = e.detail.title;
    addLessonContent = e.detail.content;
    handleAddLesson();
  }

  function startFirstLesson() {
    if (course?.sections?.[0]?.lessons?.[0]) {
      const firstSection = course.sections[0];
      const firstLesson = firstSection.lessons[0];
      if (course?._id && firstSection?._id && firstLesson?._id) {
        goto(
          `/courses/${course._id}/sections/${firstSection._id}/lessons/${firstLesson._id}`,
        );
      }
    }
  }

  // Helper no-op functions for modal props
  const noop = () => {};
</script>

{#if loading}
  <div class="loading-container">
    <p>Loading course details...</p>
  </div>
{:else if error}
  <div class="error-container">
    <p>Sorry, there was an error loading the course.</p>
    <p class="error-message">{error}</p>
  </div>
{:else if course}
  <div class="page-container">
    <header class="page-header">
      <a href="/courses" class="back-link">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          ><path d="M19 12H5M12 19l-7-7 7-7" /></svg
        >
        <span>返回课程列表</span>
      </a>
    </header>

    <main>
      <div class="course-hero-card">
        <div class="course-image-placeholder">
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
          </svg>
        </div>
        <div class="course-info">
          <h1>{course.title}</h1>
          <p class="course-description">
            {course.description ||
              ""}
          </p>
          <div class="course-stats">
            <span class="stat">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                ><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle
                  cx="9"
                  cy="7"
                  r="4"
                /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path
                  d="M16 3.13a4 4 0 0 1 0 7.75"
                /></svg
              >
              <span>{course.studentCount || 0} 学员</span>
            </span>
            <span class="stat">
              <svg
                width="16"
                height="16"
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
              <span>{course.totalHours || 18} 课时</span>
            </span>
            <span class="stat">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                ><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path
                  d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"
                /></svg
              >
              <span>{course.sections?.length || 0} 章节</span>
            </span>
          </div>
        </div>
      </div>

      <div class="sections-container">
        <div class="sections-header">
          <h2>课程章节</h2>
          <button class="btn-add-section" on:click={openSectionModal}>
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

        {#if course.sections?.length}
          <ul class="sections-list">
            {#each course.sections as section, i}
              <li class="section-item">
                <div class="section-item-header">
                  <div class="section-item-title">
                    <h3>第一章: {section.title}</h3>
                    <p>
                      {section.description || "学习在购物时的常用英语表达"}
                    </p>
                  </div>
                  <div class="section-item-actions">
                    <button
                      class="btn-icon"
                      aria-label="Edit section"
                      on:click={() => openEditSectionModal(section)}
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
                      aria-label="Delete section"
                      on:click={() => section._id && deleteSection(section._id)}
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
                      <li class="lesson-item">
                        <div class="lesson-info">
                          <div class="lesson-play-icon">
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              stroke="currentColor"
                              stroke-width="1"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            >
                              <polygon points="5 3 19 12 5 21 5 3" />
                            </svg>
                          </div>
                          <span class="lesson-title">{lesson.title}</span>
                        </div>
                        <div class="lesson-actions">
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
                            <span>{lesson.duration || "15 分钟"}</span>
                          </span>
                          <button
                            class="btn-start-lesson"
                            on:click|stopPropagation={() => {
                              if (
                                course?._id &&
                                section?._id &&
                                lesson?._id
                              ) {
                                goto(
                                  `/courses/${course._id}/sections/${section._id}/lessons/${lesson._id}`,
                                );
                              }
                            }}>开始学习</button
                          >
                        </div>
                      </li>
                    {/each}
                  </ul>
                {/if}
              </li>
            {/each}
          </ul>
        {:else}
          <div class="no-sections-card">
            <p>本课程还没有任何章节。</p>
            <button class="btn btn-primary" on:click={openSectionModal}
              >创建第一个章节</button
            >
          </div>
        {/if}
      </div>
    </main>
  </div>
{/if}

<AddSectionModal
  open={showSectionModal}
  error={sectionError}
  loading={actionLoading}
  bind:newTitle={newSectionTitle}
  editMode={false}
  onAdd={handleAddSection}
  onEdit={noop}
  onClose={closeSectionModal}
/>
<AddSectionModal
  open={showEditSectionModal}
  error={sectionError}
  loading={actionLoading}
  bind:editTitle={editSectionTitle}
  editMode={true}
  onAdd={noop}
  onEdit={handleEditSection}
  onClose={closeEditSectionModal}
/>
<AddLessonModal
  open={showAddLessonModal}
  loading={addLessonLoading}
  error={addLessonError}
  newTitle={addLessonTitle}
  newContent={addLessonContent}
  sectionTitle={addLessonSectionTitle}
  on:save={handleAddLessonModalSave}
  on:close={closeAddLessonModal}
  editMode={false}
/>
<AddLessonModal
  open={showEditLessonModal}
  loading={editLessonLoading}
  error={editLessonError}
  editMode={true}
  editTitle={editLessonTitle}
  editContent={editLessonContent}
  sectionTitle={editLessonSectionTitle}
  on:edit={handleEditLessonModalEdit}
  on:close={closeEditLessonModal}
/>

<style>
  :root {
    --primary-color: #2563eb;
    --primary-hover-color: #1d4ed8;
    --text-primary: #1f2937;
    --text-secondary: #4b5563;
    --text-light: #6b7280;
    --bg-color: #f9fafb;
    --card-bg-color: #ffffff;
    --border-color: #e5e7eb;
    --blue-bg-light: #eff6ff;
  }
  .page-container {
    padding: 1rem 2rem;
    max-width: 1200px;
    margin: 0 auto;
    background-color: var(--bg-color);
  }
  .loading-container,
  .error-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 80vh;
    font-size: 1.2rem;
    color: var(--text-secondary);
  }
  .error-message {
    color: #ef4444;
    font-family: monospace;
    margin-top: 1rem;
    background-color: #fee2e2;
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
  }
  .page-header {
    margin-bottom: 1.5rem;
  }
  .back-link {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--text-secondary);
    text-decoration: none;
    font-weight: 500;
  }
  .back-link:hover {
    color: var(--text-primary);
  }
  .course-hero-card {
    background-color: var(--card-bg-color);
    border-radius: 0.75rem;
    padding: 2rem;
    display: flex;
    gap: 2rem;
    align-items: flex-start;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1),
      0 1px 2px -1px rgba(0, 0, 0, 0.1);
  }
  .course-image-placeholder {
    width: 12rem;
    height: 9rem;
    background-color: #f3f4f6;
    border-radius: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #9ca3af;
    flex-shrink: 0;
  }
  .course-info {
    flex-grow: 1;
  }
  .course-info h1 {
    font-size: 1.875rem;
    font-weight: bold;
    color: var(--text-primary);
    margin: 0 0 0.5rem;
  }
  .course-description {
    font-size: 1rem;
    color: var(--text-light);
    margin-bottom: 1.5rem;
  }
  .course-stats {
    display: flex;
    gap: 1.5rem;
    color: var(--text-secondary);
  }
  .stat {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .stat svg {
    color: var(--text-light);
  }
  .course-actions {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    flex-shrink: 0;
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
  .btn-secondary {
    background-color: var(--card-bg-color);
    color: var(--text-secondary);
    border-color: var(--border-color);
  }
  .btn-secondary:hover {
    background-color: #f3f4f6;
    border-color: #d1d5db;
  }
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
  .no-sections-card {
    background-color: var(--card-bg-color);
    border-radius: 0.75rem;
    padding: 2rem;
    text-align: center;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1),
      0 1px 2px -1px rgba(0, 0, 0, 0.1);
  }
  .no-sections-card p {
    color: var(--text-secondary);
    margin: 0 0 1rem;
  }
</style>
