<script lang="ts">
  import { preventDefault, handlers } from "svelte/legacy";

  import type { LessonSentence } from "$lib/models/course";

  let {
    sentence,
    dictationInputs,
    dictationResult,
    inputRefs,
    onInputChange,
    onCheck,
    onPlayKeySound,
  } = $props<{
    sentence: LessonSentence;
    dictationInputs: string[];
    dictationResult: boolean | null;
    inputRefs: (HTMLInputElement | null)[];
    onInputChange: (wi: number, value: string) => void;
    onCheck: () => void;
    onPlayKeySound: () => void;
  }>();

  // stripPunct 用于高亮错误
  function stripPunct(str: string) {
    return str.replace(/[-\uffff\p{P}\p{S}]/gu, "");
  }

  function handleKeydown(e: KeyboardEvent, wi: number) {
    if (e.key === " ") {
      e.preventDefault();
      const next = inputRefs[wi + 1];
      if (next) {
        onInputChange(wi + 1, "");
        next.value = "";
        next.focus();
      }
    } else if (e.key === "Backspace") {
      const currInput = inputRefs[wi];
      if (currInput && currInput.value === "" && wi > 0) {
        e.preventDefault();
        const prev = inputRefs[wi - 1];
        if (prev) {
          prev.focus();
          const len = prev.value.length;
          prev.setSelectionRange(len, len);
        }
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      onCheck();
    }
  }
</script>

{#if sentence.caption && Array.isArray(sentence.caption.chunks)}
  <form
    class="dictation-form"
    autocomplete="off"
    onsubmit={preventDefault(onCheck)}
  >
    {#each sentence.caption.chunks as w, wi}
      <input
        type="text"
        class="dict-word-input"
        bind:this={inputRefs[wi]}
        bind:value={dictationInputs[wi]}
        style="width: {sentence.text.slice(w.start, w.end).length +
          2}ch; border: none; border-bottom: 2px solid #888; background: none; text-align: center; margin: 0 2px; font-size: 1.1em; letter-spacing: 2px; outline: none; padding: 2px 0;"
        autocomplete="off"
        onkeydown={(e) => handleKeydown(e, wi)}
        oninput={handlers(onPlayKeySound, (e) =>
          onInputChange(wi, (e.target as HTMLInputElement).value),
        )}
      />
      {#if wi < sentence.caption.chunks.length - 1}
        {#if sentence.text.slice(sentence.caption.chunks[wi].end, sentence.caption.chunks[wi + 1].start)}
          <span
            >{sentence.text.slice(
              sentence.caption.chunks[wi].end,
              sentence.caption.chunks[wi + 1].start,
            )}</span
          >
        {/if}
      {/if}
    {/each}
  </form>
  {#if dictationResult !== null}
    {#if dictationResult}
      <span style="color:green">✔ 正确</span>
    {:else}
      <span style="color:red">✘ 拼写错误：</span>
      {#each sentence.caption.chunks as w, wi}
        {#if stripPunct(dictationInputs[wi]
            ?.trim()
            .toLowerCase()) !== stripPunct(sentence.text
              .slice(w.start, w.end)
              .toLowerCase())}
          <span style="color:red">{sentence.text.slice(w.start, w.end)}</span>
        {:else}
          <span>{sentence.text.slice(w.start, w.end)}</span>
        {/if}
        {sentence.text.slice(w.end, sentence.caption.chunks[wi + 1]?.start)}
      {/each}
    {/if}
  {/if}
{:else}
  <input
    type="text"
    bind:value={dictationInputs[0]}
    placeholder="请听写..."
    style="width:80%"
    oninput={handlers(onPlayKeySound, (e) =>
      onInputChange(0, (e.target as HTMLInputElement).value),
    )}
  />
  <button onclick={onCheck} disabled={dictationResult !== null}>提交</button>
  {#if dictationResult !== null}
    {#if dictationResult}
      <span style="color:green">✔ 正确</span>
    {:else}
      <span style="color:red">✘ 拼写错误，正确答案：{sentence.text}</span>
    {/if}
  {/if}
{/if}

<style>
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
