<script lang="ts">
  import { stopPropagation } from "svelte/legacy";

  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import AddLessonModal from "$lib/modals/AddLessonModal.svelte";
  import AddSectionModal from "$lib/modals/AddSectionModal.svelte";
  import type { Course, Lesson, Section } from "$lib/models/course";
  import { onMount } from "svelte";
  import { createLesson, updateLesson, fetchLessons } from "$lib/api/lesson";
  import {
    createSection,
    updateSection,
    deleteSection as apiDeleteSection,
  } from "$lib/api/section";
  import CourseHeader from "$lib/components/course-detail/CourseHeader.svelte";
  import SectionList from "$lib/components/course-detail/SectionList.svelte";

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

  let course = $state<CourseWithSections | null>(null);
  let loading = $state(true);
  let error = $state("");

  // UI state for adding section
  let newSectionTitle = $state("");
  let sectionError = $state("");

  // UI state for section modal
  let showSectionModal = $state(false);
  let showEditSectionModal = $state(false);
  let editSectionId = $state<string | null>(null);
  let editSectionTitle = $state("");
  let actionLoading = $state(false);

  // UI state for add lesson modal
  let showAddLessonModal = $state(false);
  let addLessonSectionId = $state<string | null>(null);
  let addLessonSectionTitle = $state("");
  let addLessonTitle = $state("");
  let addLessonContent = $state("");
  let addLessonError = $state("");
  let addLessonLoading = $state(false);

  // UI state for edit lesson modal
  let showEditLessonModal = $state(false);
  let editLessonSectionId = $state<string | null>(null);
  let editLessonId = $state<string | null>(null);
  let editLessonTitle = $state("");
  let editLessonContent = $state("");
  let editLessonError = $state("");
  let editLessonLoading = $state(false);
  let editLessonSectionTitle = $state("");

  function openSectionModal() {
    showSectionModal = true;
    newSectionTitle = "";
    sectionError = "";
  }
  async function handleAddSection() {
    sectionError = "";
    if (!newSectionTitle.trim()) {
      sectionError = "章节标题不能为空";
      return;
    }
    await addSection();
    if (!sectionError) {
      showSectionModal = false;
    }
  }

  function openEditSectionModal(section: Section) {
    showEditSectionModal = true;
    editSectionId = section._id || null;
    editSectionTitle = section.title;
    sectionError = "";
  }
  async function handleEditSection() {
    sectionError = "";
    if (!editSectionTitle.trim()) {
      sectionError = "章节标题不能为空";
      return;
    }
    if (!editSectionId) {
      sectionError = "未找到章节";
      return;
    }
    actionLoading = true;
    const id = page.params.id;
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
    const id = page.params.id;
    try {
      const res = await fetch(`/api/courses/${id}`);
      if (!res.ok) throw new Error(await res.text());
      const courseData: CourseWithSections = await res.json();
      if (courseData.sections) {
        await Promise.all(
          courseData.sections.map(async (section) => {
            if (section._id) {
              section.lessons = await fetchLessons(id, section._id);
            }
          }),
        );
      }
      course = courseData;
    } catch (e: unknown) {
      const apiError = e as Error;
      error = apiError.message || "加载课程详情失败";
    } finally {
      loading = false;
    }
  }

  onMount(fetchCourse);

  async function addSection() {
    sectionError = "";
    if (!newSectionTitle.trim()) {
      sectionError = "章节标题不能为空";
      return;
    }
    const id = page.params.id;
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
    const id = page.params.id;
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
      editLessonError = "未找到课时";
      editLessonLoading = false;
      return;
    }
    if (!e.detail.title.trim()) {
      editLessonError = "课时标题不能为空";
      editLessonLoading = false;
      return;
    }
    const id = page.params.id;
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

  function openAddLessonModal(sectionId: string, sectionTitle: string) {
    showAddLessonModal = true;
    addLessonSectionId = sectionId;
    addLessonSectionTitle = sectionTitle;
    addLessonTitle = "";
    addLessonContent = "";
    addLessonError = "";
  }
</script>

{#if loading}
  <div class="loading-container">
    <p>正在加载课程详情...</p>
  </div>
{:else if error}
  <div class="error-container">
    <p>抱歉，加载课程时出错。</p>
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
          stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg
        >
        <span>返回课程列表</span>
      </a>
    </header>

    <main>
      <CourseHeader course={course} />
      <SectionList
        sections={course.sections}
        courseId={course._id}
        onOpenSectionModal={openSectionModal}
        onAddLesson={openAddLessonModal}
        onEditSection={openEditSectionModal}
        onDeleteSection={deleteSection}
      />
    </main>
  </div>
{/if}

<AddSectionModal
  bind:open={showSectionModal}
  bind:newTitle={newSectionTitle}
  error={sectionError}
  loading={actionLoading}
  onAdd={handleAddSection}
/>
<AddSectionModal
  bind:open={showEditSectionModal}
  bind:editTitle={editSectionTitle}
  editMode={true}
  error={sectionError}
  loading={actionLoading}
  onEdit={handleEditSection}
/>
<AddLessonModal
  bind:open={showAddLessonModal}
  bind:newTitle={addLessonTitle}
  bind:newContent={addLessonContent}
  sectionTitle={addLessonSectionTitle}
  error={addLessonError}
  loading={addLessonLoading}
  on:save={async (e) => {
    addLessonError = "";
    if (!addLessonSectionId) {
      addLessonError = "未找到章节。";
      return;
    }
    if (!e.detail.title.trim()) {
      addLessonError = "课时标题不能为空";
      return;
    }
    addLessonLoading = true;
    const id = page.params.id;
    try {
      await createLesson(id, addLessonSectionId, {
        title: e.detail.title,
        content: e.detail.content,
        sectionId: addLessonSectionId,
      });
      showAddLessonModal = false;
      await fetchCourse();
    } catch (err: unknown) {
      const error = err as ApiError;
      addLessonError = error.message || "创建失败";
    } finally {
      addLessonLoading = false;
    }
  }}
/>
<AddLessonModal
  bind:open={showEditLessonModal}
  editMode={true}
  bind:editTitle={editLessonTitle}
  bind:editContent={editLessonContent}
  sectionTitle={editLessonSectionTitle}
  error={editLessonError}
  loading={editLessonLoading}
  on:edit={handleEditLessonModalEdit}
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
</style>
