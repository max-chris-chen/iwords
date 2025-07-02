<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import AddLessonModal from "$lib/modals/AddLessonModal.svelte";
  import { updateLesson } from "$lib/api/lesson";
  import { fetchRecordings } from "$lib/api/recording";
  import type { UserRecording } from "$lib/models/recording";
  import ListeningMode from "$lib/components/lesson/ListeningMode.svelte";
  import ReadingMode from "$lib/components/lesson/ReadingMode.svelte";
  import WritingMode from "$lib/components/lesson/WritingMode.svelte";

  let { data } = $props();

  let { courseId, sectionId } = data;
  let lesson = $derived(data.lesson);

  let currentSentenceIndex = $state(0);
  let learningMode = $state<"listening" | "reading" | "writing">("listening"); // listening, reading, writing
  let isPlaying = $state(false);
  let highlightedWordIndex = $state(-1);
  let userRecordings: UserRecording[] = $state([]);

  // UI state for edit lesson modal
  let showEditLessonModal = $state(false);
  let editLessonTitle = $state("");
  let editLessonContent = $state("");
  let editLessonError = $state("");
  let editLessonLoading = $state(false);

  let currentSentenceObject = $derived(
    lesson?.sentences?.[currentSentenceIndex],
  );
  let currentSentenceText = $derived(
    (typeof currentSentenceObject === "string"
      ? currentSentenceObject
      : currentSentenceObject?.text) || "",
  );
  let words = $derived(currentSentenceText.split(" "));
  let maskedSentence = $derived(currentSentenceText.replace(/[a-zA-Z]/g, "*"));

  function closeEditLessonModal() {
    showEditLessonModal = false;
  }

  async function handleEditLessonModalEdit(e: CustomEvent) {
    editLessonError = "";
    editLessonLoading = true;

    if (!e.detail.title.trim()) {
      editLessonError = "Lesson title required";
      editLessonLoading = false;
      return;
    }

    try {
      if (!lesson._id) {
        throw new Error("Lesson ID is missing");
      }
      const updatedLesson = await updateLesson(
        courseId,
        sectionId,
        lesson._id,
        {
          title: e.detail.title,
          content: e.detail.content,
        },
      );
      lesson = { ...lesson, ...updatedLesson };
      closeEditLessonModal();
    } catch (err: unknown) {
      const error = err as Error;
      editLessonError = error.message || "更新失败";
    } finally {
      editLessonLoading = false;
    }
  }

  function playCurrentSentence() {
    if (
      !currentSentenceText ||
      typeof window === "undefined" ||
      !window.speechSynthesis
    ) {
      return;
    }

    if (isPlaying) {
      window.speechSynthesis.cancel();
    } else {
      const utterance = new SpeechSynthesisUtterance(currentSentenceText);

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
    if (lesson && currentSentenceIndex < lesson.sentences.length - 1) {
      window.speechSynthesis?.cancel();
      currentSentenceIndex++;
      highlightedWordIndex = -1;
    }
  }

  function prevSentence() {
    if (currentSentenceIndex > 0) {
      window.speechSynthesis?.cancel();
      currentSentenceIndex--;
      highlightedWordIndex = -1;
    }
  }

  async function refreshRecordings() {
    if (lesson._id) {
      try {
        userRecordings = await fetchRecordings(lesson._id);
      } catch (error) {
        console.error("Failed to fetch recordings:", error);
      }
    }
  }

  onMount(async () => {
    await refreshRecordings();
  });

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
        class="lucide lucide-chevron-left"><path d="m15 18-6-6 6-6" /></svg
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
              style={`width: ${((currentSentenceIndex + 1) / (lesson?.sentences?.length || 1)) * 100}%`}
            ></div>
          </div>
          <span class="progress-text"
            >{currentSentenceIndex + 1} / {lesson?.sentences?.length || 0}</span
          >
        </div>
      </div>
      <div class="mt-4 flex justify-end"></div>
    </div>

    <div class="card">
      <h2>学习模式</h2>
      <div class="mode-switcher">
        <button
          class:active={learningMode === "listening"}
          onclick={() => {
            learningMode = "listening";
          }}>听力模式</button
        >
        <button
          class:active={learningMode === "reading"}
          onclick={() => {
            learningMode = "reading";
          }}>跟读模式</button
        >
        <button
          class:active={learningMode === "writing"}
          onclick={() => {
            learningMode = "writing";
          }}>听写模式</button
        >
      </div>
    </div>

    <div class="card">
      <div class="playback-controls">
        <button class="btn-icon" onclick={playCurrentSentence}>
          {#if isPlaying}
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
              viewBox="0 0 24 24"
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
      {#if learningMode === "listening"}
        <ListeningMode {words} {highlightedWordIndex} {maskedSentence} />
      {:else if learningMode === "reading"}
        <ReadingMode
          {lesson}
          {courseId}
          {currentSentenceIndex}
          {words}
          {highlightedWordIndex}
          {userRecordings}
          {refreshRecordings}
        />
      {:else if learningMode === "writing"}
        <WritingMode {words} {currentSentenceText} />
      {/if}

      <div class="navigation-buttons">
        <button
          class="btn"
          onclick={prevSentence}
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
            class="lucide lucide-arrow-left"
            ><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg
          >
          <span>上一个</span>
        </button>
        <button
          class="btn btn-primary"
          onclick={nextSentence}
          disabled={lesson &&
            currentSentenceIndex === (lesson.sentences.length || 0) - 1}
        >
          <span>下一个</span>
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
            class="lucide lucide-arrow-right"
            ><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg
          >
        </button>
      </div>
    </div>
  </main>
</div>

<AddLessonModal
  bind:open={showEditLessonModal}
  bind:loading={editLessonLoading}
  bind:error={editLessonError}
  editMode={true}
  editTitle={editLessonTitle}
  editContent={editLessonContent}
  on:edit={handleEditLessonModalEdit}
  on:close={closeEditLessonModal}
/>

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
    --success-color: #16a34a;
    --danger-color: #ef4444;
  }
  .page-container {
    padding: 1rem 2rem;
    max-width: 800px;
    margin: 0 auto;
    background-color: var(--bg-color);
    font-family:
      -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial,
      sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 1rem;
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

  .fallback-info {
    margin-top: 1rem;
    color: var(--text-light);
    font-style: italic;
  }

  .navigation-buttons {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 1.5rem;
  }
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    border: 1px solid var(--border-color);
    background-color: var(--card-bg-color);
    color: var(--text-secondary);
  }
  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .btn:not(:disabled):hover {
    background-color: #f3f4f6;
  }

  .btn-primary {
    background-color: var(--primary-color);
    color: white;
    border-color: var(--primary-color);
  }
  .btn-primary:hover:not(:disabled) {
    background-color: var(--primary-hover-color, #4f46e5);
  }
</style>
