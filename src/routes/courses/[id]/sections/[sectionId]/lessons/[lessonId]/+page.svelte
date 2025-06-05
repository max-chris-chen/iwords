<script lang="ts">
  import { page } from '$app/stores';
  import { onMount, tick } from 'svelte';

  let lesson = null;
  let loading = true;
  let err = '';
  let playingIdx = -1;
  let audio: HTMLAudioElement | null = null;
  let playbackRate = '1.0';
  let mode: 'listen' | 'read' | 'dictation' = 'listen';
  // 保证dictationInputs始终为string[][]类型
  let dictationInputs: string[][] = [];
  let dictationResults: (boolean | null)[] = [];
  let isPlayingAll = false;
  let dictationInputRefs: Array<Array<HTMLInputElement>> = [];

  // Converted to a Svelte action that properly handles element references
  function dictationInputBind(node: HTMLInputElement, params: [number, number]) {
    const [si, wi] = params;
    if (!dictationInputRefs[si]) dictationInputRefs[si] = [];
    dictationInputRefs[si][wi] = node;
    
    return {
      destroy() {
        // Clean up when the element is removed
        if (dictationInputRefs[si]) {
          dictationInputRefs[si][wi] = null;
        }
      }
    };
  }

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
    // 只在非dictation模式下才整体替换，避免input重建导致焦点丢失
    if (mode !== 'dictation') {
      lesson = { ...lesson, sentences: [...lesson.sentences] };
    }
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
        if (isPlayingAll) {
          // 顺序播放时不重置playingIdx，由playSentenceSequentially处理
          return;
        }
        playingIdx = -1;
        s._currentWordIdx = -1;
        updateLessonSentences();
      };
      audio.onpause = clearTimers;
      audio.onratechange = scheduleWordHighlights;
    } else {
      audio.onended = () => {
        if (isPlayingAll) {
          // 顺序播放时不重置playingIdx，由playSentenceSequentially处理
          return;
        }
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

  function setMode(newMode: typeof mode) {
    mode = newMode;
    if (mode === 'dictation' && lesson?.sentences?.length) {
      // Initialize input arrays
      dictationInputs = lesson.sentences.map(s =>
        s.caption && Array.isArray(s.caption.chunks)
          ? Array(s.caption.chunks.length).fill('')
          : ['']
      );
      
      // Reset the results array
      dictationResults = Array(lesson.sentences.length).fill(null);
      
      // Clear and initialize refs array for each sentence
      dictationInputRefs = lesson.sentences.map(s => 
        s.caption && Array.isArray(s.caption.chunks)
          ? Array(s.caption.chunks.length).fill(null)
          : [null]
      );
    }
  }

  function stripPunct(str: string) {
    return str.replace(/[\p{P}\p{S}]/gu, '');
  }

  function checkDictation(idx: number) {
    if (!lesson?.sentences?.[idx]) return;
    const s = lesson.sentences[idx];
    if (s.caption && Array.isArray(s.caption.chunks)) {
      const answerWords = s.caption.chunks.map(w => s.text.slice(w.start, w.end));
      const inputWords = dictationInputs[idx] as string[];
      dictationResults[idx] = inputWords.every((w, i) =>
        stripPunct(w.trim().toLowerCase()) === stripPunct(answerWords[i].toLowerCase())
      );
    } else {
      const answer = s.text.trim();
      const input = dictationInputs[idx] as string;
      dictationResults[idx] = stripPunct(input.trim().toLowerCase()) === stripPunct(answer.toLowerCase());
    }
  }

  function playAllSentences() {
    if (!lesson?.sentences?.length) return;
    isPlayingAll = true;
    playSentenceSequentially(0);
  }

  function pauseAll() {
    isPlayingAll = false;
    if (audio) {
      audio.pause();
    }
  }

  function resumeAll() {
    if (!isPlayingAll && playingIdx !== -1 && audio && audio.paused) {
      isPlayingAll = true;
      audio.play();
      // 重新绑定顺序播放逻辑
      audio.onended = () => {
        if (isPlayingAll) {
          if (playingIdx + 1 < lesson.sentences.length) {
            playSentenceSequentially(playingIdx + 1);
          } else {
            isPlayingAll = false;
            playingIdx = -1;
            updateLessonSentences();
          }
        }
      };
    }
  }

  function playSentenceSequentially(idx: number) {
    if (!isPlayingAll || !lesson?.sentences?.[idx]?.audioUrl) {
      isPlayingAll = false;
      playingIdx = -1;
      updateLessonSentences();
      return;
    }
    playSentence(idx);
    if (audio) {
      audio.onended = () => {
        if (isPlayingAll) {
          if (idx + 1 < lesson.sentences.length) {
            playSentenceSequentially(idx + 1);
          } else {
            isPlayingAll = false;
            playingIdx = -1;
            updateLessonSentences();
          }
        }
      };
    }
  }

  // 监听mode和lesson切换后自动聚焦第一个输入框
  $: if (mode === 'dictation' && lesson?.sentences?.length) {
    tick().then(() => {
      if (dictationInputRefs[0]?.[0]) {
        dictationInputRefs[0][0].focus();
      }
    });
  }

  function handleDictInputKeydown(e: KeyboardEvent, si: number, wi: number) {
    if (e.key === ' ') {
      e.preventDefault();
      // 跳到下一个输入框并清空内容
      const next = dictationInputRefs[si]?.[wi + 1];
      if (next) {
        dictationInputs[si][wi + 1] = '';
        next.value = '';
        next.focus();
      }
    } else if (e.key === 'Backspace') {
      // 如果当前input已空，跳到上一个input并将光标移到末尾
      const currInput = dictationInputRefs[si]?.[wi];
      if (currInput && currInput.value === '' && wi > 0) {
        e.preventDefault();
        const prev = dictationInputRefs[si][wi - 1];
        if (prev) {
          prev.focus();
          // 将光标移到末尾
          const len = prev.value.length;
          prev.setSelectionRange(len, len);
        }
      }
    } else if (e.key === 'Enter') {
      // 回车提交当前句子的答案
      e.preventDefault();
      checkDictation(si);
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
  <div style="margin-bottom:1em;display:flex;gap:1em">
    <button on:click={() => setMode('listen')} class:active={mode==='listen'}>听力</button>
    <button on:click={() => setMode('read')} class:active={mode==='read'}>跟读</button>
    <button on:click={() => setMode('dictation')} class:active={mode==='dictation'}>听写</button>
  </div>
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
  {#if mode === 'listen'}
    <div style="margin-bottom:1em">
      <button on:click={playAllSentences} disabled={isPlayingAll || playingIdx !== -1}>播放全部</button>
      <button on:click={pauseAll} disabled={!isPlayingAll && playingIdx === -1}>暂停</button>
      <button on:click={resumeAll} disabled={isPlayingAll || playingIdx === -1 || !audio || !audio.paused}>继续</button>
    </div>
  {/if}
  {#if lesson.sentences?.length}
    <ul class="space-y-2">
      {#each lesson.sentences as s, i}
        <li class="border rounded p-3 flex flex-col gap-2">
          <div style="margin-top:0.5em;font-size:1.1em">
            {#if mode === 'listen'}
              {#if s.caption && Array.isArray(s.caption.chunks)}
                {#if !s._showText}
                  {#each s.caption.chunks as w, wi}
                    <span class="word">{'*'.repeat(s.text.slice(w.start, w.end).length)}</span>
                  {/each}
                  <button class="eye-btn" on:click={() => { s._showText = true; updateLessonSentences(); }} title="显示原文">👁</button>
                {:else}
                  {#each s.caption.chunks as w, wi}
                    <span class="word">{s.text.slice(w.start, w.end)}</span>
                  {/each}
                  <button class="eye-btn" on:click={() => { s._showText = false; updateLessonSentences(); }} title="隐藏原文">🙈</button>
                {/if}
              {:else}
                {#if !s._showText}
                  {'*'.repeat(s.text.length)}
                  <button class="eye-btn" on:click={() => { s._showText = true; updateLessonSentences(); }} title="显示原文">👁</button>
                {:else}
                  {s.text}
                  <button class="eye-btn" on:click={() => { s._showText = false; updateLessonSentences(); }} title="隐藏原文">🙈</button>
                {/if}
              {/if}
            {:else if mode === 'read'}
              {#if s.caption && Array.isArray(s.caption.chunks)}
                {#each s.caption.chunks as w, wi}
                  <span class="word {s._currentWordIdx === wi ? 'active' : ''}">{s.text.slice(w.start, w.end)}</span>
                {/each}
              {:else}
                {s.text}
              {/if}
            {:else if mode === 'dictation'}
              {#if s.caption && Array.isArray(s.caption.chunks)}
                <form class="dictation-form" autocomplete="off" on:submit|preventDefault={() => checkDictation(i)}>
                  {#each s.caption.chunks as w, wi}
                    <input
                      type="text"
                      class="dict-word-input"
                      bind:value={dictationInputs[i][wi]}
                      maxlength={s.text.slice(w.start, w.end).length}
                      style="width: {s.text.slice(w.start, w.end).length + 2}ch; border: none; border-bottom: 2px solid #888; background: none; text-align: center; margin: 0 2px; font-size: 1.1em; letter-spacing: 2px; outline: none; padding: 2px 0;"
                      autocomplete="off"
                      use:dictationInputBind={[i, wi]}
                      on:keydown={(e) => handleDictInputKeydown(e, i, wi)}
                    />
                    {#if wi < s.caption.chunks.length - 1}
                      {#if s.text.slice(s.caption.chunks[wi].end, s.caption.chunks[wi + 1].start)}
                        <span>{s.text.slice(s.caption.chunks[wi].end, s.caption.chunks[wi + 1].start)}</span>
                      {/if}
                    {/if}
                  {/each}
                </form>
                {#if dictationResults[i] !== null}
                  {#if dictationResults[i]}
                    <span style="color:green">✔ 正确</span>
                  {:else}
                    <span style="color:red">✘ 拼写错误：</span>
                    {#if s.caption && Array.isArray(s.caption.chunks)}
                      {#each s.caption.chunks as w, wi}
                        {#if stripPunct(dictationInputs[i][wi]?.trim().toLowerCase()) !== stripPunct(s.text.slice(w.start, w.end).toLowerCase())}
                          <span style="color:red">{s.text.slice(w.start, w.end)}</span>
                        {:else}
                          <span>{s.text.slice(w.start, w.end)}</span>
                        {/if}
                        {s.text.slice(w.end, s.caption.chunks[wi + 1]?.start)}
                      {/each}
                    {:else}
                      <span>
                        {#each s.text.split('') as char, ci}
                          {#if stripPunct(dictationInputs[i]?.[ci]?.toLowerCase()) !== stripPunct(char.toLowerCase())}
                            <span style="color:red">{char}</span>
                          {:else}
                            <span>{char}</span>
                          {/if}
                        {/each}
                      </span>
                    {/if}
                  {/if}
                {/if}
              {:else}
                <input type="text" bind:value={dictationInputs[i]} placeholder="请听写..." style="width:80%" />
                <button on:click={() => checkDictation(i)} disabled={dictationResults[i] !== null}>提交</button>
                {#if dictationResults[i] !== null}
                  {#if dictationResults[i]}
                    <span style="color:green">✔ 正确</span>
                  {:else}
                    <span style="color:red">✘ 拼写错误，正确答案：{s.text}</span>
                  {/if}
                {/if}
              {/if}
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
  .active {
    background: #1976d2;
    color: #fff;
  }
  input[type="text"] {
    font-size: 1em;
    padding: 2px 6px;
    border: 1px solid #ccc;
    border-radius: 4px;
  }
  .eye-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1.1em;
    margin-left: 0.5em;
    vertical-align: middle;
  }
  .dictation-form {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 0.5em;
    margin-bottom: 0.2em;
  }
  .dict-word-input {
    border: none;
    border-bottom: 2px solid #888;
    background: none;
    text-align: center;
    margin: 0 2px;
    font-size: 1.1em;
    letter-spacing: 2px;
    outline: none;
    width: auto;
    min-width: 3em;
    max-width: 10em;
    flex: 0 1 auto;
    font-family: inherit;
    padding: 0 2px;
    box-sizing: border-box;
    word-break: break-all;
  }
  .dictation-form button[type="submit"] {
    margin-top: 0.5em;
    flex-shrink: 0;
  }
</style>
