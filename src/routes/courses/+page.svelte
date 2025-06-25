<script lang="ts">
  import { stopPropagation } from "svelte/legacy";

  import { goto } from "$app/navigation";
  import CourseFormModal from "$lib/modals/CourseFormModal.svelte";
  import { onMount } from "svelte";
  import type { Course } from "$lib/models/course";

  let courses = $state<Course[]>([]);
  let loading = $state(true);
  let error = $state("");

  let showModal = $state(false);
  let modalLoading = $state(false);
  let modalError = $state("");
  let editMode = $state(false);
  let editCourseData = $state<Course | null>(null);

  onMount(async () => {
    loading = true;
    error = "";
    try {
      const res = await fetch("/api/courses/my");
      if (!res.ok) throw new Error(await res.text());
      courses = await res.json();
    } catch (e: unknown) {
      const err = e as Error;
      error = err.message || "Failed to load courses";
    } finally {
      loading = false;
    }
  });

  function openAddModal() {
    showModal = true;
    editMode = false;
    editCourseData = null;
    modalError = "";
  }

  function openEditModal(course: Course) {
    showModal = true;
    editMode = true;
    editCourseData = { ...course };
    modalError = "";
  }

  async function handleSaveCourse(event: CustomEvent) {
    const { title, description, isPublic, status } = event.detail;
    modalLoading = true;
    modalError = "";

    const url = editMode
      ? `/api/courses/${editCourseData?._id}`
      : "/api/courses/create";
    const method = editMode ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, isPublic, status }),
      });
      if (!res.ok) throw new Error(await res.text());
      const savedCourse = await res.json();

      if (editMode) {
        const index = courses.findIndex((c) => c._id === editCourseData?._id);
        if (index !== -1) {
          courses[index] = { ...courses[index], ...savedCourse };
        }
      } else {
        courses.unshift(savedCourse);
      }

      showModal = false;
    } catch (e: unknown) {
      const err = e as Error;
      modalError = err.message || "Failed to save course";
    } finally {
      modalLoading = false;
    }
  }
</script>

