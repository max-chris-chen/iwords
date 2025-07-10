<script lang="ts">
  import { page } from "$app/stores";
  import AddLessonModal from "$lib/modals/AddLessonModal.svelte";
  import AddSectionModal from "$lib/modals/AddSectionModal.svelte";
  import type { Section } from "$lib/models/course";
  import CourseHeader from "$lib/components/course-detail/CourseHeader.svelte";
  import SectionList from "$lib/components/course-detail/SectionList.svelte";
  import type { PageData, ActionData } from "./$types";
  import { createLesson, updateLesson } from "$lib/api/lesson";
  import { enhance } from "$app/forms";

  let { data, form } = $props<{ data: PageData; form: ActionData }>();
  let { course } = $derived(data);

  // Custom error type for API errors
  interface ApiError extends Error {
    message: string;
  }

  // UI state for section modal
  let showSectionModal = $state(false);
  let showEditSectionModal = $state(false);
  let editSectionId = $state<string | null>(null);
  let editSectionTitle = $state("");
  let sectionError = $state("");

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
  }

  function openEditSectionModal(section: Section) {
    showEditSectionModal = true;
    editSectionId = section._id || null;
    editSectionTitle = section.title;
    sectionError = "";
  }

  function deleteSection(sectionId: string) {
    if (!confirm("确定要删除该 Section 吗？")) return;

    const formData = new FormData();
    formData.set("sectionId", sectionId);

    const formEl = document.createElement("form");
    formEl.method = "POST";
    formEl.action = "?/deleteSection";
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = "sectionId";
    input.value = sectionId;
    formEl.appendChild(input);
    document.body.appendChild(formEl);

    enhance(formEl, ({ action }) => {
      return async ({ result, update }) => {
        if (result.type === "error") {
          console.error(result.error.message);
        } else {
          await update();
        }
        document.body.removeChild(formEl);
      };
    });

    formEl.requestSubmit();
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
    const id = $page.params.id;
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

{#if !course}
  <div class="loading-container">
    <p>正在加载课程详情...</p>
  </div>
{:else}
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
      <CourseHeader {course} />
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
  {form}
  onAdd={() => (showSectionModal = false)}
/>

<AddSectionModal
  bind:open={showEditSectionModal}
  bind:editTitle={editSectionTitle}
  editMode={true}
  error={sectionError}
  sectionId={editSectionId ?? ""}
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
    const id = $page.params.id;
    try {
      await createLesson(id, addLessonSectionId, {
        title: e.detail.title,
        content: e.detail.content,
        sectionId: addLessonSectionId,
      });
      showAddLessonModal = false;
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
