<script lang="ts">
  import { page } from "$app/stores";
  import { onMount } from "svelte";
  import { get } from "svelte/store";

  let course: any = null;
  let loading = true;
  let error = "";

  // UI state for adding section
  let newSectionTitle = "";
  let addingSection = false;
  let sectionError = "";

  // UI state for adding lesson
  let addingLessonSectionId: string | null = null;
  let newLessonTitle = "";
  let newLessonContent = "";
  let lessonError = "";

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
    addingSection = false;
    await fetchCourse();
  }

  async function addLesson(sectionId: string) {
    lessonError = "";
    if (!newLessonTitle.trim()) {
      lessonError = "Lesson title required";
      return;
    }
    const id = get(page).params.id;
    const res = await fetch(`/api/courses/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lesson: { title: newLessonTitle, content: newLessonContent },
        sectionId,
      }),
    });
    if (!res.ok) {
      lessonError = await res.text();
      return;
    }
    newLessonTitle = "";
    newLessonContent = "";
    addingLessonSectionId = null;
    await fetchCourse();
  }
</script>

{#if loading}
  <p>Loading...</p>
{:else if error}
  <div style="color:red">{error}</div>
{:else if course}
  <h1><a href={location.pathname}>{course.title}</a></h1>
  <p>{course.description}</p>
  <h2>Sections</h2>
  <button on:click={() => (addingSection = !addingSection)}>
    {addingSection ? "Cancel" : "Add Section"}
  </button>
  {#if addingSection}
    <div style="margin:1em 0;">
      <input placeholder="Section title" bind:value={newSectionTitle} />
      <button on:click={addSection}>Save</button>
      {#if sectionError}
        <span style="color:red">{sectionError}</span>
      {/if}
    </div>
  {/if}
  {#if course.sections?.length}
    <ul>
      {#each course.sections as section}
        <li>
          <strong>{section.title}</strong>
          <button
            on:click={() => (addingLessonSectionId = section._id)}
            style="margin-left:1em;">Add Lesson</button
          >
          {#if addingLessonSectionId === section._id}
            <div style="margin:0.5em 0;">
              <input placeholder="Lesson title" bind:value={newLessonTitle} />
              <input
                placeholder="Lesson content"
                bind:value={newLessonContent}
              />
              <button on:click={() => addLesson(section._id)}>Save</button>
              <button
                on:click={() => {
                  addingLessonSectionId = null;
                  newLessonTitle = "";
                  newLessonContent = "";
                }}>Cancel</button
              >
              {#if lessonError}
                <span style="color:red">{lessonError}</span>
              {/if}
            </div>
          {/if}
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