<div class="main-content">
  <div class="content-header">
    <div class="header-left">
      <h1>我的课程</h1>
      <p>管理和学习您的所有课程</p>
    </div>
    <div class="header-right">
      <button class="btn-primary" onclick={openAddModal}>
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 4v16m8-8H4"
          ></path>
        </svg>
        创建课程
      </button>
    </div>
  </div>

  <div class="filters">
    <div class="filter-group">
      <select class="filter-select">
        <option value="all">全部状态</option>
        <option value="published">已发布</option>
        <option value="draft">草稿</option>
      </select>

      <select class="filter-select">
        <option value="all">全部类型</option>
        <option value="public">公开课程</option>
        <option value="private">私人课程</option>
      </select>
    </div>

    <div class="search-box">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        ></path>
      </svg>
      <input type="text" placeholder="搜索课程..." />
    </div>
  </div>

  {#if loading}
    <p>加载中...</p>
  {:else if error}
    <div style="color:red">{error}</div>
  {:else if courses.length === 0}
    <p>没有找到课程。</p>
  {:else}
    <div class="courses-grid">
      {#each courses as course (course._id)}
        <div
          class="my-course-card"
          role="link"
          tabindex="0"
          onclick={() => goto(`/courses/${course._id}`)}
          onkeydown={(e) => e.key === 'Enter' && goto(`/courses/${course._id}`)}
        >
          <div class="course-content">
            <div class="course-header">
              <h3>{course.title}</h3>
              <div class="course-header-right">
                <div class="course-badges">
                  <span
                    class="status-badge"
                    class:published={course.status === "published"}
                    class:draft={course.status !== "published"}
                  >
                    {course.status === "published" ? "已发布" : "草稿"}
                  </span>
                  <span
                    class="visibility-badge"
                    class:public={course.isPublic}
                    class:private={!course.isPublic}
                  >
                    {course.isPublic ? "公开" : "私人"}
                  </span>
                </div>
              </div>
            </div>

            <p class="course-description">{course.description}</p>

            <div class="course-stats">
              <div class="stat-item">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  ><path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  ></path></svg
                >
                <span>{course.studentCount || 0} 学员</span>
              </div>
              <div class="stat-item">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  ><path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path></svg
                >
                <span>{course.lessonCount || 0} 课时</span>
              </div>
            </div>

            <div class="course-footer">
              <span class="create-date"
                >创建于 {new Date(course.createdAt).toLocaleDateString()}</span
              >
              <div class="course-actions-bottom">
                <button
                  class="btn-primary"
                  onclick={stopPropagation(() => openEditModal(course))}
                  >编辑</button
                >
              </div>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}

  <div class="pagination">
    <button class="page-btn" disabled aria-label="上一页">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"
        ><path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M15 19l-7-7 7-7"
        ></path></svg
      >
    </button>
    <button class="page-btn active">1</button>
    <button class="page-btn">2</button>
    <button class="page-btn">3</button>
    <span class="page-dots">...</span>
    <button class="page-btn">10</button>
    <button class="page-btn" aria-label="下一页">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"
        ><path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9 5l7 7-7 7"
        ></path></svg
      >
    </button>
  </div>
</div>

<CourseFormModal
  bind:open={showModal}
  loading={modalLoading}
  error={modalError}
  {editMode}
  course={editCourseData}
  on:save={handleSaveCourse}
/>

<style>
  .main-content {
    padding: 2rem;
    background-color: #f9fafb;
    min-height: 100vh;
  }

  .content-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }

  .header-left h1 {
    font-size: 2rem;
    font-weight: 700;
    color: #111827;
    margin: 0;
  }

  .header-left p {
    margin-top: 0.5rem;
    color: #6b7280;
    font-size: 1rem;
  }

  .btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background-color: #2563eb;
    color: white;
    font-weight: 600;
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    border: none;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  .btn-primary:hover {
    background-color: #1d4ed8;
  }
  .btn-primary svg {
    width: 1.25rem;
    height: 1.25rem;
  }


  .filters {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .filter-group {
    display: flex;
    gap: 1rem;
  }

  .filter-select {
    padding: 0.5rem 2rem 0.5rem 1rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    background-color: white;
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
    background-position: right 0.5rem center;
    background-repeat: no-repeat;
    background-size: 1.5em 1.5em;
  }

  .search-box {
    position: relative;
  }
  .search-box input {
    padding-left: 2.5rem;
    height: 2.5rem;
    width: 250px;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
  }
  .search-box svg {
    position: absolute;
    left: 0.75rem;
    top: 0.75rem;
    width: 1.25rem;
    height: 1.25rem;
    color: #9ca3af;
  }

  .courses-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 2rem;
  }

  .my-course-card {
    background-color: white;
    border-radius: 0.75rem;
    box-shadow:
      0 4px 6px -1px rgba(0, 0, 0, 0.1),
      0 2px 4px -1px rgba(0, 0, 0, 0.06);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    transition: box-shadow 0.2s ease-in-out;
    cursor: pointer;
  }
  .my-course-card:hover {
    box-shadow:
      0 10px 15px -3px rgba(0, 0, 0, 0.1),
      0 4px 6px -2px rgba(0, 0, 0, 0.05);
  }

  .course-content {
    padding: 1.25rem;
    flex-grow: 1;
    display: flex;
    flex-direction: column;
  }
  .course-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
  }
  .course-header h3 {
    font-size: 1.125rem;
    font-weight: 600;
    color: #1f2937;
    flex-grow: 1;
    margin-right: 0.5rem;
  }
  .course-header-right {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  .course-badges {
    display: flex;
    gap: 0.5rem;
    flex-shrink: 0;
  }
  .status-badge,
  .visibility-badge {
    font-size: 0.75rem;
    font-weight: 500;
    padding: 0.25rem 0.625rem;
    border-radius: 9999px;
    text-transform: capitalize;
  }
  .status-badge.published,
  .visibility-badge.public {
    background-color: #d1fae5;
    color: #065f46;
  }
  .status-badge.draft,
  .visibility-badge.private {
    background-color: #e5e7eb;
    color: #4b5563;
  }

  .course-description {
    color: #4b5563;
    font-size: 0.875rem;
    line-height: 1.5;
    margin-bottom: 1rem;
    min-height: 42px; /* 3 lines */
  }

  .course-stats {
    display: flex;
    gap: 1.5rem;
    color: #6b7280;
    font-size: 0.875rem;
    margin-bottom: 1rem;
    border-top: 1px solid #f3f4f6;
    padding-top: 1rem;
  }
  .stat-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .stat-item svg {
    width: 1rem;
    height: 1rem;
  }

  .course-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: auto;
  }
  .create-date {
    font-size: 0.875rem;
    color: #9ca3af;
  }
  .course-actions-bottom {
    display: flex;
    gap: 0.75rem;
  }

  .pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 2rem;
    gap: 0.5rem;
  }
  .page-btn {
    background: white;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    padding: 0.5rem;
    min-width: 2.25rem;
    height: 2.25rem;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
  }
  .page-btn:hover:not(:disabled) {
    background: #f9fafb;
  }
  .page-btn.active {
    background: #2563eb;
    color: white;
    border-color: #2563eb;
  }
  .page-btn:disabled {
    color: #d1d5db;
    cursor: not-allowed;
  }
  .page-dots {
    color: #9ca3af;
    padding: 0 0.5rem;
  }
</style>
