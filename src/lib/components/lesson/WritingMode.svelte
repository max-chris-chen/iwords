<script lang="ts">
  import { run } from "svelte/legacy";

  let { words, currentSentenceText } = $props<{
    words: string[];
    currentSentenceText: string;
  }>();

  let userInputs: string[] = $state([]);
  let writingFeedback = $state("");
  let wordCorrectness: (boolean | null)[] = $state([]);
  let showSentence = $state(false);

  let audioContext: AudioContext | null = null;

  let allWordsCorrect = $derived(
    wordCorrectness.length > 0 && wordCorrectness.every((c) => c === true),
  );
  let someWordsIncorrect = $derived(
    wordCorrectness.length > 0 && wordCorrectness.some((c) => c === false),
  );

  let maskedSentence = $derived(currentSentenceText.replace(/[a-zA-Z]/g, "*"));

  run(() => {
    // Reset state when words change (new sentence)
    if (words.length > 0) {
      userInputs = Array(words.length).fill("");
      wordCorrectness = Array(words.length).fill(null);
      writingFeedback = "";
      showSentence = false;
    }
  });

  interface CustomWindow extends Window {
    webkitAudioContext?: typeof AudioContext;
    AudioContext?: typeof AudioContext;
  }

  function initAudioContext() {
    if (typeof window !== "undefined" && !audioContext) {
      try {
        const CustomAudioContext =
          (window as CustomWindow).AudioContext ||
          (window as CustomWindow).webkitAudioContext;
        if (CustomAudioContext) {
          audioContext = new CustomAudioContext();
          if (audioContext.state === "suspended") {
            audioContext.resume();
          }
        } else {
          console.error("Web Audio API is not supported in this browser.");
        }
      } catch (e) {
        console.error("Web Audio API is not supported in this browser.", e);
      }
    }
  }

  function playKeySound() {
    if (typeof window === "undefined") return;

    if (!audioContext) {
      initAudioContext();
      if (!audioContext) return;
    }

    function _play() {
      if (!audioContext) return;
      const now = audioContext.currentTime;
      const gainNode = audioContext.createGain();
      gainNode.connect(audioContext.destination);

      gainNode.gain.setValueAtTime(0.2, now);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);

      const oscillator = audioContext.createOscillator();
      oscillator.connect(gainNode);
      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(880, now);
      oscillator.frequency.exponentialRampToValueAtTime(440, now + 0.05);

      oscillator.start(now);
      oscillator.stop(now + 0.1);
    }

    if (audioContext?.state === "suspended") {
      audioContext?.resume().then(() => {
        _play();
      });
    } else {
      _play();
    }
  }

  function handleWordInput() {
    wordCorrectness = Array(words.length).fill(null);
    writingFeedback = "";
  }

  function handleKeyDown(event: KeyboardEvent, index: number) {
    if (
      !event.metaKey &&
      !event.ctrlKey &&
      !event.altKey &&
      (event.key.length === 1 || event.key === "Backspace")
    ) {
      playKeySound();
    }
    const target = event.target as HTMLInputElement;

    if (event.key === " ") {
      event.preventDefault();
      if (index < words.length - 1) {
        (target.nextElementSibling as HTMLInputElement)?.focus();
      }
    } else if (
      event.key === "ArrowRight" &&
      target.selectionStart === userInputs[index].length &&
      index < words.length - 1
    ) {
      event.preventDefault();
      (target.nextElementSibling as HTMLInputElement)?.focus();
    } else if (
      event.key === "ArrowLeft" &&
      target.selectionStart === 0 &&
      index > 0
    ) {
      event.preventDefault();
      (target.previousElementSibling as HTMLInputElement)?.focus();
    } else if (
      event.key === "Backspace" &&
      target.selectionStart === 0 &&
      target.selectionEnd === 0 &&
      index > 0
    ) {
      (target.previousElementSibling as HTMLInputElement)?.focus();
    }
  }

  function checkAnswer() {
    const newWordCorrectness = words.map((correctWord: string, i: number) => {
      const userWord = userInputs[i] || "";
      const cleanUserWord = userWord
        .trim()
        .replace(/[.,/#!$%^&*;:{}=\-_`~()'’]/g, "")
        .toLowerCase();
      const cleanCorrectWord = correctWord
        .replace(/[.,/#!$%^&*;:{}=\-_`~()'’]/g, "")
        .toLowerCase();
      return cleanUserWord === cleanCorrectWord;
    });
    wordCorrectness = newWordCorrectness;

    const allCorrect = newWordCorrectness.every((c: boolean) => c === true);

    if (allCorrect) {
      writingFeedback = "太棒了，完全正确！";
    } else {
      writingFeedback = "有些地方不对哦，请检查红色的部分。";
    }
  }
</script>

<svelte:window onkeydown={initAudioContext} />

<div class="writing-mode-container">
  <p class="sentence-text">
    {#if showSentence}
      {currentSentenceText}
    {:else}
      {maskedSentence}
    {/if}
  </p>

  <div class="writing-input-container">
    {#each words as word, i}
      <input
        type="text"
        bind:value={userInputs[i]}
        oninput={() => handleWordInput()}
        onkeydown={(e) => handleKeyDown(e, i)}
        class="word-input"
        class:incorrect={wordCorrectness[i] === false}
        style="width: {word.length * 1.2 + 2}ch;"
        autocomplete="off"
        autocorrect="off"
        autocapitalize="off"
        spellcheck="false"
      />
    {/each}
  </div>

  <div class="writing-actions">
    <button
      class="btn btn-primary"
      onclick={checkAnswer}
      disabled={userInputs.join("").trim() === ""}>检查</button
    >
    <button
      class="btn-icon btn-reveal"
      onclick={() => (showSentence = !showSentence)}
    >
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
          ><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path
            d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"
          /><path
            d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"
          /><line x1="2" x2="22" y1="2" y2="22" /></svg
        >
        <span>隐藏答案</span>
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
        <span>查看答案</span>
      {/if}
    </button>
  </div>

  {#if writingFeedback}
    <p
      class="feedback"
      class:correct={allWordsCorrect}
      class:incorrect={someWordsIncorrect}
    >
      {writingFeedback}
    </p>
  {/if}
</div>

<style>
  .writing-mode-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
  }

  .writing-input-container {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.5rem;
    width: 100%;
    position: relative;
    padding: 0.75rem 1rem;
    font-size: 1.1rem;
    cursor: text;
    min-height: 48px;
  }

  .word-input {
    border: none;
    border-bottom: 2px solid var(--text-primary);
    background-color: transparent;
    font-size: 1.1rem;
    padding: 2px 0;
    margin: 0 0.25rem;
    text-align: center;
    font-family: monospace;
  }
  .word-input:focus {
    outline: none;
    border-bottom-color: var(--primary-color);
  }

  .word-input.incorrect {
    color: var(--danger-color);
    border-bottom-color: var(--danger-color);
  }

  .writing-actions {
    display: flex;
    gap: 1rem;
    align-items: center;
  }

  .feedback {
    font-weight: 500;
  }
  .feedback.correct {
    color: var(--success-color);
  }
  .feedback.incorrect {
    color: var(--danger-color);
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
</style>
