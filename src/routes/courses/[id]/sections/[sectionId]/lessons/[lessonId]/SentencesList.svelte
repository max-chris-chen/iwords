<script lang="ts">
  import SentenceItem from './SentenceItem.svelte';
  import type { Sentence } from './types'; // 如果没有types文件可用any替代
  export let sentences: Sentence[];
  export let mode: 'listen' | 'read' | 'dictation';
  export let playingIdx: number;
  export let onPlay: (idx: number) => void;
  export let updateLessonSentences: () => void;
  export let dictationInputs: string[][];
  export let dictationResults: (boolean | null)[];
  export let dictationInputRefs: Array<Array<HTMLInputElement | null>>;
  export let checkDictation: (idx: number) => void;
  export let playKeySound: () => void;
</script>

<ul class="space-y-2">
  {#each sentences as s, i}
    <SentenceItem
      sentence={s}
      idx={i}
      mode={mode}
      playingIdx={playingIdx}
      onPlay={onPlay}
      updateLessonSentences={updateLessonSentences}
      dictationInputs={dictationInputs[i]}
      dictationResult={dictationResults[i]}
      inputRefs={dictationInputRefs[i]}
      checkDictation={checkDictation}
      playKeySound={playKeySound}
      onInputChange={(wi: number, value: string) => { dictationInputs[i][wi] = value; }}
    />
  {/each}
</ul> 