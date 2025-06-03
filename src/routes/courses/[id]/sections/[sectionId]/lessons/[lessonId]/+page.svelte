<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';

  let lesson = null;
  let loading = true;
  let err = '';
  let playingIdx = -1;
  let audio: HTMLAudioElement | null = null;
  let playbackRate = 1.0;

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
    audio.playbackRate = playbackRate;
    audio.play();
    if (s.caption && Array.isArray(s.caption.chunks)) {
      audio.ontimeupdate = () => {
        const t = audio!.currentTime * 1000;
        // 优化：只在时间进入新chunk区间时才更新，避免遍历所有chunk
        const prevIdx = s._currentWordIdx;
        let wordIdx = prevIdx;
        if (prevIdx === -1 || t < s.caption.chunks[prevIdx].start_time || t >= s.caption.chunks[prevIdx].end_time) {
          // 只在区间外时查找
          wordIdx = s.caption.chunks.findIndex(
            (w) => t >= w.start_time && t < w.end_time
          );
        }
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
  <div style="margin-bottom:1em">
    <label for="playbackRate">播放速度：</label>
    <select id="playbackRate" bind:value={playbackRate}>
      <option value="0.75">0.75x</option>
      <option value="1">1x</option>
      <option value="1.25">1.25x</option>
      <option value="1.5">1.5x</option>
      <option value="2">2x</option>
    </select>
  </div>
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
    background: #ffe082;
    border-radius: 6px;
    box-shadow: 0 1px 4px 0 rgba(67,198,172,0.10);
  }
</style>
