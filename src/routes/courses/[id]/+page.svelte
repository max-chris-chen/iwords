<script lang="ts">
  import { page } from "$app/stores";
  import AddLessonModal from '$lib/modals/AddLessonModal.svelte';
  import AddSectionModal from '$lib/modals/AddSectionModal.svelte';
  import type { Course, Lesson, Section } from '$lib/models/course';
  import { onMount } from "svelte";
  import { get } from "svelte/store";

  let course: Course | null = null;
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
  let actionMessage = "";

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
    actionLoading = true;
    const id = get(page).params.id;
    // 正确的API路径应为 /api/courses/:id，body中带sectionId
    const res = await fetch(`/api/courses/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sectionId: editSectionId, title: editSectionTitle }),
    });
    if (!res.ok) {
      sectionError = await res.text();
    } else {
      showEditSectionModal = false;
      editSectionId = null;
      editSectionTitle = "";
      await fetchCourse();
    }
    actionLoading = false;
  }

  async function fetchCourse() {
    loading = true;
    error = "";
    const id = get(page).params.id;
    try {
      const res = await fetch(`/api/courses/${id}`);
      if (!res.ok) throw new Error(await res.text());
      course = await res.json();
    } catch (e) {
      error = e.message || "Failed to load course details";
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
    const res = await fetch(`/api/courses/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section: { title: newSectionTitle } }),
    });
    if (!res.ok) {
      sectionError = await res.text();
      return;
    }
    newSectionTitle = "";
    await fetchCourse();
  }

  async function deleteSection(sectionId: string) {
    if (!confirm('确定要删除该 Section 吗？')) return;
    actionLoading = true;
    actionMessage = "";
    const id = get(page).params.id;
    const res = await fetch(`/api/courses/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deleteSectionId: sectionId }),
    });
    if (!res.ok) {
      actionMessage = await res.text();
    } else {
      actionMessage = "Section deleted.";
      await fetchCourse();
    }
    actionLoading = false;
  }

  async function deleteLesson(sectionId: string, lessonId: string) {
    actionLoading = true;
    actionMessage = "";
    const id = get(page).params.id;
    const res = await fetch(`/api/courses/${id}/sections/${sectionId}/lessons/${lessonId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      actionMessage = await res.text();
    } else {
      actionMessage = "Lesson deleted.";
      await fetchCourse();
    }
    actionLoading = false;
  }

  function startEditLesson(sectionId: string, lesson: Lesson, sectionTitle: string) {
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
    const res = await fetch(`/api/courses/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        editLesson: { title: e.detail.title, content: e.detail.content },
        sectionId: editLessonSectionId,
        lessonId: editLessonId,
      }),
    });
    if (!res.ok) {
      editLessonError = await res.text();
      editLessonLoading = false;
      return;
    }
    showEditLessonModal = false;
    editLessonSectionId = null;
    editLessonId = null;
    editLessonTitle = "";
    editLessonContent = "";
    editLessonSectionTitle = "";
    await fetchCourse();
    editLessonLoading = false;
  }

  async function handleAddLesson() {
    addLessonError = "";
    addLessonLoading = true;
    if (!addLessonSectionId) {
      addLessonError = "Section not found.";
      addLessonLoading = false;
      return;
    }
    if (!newLessonTitle.trim()) {
      addLessonError = "Lesson title required";
      addLessonLoading = false;
      return;
    }
    const id = get(page).params.id;
    const res = await fetch(`/api/courses/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lesson: { title: newLessonTitle, content: newLessonContent },
        sectionId: addLessonSectionId,
      }),
    });
    if (!res.ok) {
      addLessonError = await res.text();
      addLessonLoading = false;
      return;
    }
    showAddLessonModal = false;
    addLessonSectionId = null;
    addLessonSectionTitle = "";
    addLessonTitle = "";
    addLessonContent = "";
    await fetchCourse();
    addLessonLoading = false;
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
    // 直接用 e.detail.title 和 e.detail.content 作为 newLessonTitle/newLessonContent
    newLessonTitle = e.detail.title;
    newLessonContent = e.detail.content;
    handleAddLesson();
  }

  // Helper no-op functions for modal props
  const noop = () => {};
