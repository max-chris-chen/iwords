<script lang="ts">
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";

  let courses = [];
  let loading = true;
  let error = "";

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
    goto("/courses/add");
  }
</script>

<h1 class="text-3xl font-extrabold text-center mb-8 mt-8 tracking-tight text-primary-700">
  My Courses
</h1>
<div class="flex justify-end mb-8">
  <button
    on:click={goToAdd}
    class="add-course-btn flex items-center gap-2 px-6 py-2 font-semibold rounded-lg shadow border border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
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
      <div class="course-card bg-surface-1 rounded-xl shadow p-0 flex flex-col transition-shadow hover:shadow-lg overflow-hidden border border-gray-200">
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
