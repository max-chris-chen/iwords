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

<h1 class="text-3xl font-extrabold text-center mb-8 mt-8 tracking-tight text-primary-700">
  Add Course
</h1>
<div class="max-w-xl mx-auto bg-white rounded-2xl p-8">
  <form class="space-y-6" on:submit|preventDefault={addCourse}>
    <div>
      <label for="title" class="block mb-1 font-semibold text-gray-700">Title<span class="text-red-500">*</span></label>
      <input id="title" bind:value={title} required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 focus:outline-none" />
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
    {#if error}
      <div class="text-red-600 text-center font-medium">{error}</div>
    {/if}
    <button
      type="submit"
      disabled={loading}
      class="add-course-btn flex items-center gap-2 px-6 py-2 font-semibold rounded-lg border border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 w-full justify-center mt-4"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
      {loading ? "Saving..." : "Add Course"}
    </button>
  </form>
</div>

<style>
.add-course-btn {
  background: linear-gradient(90deg, #2563eb 0%, #1d4ed8 100%) !important;
  color: #fff !important;
  opacity: 1 !important;
  border: 1px solid #2563eb;
  transition: background 0.2s;
}
.add-course-btn:hover {
  background: linear-gradient(90deg, #1d4ed8 0%, #2563eb 100%) !important;
}
</style>
