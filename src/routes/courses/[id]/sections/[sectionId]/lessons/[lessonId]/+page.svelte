<script lang="ts">
  import { page } from "$app/stores";
  import { onMount, tick } from "svelte";
  import SentencesList from "$lib/components/SentencesList.svelte";
  import type { Lesson } from "$lib/models/course";
  import { fetchLesson } from "$lib/api/lesson";

  let lesson: Lesson | null = null;
  let loading = true;
  let err = "";
  let playingIdx = -1;
  let audio: HTMLAudioElement | null = null;
  let playbackRate = "1.0";
  let mode: "listen" | "read" | "dictation" = "listen";
  let dictationInputs: string[][] = [];
  let dictationResults: (boolean | null)[] = [];
  let isPlayingAll = false;
  let dictationInputRefs: Array<Array<HTMLInputElement | null>> = [];
  let audioCtx: AudioContext | null = null;

  onMount(async () => {
    loading = true;
    err = "";
    const { id, sectionId, lessonId } = $page.params;
    try {
      lesson = await fetchLesson(id, sectionId, lessonId);
      // 初始化每个句子的 _currentWordIdx
      if (lesson?.sentences?.length) {
        for (const s of lesson.sentences) {
          s._currentWordIdx = -1;
        }
      }
    } catch {
      err = "加载失败";
    } finally {
      loading = false;
    }
  });

  function updateLessonSentences() {
    // 只在非dictation模式下才整体替换，避免input重建导致焦点丢失
    if (mode !== "dictation" && lesson) {
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
    lesson.sentences.forEach((x) => (x._currentWordIdx = -1));
    updateLessonSentences();

    audio = new Audio(s.audioUrl);
    audio.playbackRate = +playbackRate;

    // 用于取消预设的单词高亮定时器
    let highlightTimers: number[] = [];

    // 清理所有定时器
    function clearTimers() {
      highlightTimers.forEach((id) => window.clearTimeout(id));
      highlightTimers = [];
    }

    if (s.caption && Array.isArray(s.caption.chunks)) {
      // 预先安排所有单词的定时高亮
      function scheduleWordHighlights() {
        clearTimers();
        const currentTime = audio!.currentTime * 1000;
        s.caption!.chunks.forEach((chunk, index) => {
          const startTime = chunk.start_time;
          const timeUntilWord = startTime - currentTime;
          if (timeUntilWord > 50) {
            const timerId = window.setTimeout(() => {
              if (
                audio &&
                !audio.paused &&
                audio.currentTime * 1000 >= chunk.start_time
              ) {
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
        if (t < s.caption!.chunks[0].start_time) {
          if (s._currentWordIdx !== -1) {
            s._currentWordIdx = -1;
            updateLessonSentences();
          }
          return;
        }
        for (let i = 0; i < s.caption!.chunks.length; i++) {
          const chunk = s.caption!.chunks[i];
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
          const lastChunk = s.caption!.chunks[s.caption!.chunks.length - 1];
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
    audio.play().catch((error: unknown) => {
      console.error("播放失败:", error);
      playingIdx = -1;
      updateLessonSentences();
    });
  }

  function playKeySound() {
    if (!audioCtx) {
      try {
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        audioCtx = new AudioContextClass();
      } catch {
        console.error("Web Audio API is not supported in this browser");
        return;
      }
    }
    // 关键：每次都检查状态
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }

    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(1200, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);

    gainNode.gain.exponentialRampToValueAtTime(
      0.0001,
      audioCtx.currentTime + 0.05,
    );

    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.05);
  }

  function setMode(newMode: typeof mode) {
    mode = newMode;
    if (mode === "dictation") {
      if (!audioCtx) {
        try {
          const AudioContextClass =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext })
              .webkitAudioContext;
          audioCtx = new AudioContextClass();
        } catch {
          console.error("Web Audio API is not supported in this browser");
          return;
        }
      }
      if (audioCtx?.state === "suspended") {
        audioCtx.resume();
      }

      if (lesson?.sentences?.length) {
        // Initialize input arrays
        dictationInputs = lesson.sentences.map((s) =>
          s.caption && Array.isArray(s.caption.chunks)
            ? Array(s.caption.chunks.length).fill("")
            : [""],
        );

        // Reset the results array
        dictationResults = Array(lesson.sentences.length).fill(null);

        // Clear and initialize refs array for each sentence
        dictationInputRefs = lesson.sentences.map((s) =>
          s.caption && Array.isArray(s.caption.chunks)
            ? Array(s.caption.chunks.length).fill(null)
            : [null],
        );
      }
    }
  }

  function stripPunct(str: string) {
    return str.replace(/[\p{P}\p{S}]/gu, "");
  }

  function checkDictation(idx: number) {
    if (!lesson?.sentences?.[idx]) return;
    const s = lesson.sentences[idx];
    if (s.caption && Array.isArray(s.caption.chunks)) {
      const answerWords = s.caption.chunks.map((w) =>
        s.text.slice(w.start, w.end),
      );
      const inputWords = dictationInputs[idx];
      dictationResults[idx] = inputWords.every(
        (w, i) =>
          stripPunct(w.trim().toLowerCase()) ===
          stripPunct(answerWords[i].toLowerCase()),
      );
    } else {
      const answer = s.text.trim();
      const input = dictationInputs[idx][0];
      dictationResults[idx] =
        stripPunct(input.trim().toLowerCase()) ===
        stripPunct(answer.toLowerCase());
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
          if (lesson && playingIdx + 1 < lesson.sentences.length) {
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
          if (lesson && idx + 1 < lesson.sentences.length) {
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
  $: if (mode === "dictation" && lesson?.sentences?.length) {
    tick().then(() => {
      if (dictationInputRefs[0]?.[0]) {
        dictationInputRefs[0][0].focus();
      }
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
  <div style="margin-bottom:1em;display:flex;gap:1em">
    <button on:click={() => setMode("listen")} class:active={mode === "listen"}
      >听力</button
    >
    <button on:click={() => setMode("read")} class:active={mode === "read"}
      >跟读</button
    >
    <button
      on:click={() => setMode("dictation")}
      class:active={mode === "dictation"}>听写</button
    >
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
  {#if mode === "listen"}
    <div style="margin-bottom:1em">
      <button
        on:click={playAllSentences}
        disabled={isPlayingAll || playingIdx !== -1}>播放全部</button
      >
      <button on:click={pauseAll} disabled={!isPlayingAll && playingIdx === -1}
        >暂停</button
      >
      <button
        on:click={resumeAll}
        disabled={isPlayingAll || playingIdx === -1 || !audio || !audio.paused}
        >继续</button
      >
    </div>
  {/if}
  {#if lesson.sentences?.length}
    <SentencesList
      sentences={lesson.sentences}
      {mode}
      {playingIdx}
      onPlay={playSentence}
      {updateLessonSentences}
      {dictationInputs}
      {dictationResults}
      {dictationInputRefs}
      {checkDictation}
      {playKeySound}
    />
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
    box-shadow: 0 1px 4px 0 rgba(67, 198, 172, 0.1);
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
