<script lang="ts">
  import DictationInput from "./DictationInput.svelte";
  import type { LessonSentence } from "$lib/models/course";

  let {
    sentence,
    idx,
    mode,
    playingIdx,
    onPlay,
    updateLessonSentences,
    dictationInputs,
    dictationResult,
    inputRefs,
    checkDictation,
    playKeySound,
    onInputChange,
  } = $props<{
    sentence: LessonSentence;
    idx: number;
    mode: "listen" | "read" | "dictation";
    playingIdx: number;
    onPlay: (idx: number) => void;
    updateLessonSentences: () => void;
    dictationInputs: string[];
    dictationResult: boolean | null;
    inputRefs: (HTMLInputElement | null)[];
    checkDictation: (idx: number) => void;
    playKeySound: () => void;
    onInputChange: (wi: number, value: string) => void;
  }>();
</script>

<li class="border rounded p-3 flex flex-col gap-2">
  <div style="margin-top:0.5em;font-size:1.1em">
    {#if mode === "listen"}
      {#if sentence.caption && Array.isArray(sentence.caption.chunks)}
        {#if !sentence._showText}
          {#each sentence.caption.chunks as w}
            <span class="word"
              >{"*".repeat(sentence.text.slice(w.start, w.end).length)}</span
            >
          {/each}
          <button
            class="eye-btn"
            onclick={() => {
              sentence._showText = true;
              updateLessonSentences();
            }}
            title="显示原文">👁</button
          >
        {:else}
          {#each sentence.caption.chunks as w}
            <span class="word">{sentence.text.slice(w.start, w.end)}</span>
          {/each}
          <button
            class="eye-btn"
            onclick={() => {
              sentence._showText = false;
              updateLessonSentences();
            }}
            title="隐藏原文">🙈</button
          >
        {/if}
      {:else if !sentence._showText}
        {"*".repeat(sentence.text.length)}
        <button
          class="eye-btn"
          onclick={() => {
            sentence._showText = true;
            updateLessonSentences();
          }}
          title="显示原文">👁</button
        >
      {:else}
        {sentence.text}
        <button
          class="eye-btn"
          onclick={() => {
            sentence._showText = false;
            updateLessonSentences();
          }}
          title="隐藏原文">🙈</button
        >
      {/if}
    {:else if mode === "read"}
      {#if sentence.caption && Array.isArray(sentence.caption.chunks)}
        {#each sentence.caption.chunks as w, wi}
          <span class="word {sentence._currentWordIdx === wi ? 'active' : ''}"
            >{sentence.text.slice(w.start, w.end)}</span
          >
        {/each}
      {:else}
        {sentence.text}
      {/if}
    {:else if mode === "dictation"}
      <DictationInput
        {sentence}
        sentenceIdx={idx}
        {dictationInputs}
        {dictationResult}
        {inputRefs}
        {onInputChange}
        onCheck={() => checkDictation(idx)}
        onPlayKeySound={playKeySound}
      />
    {/if}
  </div>
  {#if sentence.audioUrl}
    <button onclick={() => onPlay(idx)} disabled={playingIdx === idx}>
      {playingIdx === idx ? "播放中..." : "播放"}
    </button>
  {/if}
</li>

<style>
  .word {
    transition: background 0.2s;
    padding: 0 2px;
  }
  .word.active {
    background: #ffe082;
    border-radius: 6px;
    box-shadow: 0 1px 4px 0 rgba(67, 198, 172, 0.1);
  }
  .eye-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1.1em;
    margin-left: 0.5em;
    vertical-align: middle;
  }
</style>
