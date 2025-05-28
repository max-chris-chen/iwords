<script lang="ts">
  import { page } from "$app/stores";
  import { onMount } from "svelte";
  import { get } from "svelte/store";

  let course: any = null;
  let loading = true;
  let error = "";

  onMount(async () => {
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
  });
</script>

{#if loading}
  <p>Loading...</p>
{:else if error}
  <div style="color:red">{error}</div>
{:else if course}
  <h1><a href={location.pathname}>{course.title}</a></h1>
  <p>{course.description}</p>
  <h2>Sections</h2>
  {#if course.sections?.length}
    <ul>
      {#each course.sections as section}
        <li>
          <strong>{section.title}</strong>
          {#if section.lessons?.length}
            <ul>
              {#each section.lessons as lesson}
                <li>{lesson.title}</li>
              {/each}
            </ul>
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
</style>
