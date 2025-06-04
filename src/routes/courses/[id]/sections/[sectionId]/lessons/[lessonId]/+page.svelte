<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';

  let lesson = null;
  let loading = true;
  let err = '';
  let playingIdx = -1;
  let audio: HTMLAudioElement | null = null;
  let playbackRate = '1.0';

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
    audio.playbackRate = +playbackRate;
    
    // 用于取消预设的单词高亮定时器
    let highlightTimers: number[] = [];
    
    // 清理所有定时器
    function clearTimers() {
      highlightTimers.forEach(id => window.clearTimeout(id));
      highlightTimers = [];
    }
    
    if (s.caption && Array.isArray(s.caption.chunks)) {
      // 预先安排所有单词的定时高亮
      function scheduleWordHighlights() {
        clearTimers();
        const currentTime = audio!.currentTime * 1000;
        s.caption.chunks.forEach((chunk, index) => {
          const startTime = chunk.start_time;
          const timeUntilWord = startTime - currentTime;
          if (timeUntilWord > 50) {
            const timerId = window.setTimeout(() => {
              if (audio && !audio.paused && audio.currentTime * 1000 >= chunk.start_time) {
                s._currentWordIdx = index;
                updateLessonSentences();
              }
            }, timeUntilWord / +playbackRate);
            highlightTimers.push(timerId);
          }
        });
      }
      audio.onloadedmetadata = () => {
        s._currentWordIdx = -1;
        updateLessonSentences();
      };
      audio.ontimeupdate = () => {
        if (audio!.readyState < 2 || audio!.paused) return;
        const t = audio!.currentTime * 1000;
        // 只有在真正到达第一个chunk的start_time时才允许高亮
        if (t < s.caption.chunks[0].start_time) {
          if (s._currentWordIdx !== -1) {
            s._currentWordIdx = -1;
            updateLessonSentences();
          }
          return;
        }
        for (let i = 0; i < s.caption.chunks.length; i++) {
          const chunk = s.caption.chunks[i];
          if (t >= chunk.start_time && t < chunk.end_time) {
            if (s._currentWordIdx !== i) {
              s._currentWordIdx = i;
              updateLessonSentences();
              scheduleWordHighlights();
            }
            return;
          }
        }
        if (s._currentWordIdx !== -1) {
          const lastChunk = s.caption.chunks[s.caption.chunks.length - 1];
          if (t >= lastChunk.end_time) {
            s._currentWordIdx = -1;
            updateLessonSentences();
          }
        }
      };
      audio.onplay = () => {
        // 播放时强制重置高亮，防止未到第一个chunk时高亮
        s._currentWordIdx = -1;
        updateLessonSentences();
        scheduleWordHighlights();
      };
      audio.onended = () => {
        clearTimers();
        playingIdx = -1;
        s._currentWordIdx = -1;
        updateLessonSentences();
      };
      audio.onpause = clearTimers;
      audio.onratechange = scheduleWordHighlights;
    } else {
      audio.onended = () => {
        playingIdx = -1;
      };
    }
    // 确保在开始播放前正确设置初始状态
    s._currentWordIdx = -1;
    updateLessonSentences();
    audio.play().catch(e => {
      console.error('播放失败:', e);
      playingIdx = -1;
      updateLessonSentences();
    });
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
      <option value="1.0">1x</option>
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
