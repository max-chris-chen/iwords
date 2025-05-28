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

<h1>My Courses</h1>
<button on:click={goToAdd}>Add Course</button>
{#if loading}
  <p>Loading...</p>
{:else if error}
  <div style="color:red">{error}</div>
{:else if courses.length === 0}
  <p>No courses found.</p>
{:else}
  <table class="course-list">
    <thead>
      <tr>
        <th>Title</th>
        <th>Description</th>
        <th>Status</th>
        <th>Created At</th>
      </tr>
    </thead>
    <tbody>
      {#each courses as course}
        <tr>
          <td><a href={`/courses/${course._id}`}>{course.title}</a></td>
          <td>{course.description}</td>
          <td>{course.status}</td>
          <td>{new Date(course.createdAt).toLocaleString()}</td>
        </tr>
      {/each}
    </tbody>
  </table>
{/if}

<style>
  .course-list {
    margin: 20px auto;
    border-collapse: collapse;
    min-width: 600px;
  }
  .course-list th,
  .course-list td {
    border: 1px solid #ccc;
    padding: 8px 12px;
    text-align: left;
  }
  .course-list th {
    background: #f5f5f5;
  }
</style>
