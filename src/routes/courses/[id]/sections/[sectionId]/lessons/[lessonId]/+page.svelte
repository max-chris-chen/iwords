<script lang="ts">
  import { page } from "$app/stores";
  import type { Lesson, LessonSentence } from "$lib/models/course";
  import { onDestroy } from "svelte";

  export let data;

  let { lesson, courseId } = data;

  let currentSentenceIndex = 0;
  let learningMode = "listening"; // listening, reading, writing
  let showSentence = false;
  let isPlaying = false;
  let highlightedWordIndex = -1;

  $: sentences =
    lesson?.sentences?.map((s) => (typeof s === "string" ? s : s.text)) || [];
  $: currentSentence = sentences[currentSentenceIndex] || "";
  $: words = currentSentence.split(" ");
  $: maskedSentence = currentSentence.replace(/[a-zA-Z]/g, "*");

  function playCurrentSentence() {
    if (
      !currentSentence ||
      typeof window === "undefined" ||
      !window.speechSynthesis
    ) {
      return;
    }

    if (isPlaying) {
      window.speechSynthesis.cancel();
    } else {
      const utterance = new SpeechSynthesisUtterance(currentSentence);

      const wordStartIndices = [0];
      let cumulativeLength = 0;
      for (let i = 0; i < words.length - 1; i++) {
        cumulativeLength += words[i].length + 1; // +1 for space
        wordStartIndices.push(cumulativeLength);
      }

      utterance.onboundary = (event) => {
        let index = -1;
        for (let i = wordStartIndices.length - 1; i >= 0; i--) {
          if (event.charIndex >= wordStartIndices[i]) {
            index = i;
            break;
          }
        }
        highlightedWordIndex = index;
      };

      utterance.onstart = () => {
        isPlaying = true;
      };
      utterance.onend = () => {
        isPlaying = false;
        highlightedWordIndex = -1;
      };
      utterance.onerror = (e) => {
        console.error("Speech synthesis error:", e);
        isPlaying = false;
        highlightedWordIndex = -1;
      };
      window.speechSynthesis.speak(utterance);
    }
  }

  function nextSentence() {
    if (lesson && currentSentenceIndex < sentences.length - 1) {
      window.speechSynthesis?.cancel();
      currentSentenceIndex++;
      showSentence = false;
      highlightedWordIndex = -1;
    }
  }

  function prevSentence() {
    if (currentSentenceIndex > 0) {
      window.speechSynthesis?.cancel();
      currentSentenceIndex--;
      showSentence = false;
      highlightedWordIndex = -1;
    }
  }

  onDestroy(() => {
    if (typeof window !== "undefined") {
      window.speechSynthesis?.cancel();
    }
  });
</script>

