<script lang="ts">
  import { goto } from '$app/navigation';
  import CourseModal from '$lib/modals/CourseModal.svelte';
  import { onMount } from "svelte";

  let courses = [];
  let loading = true;
  let error = "";

  let showAddModal = false;
  let addLoading = false;
  let addError = "";
  let titleInput = "";
  let coverImage = "";
  let description = "";
  let isPublic = false;

  let showEditModal = false;
  let editCourseData = null;
  let editLoading = false;
  let editError = "";

  onMount(async () => {
    loading = true;
    error = "";
    try {
      const res = await fetch("/api/courses/my");
      if (!res.ok) throw new Error(await res.text());
      courses = await res.json();
    } catch (e) {
      error = e.message || "Failed to load courses";
    } finally {
      loading = false;
    }
  });

  function goToAdd() {
    showAddModal = true;
  }

  async function addCourse() {
    addLoading = true;
    addError = "";
    try {
      const res = await fetch("/api/courses/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: titleInput,
          coverImage,
          description,
          isPublic,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      // Refresh course list
      const res2 = await fetch("/api/courses/my");
      courses = await res2.json();
      showAddModal = false;
      // Reset form
      titleInput = coverImage = description = "";
      isPublic = false;
    } catch (e) {
      addError = e.message || "Failed to add course";
    } finally {
      addLoading = false;
    }
  }

  function editCourse(course) {
    editCourseData = { ...course };
    showEditModal = true;
  }

  function closeEditModal() {
    showEditModal = false;
    editCourseData = null;
  }

  async function saveEditCourse() {
    if (!editCourseData) return;
    editLoading = true;
    editError = "";
    try {
      const res = await fetch(`/api/courses/${editCourseData._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editCourseData.title,
          coverImage: editCourseData.coverImage,
          description: editCourseData.description,
          isPublic: editCourseData.isPublic,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      // 刷新课程列表
      const res2 = await fetch("/api/courses/my");
      courses = await res2.json();
      showEditModal = false;
      editCourseData = null;
    } catch (e) {
      editError = e.message || "Failed to update course";
    } finally {
      editLoading = false;
    }
  }
</script>

<h1 class="text-3xl font-extrabold text-center mb-8 mt-8 tracking-tight text-primary-700">
  My Courses
</h1>
<div class="flex justify-end mb-8">
  <button
    on:click={goToAdd}
    class="add-course-btn flex items-center gap-2 px-6 py-2 font-semibold rounded-lg border border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
  >
    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
    </svg>
    Add Course
  </button>
</div>

{#if loading}
  <p>Loading...</p>
{:else if error}
  <div style="color:red">{error}</div>
{:else if courses.length === 0}
  <p>No courses found.</p>
{:else}
  <div class="course-grid">
    {#each courses as course}
      <div class="course-card bg-surface-1 rounded-xl shadow p-0 flex flex-col transition-shadow hover:shadow-lg overflow-hidden border border-gray-200 relative cursor-pointer"
        on:click={() => goto(`/courses/${course._id}`)}
      >
        <button
          class="absolute top-2 right-2 p-1 rounded-full bg-white shadow hover:bg-blue-100 text-gray-500 hover:text-blue-600 transition-colors"
          title="编辑课程"
          on:click|stopPropagation={() => editCourse(course)}
          style="z-index:2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-2.828 0L9 13zm-6 6h6" />
          </svg>
        </button>
        {#if course.coverImage}
          <img
            src={course.coverImage}
            alt="cover"
            class="w-full h-40 object-cover"
          />
        {:else}
          <div class="w-full h-40 flex items-center justify-center bg-gray-100 text-gray-400 text-5xl">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 48 48"
              stroke="currentColor"
              class="w-16 h-16"
            >
              <rect x="8" y="12" width="32" height="24" rx="4" fill="#e5e7eb" />
              <path d="M8 36l8-10 7 9 5-6 10 7" stroke="#cbd5e1" stroke-width="2" fill="none" />
              <circle cx="16" cy="20" r="2" fill="#cbd5e1" />
            </svg>
          </div>
        {/if}
        <div class="flex-1 flex flex-col p-5 gap-2">
          <a
            href={`/courses/${course._id}`}
            class="text-xl font-bold hover:underline text-primary-700 truncate"
            >{course.title}</a
          >
          <div class="text-gray-600 line-clamp-2 min-h-[2.5em]">{course.description}</div>
          <div class="flex justify-between items-center text-sm mt-auto pt-2">
            <span class="badge badge-info px-3 py-1 rounded-full text-xs font-semibold bg-primary-100 text-primary-700 border border-primary-200">
              {course.status}
            </span>
            <span class="text-gray-400">
              {new Date(course.createdAt).toLocaleDateString()}<span class="hidden sm:inline"> {new Date(course.createdAt).toLocaleTimeString()}</span>
            </span>
          </div>
        </div>
      </div>
    {/each}
  </div>
{/if}

<CourseModal open={showAddModal} title="Add Course" on:close={() => showAddModal = false}>
  <form class="space-y-6" on:submit|preventDefault={addCourse}>
    <div>
      <label for="titleInput" class="block mb-1 font-semibold text-gray-700">Title<span class="text-red-500">*</span></label>
      <input id="titleInput" bind:value={titleInput} required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 focus:outline-none" />
    </div>
    <div>
      <label for="coverImage" class="block mb-1 font-semibold text-gray-700">Cover Image URL</label>
      <input id="coverImage" bind:value={coverImage} class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 focus:outline-none" />
    </div>
    <div>
      <label for="description" class="block mb-1 font-semibold text-gray-700">Description</label>
      <textarea id="description" bind:value={description} class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 focus:outline-none min-h-[120px]" />
    </div>
    <div class="flex items-center gap-2">
      <input id="isPublic" type="checkbox" bind:checked={isPublic} class="accent-blue-600 w-5 h-5" />
      <label for="isPublic" class="font-semibold text-gray-700">Public</label>
    </div>
    {#if addError}
      <div class="text-red-600 text-center font-medium">{addError}</div>
    {/if}
    <button
      type="submit"
      disabled={addLoading}
      class="add-course-btn flex items-center gap-2 px-6 py-2 font-semibold rounded-lg border border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 w-full justify-center mt-4"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
      {addLoading ? "Saving..." : "Add Course"}
    </button>
  </form>
</CourseModal>

{#if showEditModal && editCourseData}
  <CourseModal open={showEditModal} title="Edit Course" on:close={closeEditModal}>
    <form class="space-y-6" on:submit|preventDefault={saveEditCourse}>
      <div>
        <label class="block mb-1 font-semibold text-gray-700">Title<span class="text-red-500">*</span></label>
        <input class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 focus:outline-none" bind:value={editCourseData.title} required />
      </div>
      <div>
        <label class="block mb-1 font-semibold text-gray-700">Cover Image URL</label>
        <input class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 focus:outline-none" bind:value={editCourseData.coverImage} />
      </div>
      <div>
        <label class="block mb-1 font-semibold text-gray-700">Description</label>
        <textarea class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 focus:outline-none min-h-[120px]" bind:value={editCourseData.description} />
      </div>
      <div class="flex items-center gap-2">
        <input type="checkbox" bind:checked={editCourseData.isPublic} class="accent-blue-600 w-5 h-5" />
        <label class="font-semibold text-gray-700">Public</label>
      </div>
      {#if editError}
        <div class="text-red-600 text-center font-medium">{editError}</div>
      {/if}
      <button type="submit" disabled={editLoading} class="add-course-btn flex items-center gap-2 px-6 py-2 font-semibold rounded-lg border border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 w-full justify-center mt-4">
        {editLoading ? "Saving..." : "保存"}
      </button>
    </form>
  </CourseModal>
{/if}

<style>
  .course-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
    margin: 2rem 0;
  }
  .add-course-btn {
    background: linear-gradient(90deg, #2563eb 0%, #1d4ed8 100%) !important;
    color: #fff !important;
    opacity: 1 !important;
    box-shadow: 0 2px 8px 0 rgba(37, 99, 235, 0.1);
    border: 1px solid #2563eb;
  }
  .add-course-btn:hover {
    background: linear-gradient(90deg, #1d4ed8 0%, #2563eb 100%) !important;
  }
</style>