</script>

{#if loading}
  <p>Loading...</p>
{:else if error}
  <div style="color:red">{error}</div>
{:else if course}
  <h1 class="course-title"><a href={location.pathname}>{course.title}</a></h1>
  {#if actionMessage}
    <div style="color:green">{actionMessage}</div>
  {/if}
  <div class="sections-header">
    <h2 class="sections-title">Sections</h2>
    <span class="add-section-icon" title="Add Section" on:click={openSectionModal} tabindex="0" role="button" aria-label="Add Section">+</span>
  </div>
  <AddSectionModal
    open={showSectionModal}
    error={sectionError}
    loading={actionLoading}
    newTitle={newSectionTitle}
    editMode={false}
    onAdd={handleAddSection}
    onEdit={noop}
    onClose={closeSectionModal}
  />
  <AddSectionModal
    open={showEditSectionModal}
    error={sectionError}
    loading={actionLoading}
    editTitle={editSectionTitle}
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
  {#if course.sections?.length}
    <ul style="list-style:none;padding:0;">
      {#each course.sections as section}
        <li class="section-card">
          <div class="section-header">
            <div class="section-title large">{section.title}</div>
            <div class="section-actions">
              <span class="add-lesson-icon" on:click={() => openAddLessonModal(String(section._id), section.title || '')} aria-label={`Add lesson to section ${section.title}`}
                tabindex="0" role="button">
                <!-- Lucide Plus-Circle icon -->
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
              </span>
              <span class="edit-icon" on:click={() => openEditSectionModal(section)} aria-label="Edit section">
                <!-- Lucide Pencil icon -->
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15.232 5.232a3 3 0 1 1 4.243 4.243L7.5 21.5l-4 1 1-4 14.732-14.732z"></path></svg>
              </span>
              <span class="delete-icon" on:click={() => deleteSection(section._id)} aria-label="Delete section">
                <!-- Lucide Trash-2 icon -->
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
              </span>
            </div>
          </div>
          
          {#if section.lessons?.length}
            <div class="lesson-list">
              <ul style="margin-top:0.5em;">
                {#each section.lessons as lesson}
                  <li class="lesson-item">
                    <div>
                      <span class="lesson-title">{lesson.title}</span>
                      <span class="lesson-content">{lesson.content}</span>
                    </div>
                    <div class="lesson-actions">
                      <button on:click={() => startEditLesson(String(section._id), lesson, section.title || '')} style="margin-left:1em;">Edit</button>
                      <button on:click={() => deleteLesson(String(section._id), String(lesson._id))} style="margin-left:0.5em;" aria-label="Delete lesson">Delete</button>
                    </div>
                  </li>
                {/each}
              </ul>
            </div>
          {/if}
        </li>
      {/each}
    </ul>
  {:else}
    <p>No sections found.</p>
  {/if}
{/if}

<style>
  h1 {
    margin-bottom: 0.5em;
  }
  h2 {
    margin-top: 2em;
  }
  .course-title {
    text-align: center;
    margin-bottom: 1.2em;
    font-size: 2.2em;
    font-weight: bold;
    color: #1e293b;
  }
  .sections-header {
    display: flex;
    align-items: center;
    gap: 0.7em;
    margin-bottom: 0.7em;
  }
  .sections-title {
    font-size: 1.5em;
    font-weight: 600;
    color: #374151;
    margin: 0;
  }
  .add-section-icon {
    font-size: 2em;
    color: #10b981;
    cursor: pointer;
    user-select: none;
    margin-left: 0.2em;
    transition: color 0.15s;
    line-height: 1;
    border-radius: 50%;
    width: 1.3em;
    height: 1.3em;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .add-section-icon:hover, .add-section-icon:focus {
    color: #059669;
    background: #e0f2f1;
    outline: none;
  }
  .section-card {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 1.5em;
    margin-bottom: 1.5em;
    background: #f9fafb;
    box-shadow: 0 2px 8px 0 rgba(0,0,0,0.03);
    transition: box-shadow 0.2s;
  }
  .section-card:hover {
    box-shadow: 0 4px 16px 0 rgba(0,0,0,0.07);
  }
  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.5em;
  }
  .section-title {
    font-size: 1.2em;
    font-weight: bold;
    color: #374151;
  }
  .section-title.large {
    font-size: 1.25em;
    font-weight: 600;
  }
  .section-actions {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 0.2em;
  }
  .section-actions button,
  .lesson-actions button {
    margin-left: 0.5em;
    background: #2563eb;
    color: #fff;
    border: none;
    border-radius: 4px;
    padding: 0.3em 0.8em;
    font-size: 0.95em;
    cursor: pointer;
    transition: background 0.15s;
  }
  .section-actions button:hover,
  .lesson-actions button:hover {
    background: #1d4ed8;
  }
  .lesson-list {
    margin-top: 0.7em;
    padding-left: 1.2em;
  }
  .lesson-item {
    background: #fff;
    border-radius: 6px;
    padding: 0.7em 1em;
    margin-bottom: 0.5em;
    box-shadow: 0 1px 4px 0 rgba(0,0,0,0.04);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .lesson-title {
    font-weight: 500;
    color: #1e293b;
  }
  .lesson-content {
    color: #64748b;
    margin-left: 1em;
    font-size: 0.98em;
  }
  .input-row {
    display: flex;
    gap: 0.7em;
    margin-bottom: 0.7em;
    align-items: center;
  }
  input[type="text"], input[type="search"] {
    padding: 0.4em 0.7em;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    font-size: 1em;
    background: #fff;
    color: #1e293b;
    outline: none;
    transition: border 0.15s;
  }
  input[type="text"]:focus, input[type="search"]:focus {
    border: 1.5px solid #2563eb;
  }
  .feedback {
    margin: 0.7em 0 0.5em 0;
    color: #059669;
    font-weight: 500;
  }
  .error {
    color: #dc2626;
    font-weight: 500;
    margin-left: 0.5em;
  }
  .loading {
    color: #2563eb;
    font-style: italic;
    margin: 1em 0;
  }
  .edit-icon {
    font-size: 1.5em;
    color: #64748b; /* Skeleton 默认灰色 */
    cursor: pointer;
    user-select: none;
    margin-left: 0;
    transition: color 0.15s, background 0.15s;
    border-radius: 50%;
    width: 1.8em;
    height: 1.8em;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .edit-icon:hover, .edit-icon:focus {
    color: #2563eb; /* Skeleton 主色 */
    background: #e0f2f1;
    outline: none;
  }
  .delete-icon {
    font-size: 1.5em;
    color: #64748b; /* Skeleton 默认灰色 */
    cursor: pointer;
    user-select: none;
    margin-left: 0;
    transition: color 0.15s, background 0.15s;
    border-radius: 50%;
    width: 1.8em;
    height: 1.8em;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .delete-icon:hover, .delete-icon:focus {
    color: #dc2626; /* Skeleton 红色 */
    background: #fde8e8;
    outline: none;
  }
  .add-lesson-icon {
    font-size: 1.5em;
    color: #10b981; /* Skeleton 绿色 */
    cursor: pointer;
    user-select: none;
    transition: color 0.15s, background 0.15s;
    border-radius: 50%;
    width: 1.8em;
    height: 1.8em;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: 0;
  }
  .add-lesson-icon:hover, .add-lesson-icon:focus {
    color: #059669;
    background: #e0f2f1;
    outline: none;
  }
</style>
