<script lang="ts">
  import DictationInput from './DictationInput.svelte';
  export let sentence: any;
  export let idx: number;
  export let mode: 'listen' | 'read' | 'dictation';
  export let playingIdx: number;
  export let onPlay: (idx: number) => void;
  export let updateLessonSentences: () => void;
  export let dictationInputs: string[];
  export let dictationResult: boolean | null;
  export let inputRefs: (HTMLInputElement | null)[];
  export let checkDictation: (idx: number) => void;
  export let playKeySound: () => void;
  export let onInputChange: (wi: number, value: string) => void;
</script>

<li class="border rounded p-3 flex flex-col gap-2">
  <div style="margin-top:0.5em;font-size:1.1em">
    {#if mode === 'listen'}
      {#if sentence.caption && Array.isArray(sentence.caption.chunks)}
        {#if !sentence._showText}
          {#each sentence.caption.chunks as w, wi}
            <span class="word">{'*'.repeat(sentence.text.slice(w.start, w.end).length)}</span>
          {/each}
          <button class="eye-btn" on:click={() => { sentence._showText = true; updateLessonSentences(); }} title="显示原文">👁</button>
        {:else}
          {#each sentence.caption.chunks as w, wi}
            <span class="word">{sentence.text.slice(w.start, w.end)}</span>
          {/each}
          <button class="eye-btn" on:click={() => { sentence._showText = false; updateLessonSentences(); }} title="隐藏原文">🙈</button>
        {/if}
      {:else}
        {#if !sentence._showText}
          {'*'.repeat(sentence.text.length)}
          <button class="eye-btn" on:click={() => { sentence._showText = true; updateLessonSentences(); }} title="显示原文">👁</button>
        {:else}
          {sentence.text}
          <button class="eye-btn" on:click={() => { sentence._showText = false; updateLessonSentences(); }} title="隐藏原文">🙈</button>
        {/if}
      {/if}
    {:else if mode === 'read'}
      {#if sentence.caption && Array.isArray(sentence.caption.chunks)}
        {#each sentence.caption.chunks as w, wi}
          <span class="word {sentence._currentWordIdx === wi ? 'active' : ''}">{sentence.text.slice(w.start, w.end)}</span>
        {/each}
      {:else}
        {sentence.text}
      {/if}
    {:else if mode === 'dictation'}
      <DictationInput
        {sentence}
        sentenceIdx={idx}
        dictationInputs={dictationInputs}
        dictationResult={dictationResult}
        inputRefs={inputRefs}
        onInputChange={onInputChange}
        onCheck={() => checkDictation(idx)}
        onPlayKeySound={playKeySound}
      />
    {/if}
  </div>
  {#if sentence.audioUrl}
    <button on:click={() => onPlay(idx)} disabled={playingIdx === idx}>
      {playingIdx === idx ? '播放中...' : '播放'}
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
    box-shadow: 0 1px 4px 0 rgba(67,198,172,0.10);
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