<div class="page-container">
  <header class="page-header">
    <a href={`/courses/${courseId}`} class="back-link">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="lucide lucide-chevron-left"
        ><path d="m15 18-6-6 6-6" /></svg
      >
      <span>返回课程</span>
    </a>
  </header>

  <main class="learn-container">
    <div class="learn-header-card">
      <div class="learn-title-progress">
        <h1>{lesson.title}</h1>
        <div class="progress-bar-container">
          <div class="progress-bar">
            <div
              class="progress-bar-inner"
              style={`width: ${((currentSentenceIndex + 1) / sentences.length) * 100}%`}
            ></div>
          </div>
          <span class="progress-text"
            >{currentSentenceIndex + 1} / {sentences.length}</span
          >
        </div>
      </div>
    </div>

    <div class="card">
      <h2>学习模式</h2>
      <div class="mode-switcher">
        <button
          class:active={learningMode === 'listening'}
          on:click={() => (learningMode = 'listening')}>听力模式</button
        >
        <button
          class:active={learningMode === 'reading'}
          on:click={() => (learningMode = 'reading')}>跟读模式</button
        >
        <button
          class:active={learningMode === 'writing'}
          on:click={() => (learningMode = 'writing')}>听写模式</button
        >
      </div>
    </div>

    <div class="card">
      <div class="playback-controls">
        <button class="btn-icon" on:click={playCurrentSentence}>
          {#if isPlaying}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="lucide lucide-pause-circle"
              ><circle cx="12" cy="12" r="10" /><line
                x1="10"
                y1="15"
                x2="10"
                y2="9"
              /><line x1="14" y1="15" x2="14" y2="9" /></svg
            >
            <span>暂停</span>
          {:else}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="lucide lucide-play-circle"
              ><circle cx="12" cy="12" r="10" /><polygon
                points="10 8 16 12 10 16 10 8"
              /></svg
            >
            <span>播放</span>
          {/if}
        </button>
        <div class="sound-wave" class:playing={isPlaying}>
          <div class="bar"></div>
          <div class="bar"></div>
          <div class="bar"></div>
          <div class="bar"></div>
          <div class="bar"></div>
        </div>
      </div>
    </div>

    <div class="card sentence-card">
      <p class="sentence-text">
        {#if showSentence}
          {#each words as word, i}
            <span class:highlight={i === highlightedWordIndex}>{word}</span>{" "}
          {/each}
        {:else}
          {maskedSentence}
        {/if}
      </p>
      <button class="btn-icon btn-reveal" on:click={() => (showSentence = !showSentence)}>
        {#if showSentence}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="lucide lucide-eye-off"
          >
            <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
            <path
              d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"
            />
            <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
            <line x1="2" x2="22" y1="2" y2="22" />
          </svg>
          <span>隐藏</span>
        {:else}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="lucide lucide-eye"
            ><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle
              cx="12"
              cy="12"
              r="3"
            /></svg
          >
          <span>查看</span>
        {/if}
      </button>
    </div>

    <div class="navigation-buttons">
      <button
        class="btn-nav"
        on:click={prevSentence}
        disabled={currentSentenceIndex === 0}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="lucide lucide-chevron-left"
          ><path d="m15 18-6-6 6-6" /></svg
        >
        <span>上一句</span>
      </button>
      <button
        class="btn-nav btn-primary"
        on:click={nextSentence}
        disabled={currentSentenceIndex === sentences.length - 1}
      >
        <span>下一句</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="lucide lucide-chevron-right"
          ><path d="m9 18 6-6-6-6" /></svg
        >
      </button>
    </div>
  </main>
</div>

<style>
  :root {
    --primary-color: #4f46e5;
    --primary-hover-color: #4338ca;
    --text-primary: #1f2937;
    --text-secondary: #4b5563;
    --text-light: #6b7280;
    --bg-color: #f9fafb;
    --card-bg-color: #ffffff;
    --border-color: #e5e7eb;
    --blue-bg-light: #eef2ff;
  }
  .page-container {
    padding: 1rem 2rem;
    max-width: 800px;
    margin: 0 auto;
    background-color: var(--bg-color);
    font-family:
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      Roboto,
      Helvetica,
      Arial,
      sans-serif,
      "Apple Color Emoji",
      "Segoe UI Emoji",
      "Segoe UI Symbol";
  }
  .page-header {
    margin-bottom: 1.5rem;
  }
  .back-link {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--text-secondary);
    text-decoration: none;
    font-weight: 500;
  }
  .back-link:hover {
    color: var(--text-primary);
  }
  .learn-container {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  .card {
    background-color: var(--card-bg-color);
    border-radius: 0.75rem;
    padding: 1.5rem;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    border: 1px solid var(--border-color);
  }
  .learn-header-card {
    background-color: var(--card-bg-color);
    border-radius: 0.75rem;
    padding: 1.5rem;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    border: 1px solid var(--border-color);
  }
  .learn-title-progress h1 {
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0 0 1rem;
    color: var(--text-primary);
  }
  .progress-bar-container {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  .progress-bar {
    flex-grow: 1;
    height: 0.75rem;
    background-color: #e5e7eb;
    border-radius: 9999px;
    overflow: hidden;
  }
  .progress-bar-inner {
    height: 100%;
    background-color: var(--primary-color);
    border-radius: 9999px;
    transition: width 0.3s ease-in-out;
  }
  .progress-text {
    font-size: 0.875rem;
    color: var(--text-secondary);
    font-weight: 500;
  }
  .card h2 {
    font-size: 1.125rem;
    font-weight: 600;
    margin: 0 0 1rem;
    color: var(--text-primary);
  }
  .mode-switcher {
    display: flex;
    gap: 0.5rem;
    background-color: var(--bg-color);
    padding: 0.25rem;
    border-radius: 0.5rem;
    border: 1px solid var(--border-color);
  }
  .mode-switcher button {
    flex-grow: 1;
    padding: 0.5rem 1rem;
    border: none;
    background-color: transparent;
    border-radius: 0.375rem;
    font-weight: 500;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .mode-switcher button.active {
    background-color: var(--primary-color);
    color: white;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  }
  .playback-controls {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1.5rem;
  }
  .btn-icon {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background-color: transparent;
    border: 1px solid var(--border-color);
    color: var(--text-secondary);
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    font-weight: 500;
    cursor: pointer;
  }
  .btn-icon:hover {
    background-color: #f3f4f6;
  }
  .sound-wave {
    display: flex;
    align-items: center;
    gap: 2px;
    height: 24px;
  }
  .sound-wave .bar {
    width: 3px;
    background-color: var(--text-light);
    animation: sound 0.8s linear infinite alternate;
  }
  .sound-wave .bar:nth-child(1) {
    height: 10px;
    animation-delay: -0.7s;
  }
  .sound-wave .bar:nth-child(2) {
    height: 16px;
    animation-delay: -0.5s;
  }
  .sound-wave .bar:nth-child(3) {
    height: 20px;
    animation-delay: -0.3s;
  }
  .sound-wave .bar:nth-child(4) {
    height: 14px;
    animation-delay: -0.6s;
  }
  .sound-wave .bar:nth-child(5) {
    height: 8px;
    animation-delay: -0.4s;
  }

  .sound-wave:not(.playing) .bar {
    animation: none;
    height: 4px;
  }

  @keyframes sound {
    0% {
      height: 4px;
    }
    100% {
      height: 20px;
    }
  }
  .sentence-card {
    text-align: center;
    padding-top: 2.5rem;
    padding-bottom: 2.5rem;
  }
  .sentence-text {
    font-size: 1.25rem;
    color: var(--text-primary);
    margin: 0 0 1.5rem;
    letter-spacing: 2px;
    min-height: 40px;
  }
  .btn-reveal {
    margin: 0 auto;
  }
  .navigation-buttons {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .btn-nav {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1.25rem;
    border-radius: 0.375rem;
    border: 1px solid var(--border-color);
    background-color: var(--card-bg-color);
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease-in-out;
    color: var(--text-secondary);
  }
  .btn-nav:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .btn-nav.btn-primary {
    background-color: var(--primary-color);
    color: white;
    border-color: var(--primary-color);
  }
  .btn-nav.btn-primary:hover:not(:disabled) {
    background-color: var(--primary-hover-color);
  }
  .btn-nav:not(.btn-primary):hover:not(:disabled) {
    background-color: #f3f4f6;
  }
  .sentence-text span.highlight {
    background-color: var(--blue-bg-light);
    color: var(--primary-color);
    border-radius: 4px;
    padding: 2px 4px;
  }
</style>
