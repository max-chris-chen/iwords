<script lang="ts">
  let { words, highlightedWordIndex, maskedSentence } = $props<{
    words: string[];
    highlightedWordIndex: number;
    maskedSentence: string;
  }>();

  let showSentence = $state(false);
</script>

<p class="sentence-text">
  {#if showSentence}
    {#each words as word, i}
      <span class:highlight={i === highlightedWordIndex}>{word}</span>
      {" "}
    {/each}
  {:else}
    {maskedSentence}
  {/if}
</p>

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
    >
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path
        d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"
      />
      <path
        d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"
      />
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
  .btn-reveal {
    margin: 0 auto;
  }
</style>
