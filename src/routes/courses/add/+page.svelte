<script lang="ts">
  import { goto } from "$app/navigation";

  let title = "";
  let coverImage = "";
  let description = "";
  let isPublic = false;
  let error = "";
  let loading = false;

  async function addCourse() {
    loading = true;
    error = "";
    try {
      const res = await fetch("/api/courses/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          coverImage,
          description,
          isPublic,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      goto("/courses");
    } catch (e) {
      error = e.message || "Failed to add course";
    } finally {
      loading = false;
    }
  }
</script>

<h1>Add Course</h1>
<form class="course-form" on:submit|preventDefault={addCourse}>
  <table>
    <tbody>
      <tr>
        <td><label for="title">Title</label></td>
        <td><input id="title" bind:value={title} required /></td>
      </tr>
      <tr>
        <td><label for="coverImage">Cover Image URL</label></td>
        <td><input id="coverImage" bind:value={coverImage} /></td>
      </tr>
      <tr>
        <td><label for="description">Description</label></td>
        <td><textarea id="description" bind:value={description}></textarea></td>
      </tr>
      <tr>
        <td><label for="isPublic">Public</label></td>
        <td><input id="isPublic" type="checkbox" bind:checked={isPublic} /></td>
      </tr>
      <tr>
        <td colspan="2" style="text-align:center; padding-top:10px;">
          <button type="submit" disabled={loading}
            >{loading ? "Saving..." : "Add Course"}</button
          >
        </td>
      </tr>
      {#if error}
        <tr><td colspan="2"><div style="color:red">{error}</div></td></tr>
      {/if}
    </tbody>
  </table>
</form>

<style>
  .course-form table {
    margin: 0 auto;
    border-collapse: separate;
    border-spacing: 10px 8px;
  }
  .course-form td {
    vertical-align: middle;
    padding: 4px 8px;
  }
  .course-form input[type="text"],
  .course-form input[type="url"],
  .course-form textarea {
    width: 260px;
    padding: 4px;
    font-size: 1em;
  }
  .course-form textarea {
    resize: vertical;
    min-height: 180px;
    height: 180px;
    width: 400px;
    font-size: 1.1em;
  }
</style>
