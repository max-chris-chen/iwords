<script lang="ts">
  import type { Lesson } from "$lib/models/course";
  import type { UserRecording } from "$lib/models/recording";

  let {
    lesson,
    courseId,
    currentSentenceIndex,
    words,
    highlightedWordIndex,
    userRecordings = [],
    refreshRecordings,
  } = $props<{
    lesson: Lesson;
    courseId: string;
    currentSentenceIndex: number;
    words: string[];
    highlightedWordIndex: number;
    userRecordings: UserRecording[];
    refreshRecordings: () => Promise<void>;
  }>();

  let isRecording = $state(false);
  let recordedAudioUrl: string | null = $state(null);
  let recordedAudioBlob: Blob | null = null;
  let mediaRecorder: MediaRecorder | null = null;
  let audioChunks: Blob[] = [];
  let recordingTime = $state(0);
  let recordingTimer: number | null = $state(null);
  let isPreparingToRecord = $state(false);

  let currentSentenceObject = $derived(
    lesson?.sentences?.[currentSentenceIndex],
  );
  let currentSentenceId = $derived(
    typeof currentSentenceObject === "string"
      ? null
      : currentSentenceObject?._id,
  );
  let currentSentenceRecordings = $derived(
    userRecordings.filter(
      (r: UserRecording) => r.sentenceId === currentSentenceId,
    ),
  );

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
        recordingTimer = window.setInterval(() => {
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
        if (recordingTimer) clearInterval(recordingTimer);
        stream.getTracks().forEach((track) => track.stop()); // Important cleanup

        const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
        recordedAudioUrl = URL.createObjectURL(audioBlob);
        recordedAudioBlob = audioBlob;
        audioChunks = [];

        const success = await submitRecording();
        if (success) {
          await refreshRecordings();
          alert("录音提交成功！");
          recordedAudioUrl = null;
          recordedAudioBlob = null;
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

  async function submitRecording() {
    if (!recordedAudioBlob) {
      alert("没有可提交的录音。");
      return false;
    }
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
        return true;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "提交失败，请重试。");
      }
    } catch (error) {
      console.error("Submission error:", error);
      alert(`提交出错: ${error instanceof Error ? error.message : "未知错误"}`);
      return false;
    }
  }

  async function deleteRecording(recordingId: string) {
    if (!confirm("确定要删除这条录音吗？")) {
      return;
    }
    try {
      const response = await fetch(`/api/recordings/${recordingId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        alert("录音已删除。");
        await refreshRecordings();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "删除失败。");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert(`删除出错: ${error instanceof Error ? error.message : "未知错误"}`);
    }
  }

  function formatTime(seconds: number) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
</script>

<p class="sentence-text">
  {#each words as word, i}
    <span class:highlight={i === highlightedWordIndex}>{word}</span>
    {" "}
  {/each}
</p>

<div class="recording-controls">
  {#if !isRecording}
    <button
      class="btn btn-primary"
      onclick={startRecording}
      disabled={isPreparingToRecord}
    >
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
        class="lucide lucide-mic"
        ><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path
          d="M19 10v2a7 7 0 0 1-14 0v-2"
        /><line x1="12" x2="12" y1="19" y2="22" /></svg
      >
      {#if isPreparingToRecord}
        <span>准备中...</span>
      {:else}
        <span>开始录音</span>
      {/if}
    </button>
  {:else}
    <button
      class="btn btn-danger"
      onclick={stopRecording}
      disabled={!isRecording}
    >
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
        class="lucide lucide-stop-circle"
        ><circle cx="12" cy="12" r="10" /><rect
          width="6"
          height="6"
          x="9"
          y="9"
        /></svg
      >
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
        <li class="recording-item">
          <div class="recording-info">
            <span>
              录制于: {new Date(recording.createdAt).toLocaleString()}
              {#if recording.duration}
                <span style="margin-left: 1rem;">
                  (时长: {formatTime(recording.duration)})
                </span>
              {/if}
            </span>
            <button
              class="btn-icon btn-delete"
              onclick={() =>
                recording._id && deleteRecording(recording._id.toString())}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="lucide lucide-trash-2"
                ><path d="M3 6h18" /><path
                  d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                /><line x1="10" x2="10" y1="11" y2="17" /><line
                  x1="14"
                  x2="14"
                  y1="11"
                  y2="17"
                /></svg
              >
            </button>
          </div>
          <audio
            controls
            src={`/api/audio/${recording.recordingUrl.replace(/\\/g, "/")}`}
          ></audio>
        </li>
      {/each}
    </ul>
  </div>
{/if}

<style>
  .sentence-text {
    font-size: 1.25rem;
    color: var(--text-primary);
    margin: 0 0 1.5rem;
    letter-spacing: 2px;
    min-height: 40px;
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
    border-radius: 0.5rem;
    border: 1px solid var(--border-color);
    transition: all 0.2s ease-in-out;
  }

  .recording-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    font-size: 0.875rem;
    color: var(--text-secondary);
  }
  .btn,
  .btn-primary,
  .btn-danger,
  .btn-icon {
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
    background-color: var(--danger-color);
    color: white;
    border-color: var(--danger-color);
  }
  .btn-danger:hover:not(:disabled) {
    background-color: #dc2626;
  }

  .btn-icon {
    background-color: transparent;
    padding: 0.5rem 1rem;
  }
  .btn-icon:hover {
    background-color: #f3f4f6;
  }

  .btn-delete {
    color: var(--text-secondary);
    transition: color 0.2s ease-in-out;
    padding: 0.25rem;
    border: none;
  }

  .btn-delete:hover {
    color: var(--danger-color);
    background-color: transparent;
  }
</style>
