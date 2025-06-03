<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';

  let lesson = null;
  let loading = true;
  let err = '';
  let playingIdx = -1;
  let audio: HTMLAudioElement | null = null;

  onMount(async () => {
    loading = true;
    err = '';
    const { id, sectionId, lessonId } = $page.params;
    try {
      const res = await fetch(`/api/courses/${id}/sections/${sectionId}/lessons/${lessonId}`);
      if (!res.ok) throw new Error(await res.text());
      lesson = await res.json();
      // 初始化每个句子的 _currentWordIdx
      if (lesson?.sentences?.length) {
        for (const s of lesson.sentences) {
          s._currentWordIdx = -1;
        }
      }
    } catch (e) {
      err = e.message || '加载失败';
    } finally {
      loading = false;
    }
  });

  function updateLessonSentences() {
    lesson = { ...lesson, sentences: [...lesson.sentences] };
  }

  function playSentence(idx: number) {
    if (!lesson?.sentences?.[idx]?.audioUrl) return;
    if (audio) {
      audio.pause();
      audio = null;
    }
    playingIdx = idx;
    const s = lesson.sentences[idx];
    // 兼容 caption.chunks 结构
    if (s.caption && Array.isArray(s.caption.chunks)) {
      s._currentWordIdx = -1;
    }
    lesson.sentences.forEach(x => x._currentWordIdx = -1);
    updateLessonSentences();
    audio = new Audio(s.audioUrl);
    audio.play();
    if (s.caption && Array.isArray(s.caption.chunks)) {
      audio.ontimeupdate = () => {
        const t = audio!.currentTime * 1000;
        let wordIdx = s.caption.chunks.findIndex(
          (w) => t >= w.start_time && t < w.end_time
        );
        if (wordIdx !== -1 && wordIdx !== s._currentWordIdx) {
          s._currentWordIdx = wordIdx;
          updateLessonSentences();
        }
      };
      audio.onended = () => {
        playingIdx = -1;
        s._currentWordIdx = -1;
        updateLessonSentences();
      };
    } else {
      audio.onended = () => {
        playingIdx = -1;
      };
    }
  }
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
      {#each lesson.sentences as s, i}
        <li class="border rounded p-3 flex flex-col gap-2">
                      <div style="margin-top:0.5em;font-size:1.1em">
              {#if s.caption && Array.isArray(s.caption.chunks)}
                {#each s.caption.chunks as w, wi}
                  <span class="word {s._currentWordIdx === wi ? 'active' : ''}">{s.text.slice(w.start, w.end)}</span>
                {/each}
              {:else}
                {s.text}
              {/if}
            </div>
          {#if s.audioUrl}
            <button on:click={() => playSentence(i)} disabled={playingIdx === i}>
              {playingIdx === i ? '播放中...' : '播放'}
            </button>

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
  .word {
    transition: background 0.2s;
    padding: 0 2px;
  }
  .word.active {
    background: yellow;
  }
</style>
