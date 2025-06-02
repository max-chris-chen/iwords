<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { error } from '@sveltejs/kit';

  let lesson = null;
  let loading = true;
  let err = '';

  onMount(async () => {
    loading = true;
    err = '';
    const { id, sectionId, lessonId } = $page.params;
    try {
      const res = await fetch(`/api/courses/${id}/sections/${sectionId}/lessons/${lessonId}`);
      if (!res.ok) throw new Error(await res.text());
      lesson = await res.json();
    } catch (e) {
      err = e.message || '加载失败';
    } finally {
      loading = false;
    }
  });
</script>

{#if loading}
  <p>加载中...</p>
{:else if err}
  <div style="color:red">{err}</div>
{:else if lesson}
  <h1 class="text-2xl font-bold mb-4">{lesson.title}</h1>
  <div class="mb-4 text-gray-700">{lesson.content}</div>
  {#if lesson.sentences?.length}
    <ul class="space-y-2">
      {#each lesson.sentences as s}
        <li class="border rounded p-3 flex flex-col gap-2">
          <div>{s.text}</div>
          {#if s.audioUrl}
            <audio controls src={s.audioUrl}></audio>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
{/if}

<style>
  h1 {
    margin-bottom: 0.7em;
  }
</style>
