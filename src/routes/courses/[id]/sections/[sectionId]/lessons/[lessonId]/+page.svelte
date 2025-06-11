<script lang="ts">
  import { page } from "$app/stores";
  import type { Lesson, LessonSentence } from "$lib/models/course";
  import { onDestroy , onMount} from "svelte";
  import AddLessonModal from "$lib/modals/AddLessonModal.svelte";
  import { updateLesson } from "$lib/api/lesson";
  import { goto } from "$app/navigation";
  import { fetchRecordings } from "$lib/api/recording";
  import type { UserRecording } from "$lib/models/recording";
  export let data;

  let { lesson, courseId, sectionId } = data;

  let currentSentenceIndex = 0;
  let learningMode = "listening"; // listening, reading, writing
  let showSentence = false;
  let isPlaying = false;
  let highlightedWordIndex = -1;

  let isRecording = false;
  let recordedAudioUrl: string | null = null;
  let recordedAudioBlob: Blob | null = null;
  let mediaRecorder: MediaRecorder | null = null;
  let audioChunks: Blob[] = [];
  let recordingTime = 0;
  let recordingTimer: any = null;
  let isSubmitting = false;
  let submissionStatus: "success" | "error" | null = null;
  let userRecordings: UserRecording[] = [];
  let isPreparingToRecord = false;
  // UI state for edit lesson modal
  let showEditLessonModal = false;
  let editLessonTitle = "";
  let editLessonContent = "";
  let editLessonError = "";
  let editLessonLoading = false;

  $: currentSentenceObject = lesson?.sentences?.[currentSentenceIndex];
  $: currentSentenceId = typeof currentSentenceObject === 'string' ? null : currentSentenceObject?._id;
  $: currentSentenceRecordings = userRecordings.filter(r => r.sentenceId === currentSentenceId);
  $: currentSentenceText =
    (typeof currentSentenceObject === "string"
      ? currentSentenceObject
      : currentSentenceObject?.text) || "";
  $: words = currentSentenceText.split(" ");
  $: maskedSentence = currentSentenceText.replace(/[a-zA-Z]/g, "*");

  function openEditLessonModal() {
    showEditLessonModal = true;
    editLessonTitle = lesson.title;
    editLessonContent = lesson.sentences.map((s) => s.text).join("\n");
    editLessonError = "";
  }

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
      // Optionally, force a reload of the page to see changes if direct update is complex
      // window.location.reload();
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
      showSentence = false;
      highlightedWordIndex = -1;
      resetRecording();
    }
  }

  function prevSentence() {
    if (currentSentenceIndex > 0) {
      window.speechSynthesis?.cancel();
      currentSentenceIndex--;
      showSentence = false;
      highlightedWordIndex = -1;
      resetRecording();
    }
  }

  async function startRecording() {
    if (isRecording || isPreparingToRecord) return;

    isPreparingToRecord = true;
    recordedAudioUrl = null;
    recordedAudioBlob = null;
    recordingTime = 0;
    audioChunks = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.onstart = () => {
        isPreparingToRecord = false;
        isRecording = true;
        recordingTimer = setInterval(() => {
          recordingTime++;
        }, 1000);
      };

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        isRecording = false;
        clearInterval(recordingTimer);
        stream.getTracks().forEach(track => track.stop()); // Important cleanup

        const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
        recordedAudioUrl = URL.createObjectURL(audioBlob);
        recordedAudioBlob = audioBlob;
        audioChunks = [];

        const success = await submitRecording();
        if (success) {
          alert("录音提交成功！");
        }
      };

      mediaRecorder.start();

    } catch (err) {
      console.error("Error starting recording:", err);
      alert("无法开始录音，请检查麦克风权限。");
      isPreparingToRecord = false;
    }
  }

  function stopRecording() {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
    }
  }

  function resetRecording() {
    if (isRecording) {
      stopRecording();
    }
    recordedAudioUrl = null;
    audioChunks = [];
    if (mediaRecorder?.stream) {
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
    mediaRecorder = null;
    clearInterval(recordingTimer);
    recordingTime = 0;
  }

  function formatTime(seconds: number) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  async function submitRecording() {
    if (!recordedAudioBlob) {
      alert("没有可提交的录音。");
      return false;
    }
    isSubmitting = true;
    try {
      const formData = new FormData();
      formData.append("audio", recordedAudioBlob, "recording.webm");
      if (!lesson._id) {
        throw new Error("当前课程没有ID，无法提交。");
      }
      formData.append("courseId", courseId);
      formData.append("lessonId", lesson._id);

      const sentenceObject = lesson.sentences[currentSentenceIndex];
      const sentenceId =
        typeof sentenceObject !== "string" && sentenceObject?._id
          ? sentenceObject._id
          : null;

      if (!sentenceId) {
        throw new Error("当前句子没有ID，无法提交。");
      }
      formData.append("sentenceId", sentenceId);
      formData.append("duration", recordingTime.toString());

      const response = await fetch("/api/courses/recording", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        if (lesson._id) {
          userRecordings = await fetchRecordings(lesson._id);
        }
        return true;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "提交失败，请重试。");
      }
    } catch (error) {
      console.error("Submission error:", error);
      alert(`提交出错: ${error instanceof Error ? error.message : "未知错误"}`);
      return false;
    } finally {
      isSubmitting = false;
    }
  }

  async function deleteRecording(recordingId: string) {
    if (!confirm('确定要删除这条录音吗？')) {
      return;
    }
    try {
      const response = await fetch(`/api/recordings/${recordingId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        userRecordings = userRecordings.filter(r => r._id !== recordingId);
        alert('录音已删除。');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || '删除失败。');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert(`删除出错: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  onMount(async () => {
    console.debug("lesson", lesson);
    console.debug("lesson._id", lesson._id);
    if (lesson._id) {
      try {
        userRecordings = await fetchRecordings(lesson._id);
        console.debug("userRecordings", userRecordings);
      } catch (error) {
        console.error("Failed to fetch recordings:", error);
      }
    }
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
              style={`width: ${((currentSentenceIndex + 1) / (lesson?.sentences?.length || 1)) * 100}%`}
            ></div>
          </div>
          <span class="progress-text"
            >{currentSentenceIndex + 1} / {lesson?.sentences?.length || 0}</span
          >
        </div>
      </div>
       <div class="mt-4 flex justify-end">
        <button class="btn" on:click={openEditLessonModal}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pencil"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
          <span>编辑</span>
        </button>
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
      <p class="sentence-text">
        {#if showSentence || learningMode === 'reading'}
          {#each words as word, i}
            <span class:highlight={i === highlightedWordIndex}>{word}</span>{" "}
          {/each}
        {:else}
          {maskedSentence}
        {/if}
      </p>

      {#if learningMode === 'reading'}

        <div class="recording-controls">
          {#if !isRecording}
            <button class="btn btn-primary" on:click={startRecording} disabled={isPreparingToRecord}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-mic"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
              {#if isPreparingToRecord}
                <span>准备中...</span>
              {:else}
                <span>开始录音</span>
              {/if}
            </button>
          {:else}
            <button class="btn btn-danger" on:click={stopRecording} disabled={!isRecording}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-stop-circle"><circle cx="12" cy="12" r="10"/><rect width="6" height="6" x="9" y="9"/></svg>
              <span>停止录音 ({formatTime(recordingTime)})</span>
            </button>
          {/if}
        </div>

        {#if recordedAudioUrl}
          <div class="recorded-audio">
            <h3>我的录音</h3>
            <audio controls src={recordedAudioUrl}></audio>
          </div>
        {/if}

        {#if currentSentenceRecordings.length > 0}
        <div class="recordings-list-container">
          <h3>我的跟读记录</h3>
          <ul class="recordings-list">
            {#each currentSentenceRecordings as recording}
              <li
                class="recording-item"
              >
                <div class="recording-info">
                  <span>
                    录制于: {new Date(recording.createdAt).toLocaleString()}
                    {#if recording.duration}
                      <span style="margin-left: 1rem;">
                        (时长: {formatTime(recording.duration)})
                      </span>
                    {/if}
                  </span>
                  <button class="btn-icon btn-delete" on:click={() => recording._id && deleteRecording(recording._id.toString())}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14"y1="11" y2="17"/></svg>
                  </button>
                </div>
                <audio
                  controls
                  src={`/api/audio/${recording.recordingUrl.replace(/\\/g, '/')}`}
                />
              </li>
            {/each}
          </ul>
        </div>
      {/if}


      {/if}

      {#if learningMode !== 'reading'}
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
      {/if}

      <div class="navigation-buttons">
        <button class="btn" on:click={prevSentence} disabled={currentSentenceIndex === 0}>
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
          on:click={nextSentence}
          disabled={lesson && currentSentenceIndex === (lesson.sentences.length || 0) - 1}
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
  .btn-danger {
    background-color: #ef4444;
    color: white;
    border-color: #ef4444;
  }
  .btn-danger:hover:not(:disabled) {
    background-color: #dc2626;
  }

  .sentence-text span.highlight {
    background-color: var(--blue-bg-light);
    color: var(--primary-color);
    border-radius: 4px;
    padding: 2px 4px;
  }

  .recording-controls {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 1rem;
    gap: 1rem;
  }

  .recorded-audio {
    margin-top: 1.5rem;
    text-align: center;
  }

  .recorded-audio h3 {
    margin-bottom: 0.5rem;
    font-size: 1.1rem;
    font-weight: 600;
  }

  .recorded-audio audio {
    width: 100%;
    margin-bottom: 1rem;
  }

  .success-message {
    color: #16a34a;
    margin-top: 0.5rem;
  }

  .error-message {
    color: #ef4444;
    margin-top: 0.5rem;
  }

  .recordings-list-container {
    margin-top: 2rem;
    padding-top: 1rem;
    border-top: 1px solid var(--border-color);
  }

  .recordings-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .recording-item {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.75rem;
    background-color: var(--card-bg-color);
    border-radius: var(--rounded-lg);
    border: 1px solid var(--border-color);
    transition: all 0.2s ease-in-out;
  }

  .recording-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    font-size: 0.875rem;
    color: var(--text-muted-color);
  }

  .btn-delete {
    color: var(--text-muted-color);
    transition: color 0.2s ease-in-out;
  }

  .btn-delete:hover {
    color: var(--danger-color);
  }

  .recording-duration {
    font-weight: 500;
  }
</style>
