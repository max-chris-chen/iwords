<script lang="ts">
  import SentenceItem from "$lib/components/SentenceItem.svelte";
  import type { LessonSentence } from "$lib/models/course";
  let {
    sentences,
    mode,
    playingIdx,
    onPlay,
    updateLessonSentences,
    dictationInputs,
    dictationResults,
    dictationInputRefs,
    checkDictation,
    playKeySound,
  } = $props<{
    sentences: LessonSentence[];
    mode: "listen" | "read" | "dictation";
    playingIdx: number;
    onPlay: (idx: number) => void;
    updateLessonSentences: () => void;
    dictationInputs: string[][];
    dictationResults: (boolean | null)[];
    dictationInputRefs: Array<Array<HTMLInputElement | null>>;
    checkDictation: (idx: number) => void;
    playKeySound: () => void;
  }>();
</script>

<ul class="space-y-2">
  {#each sentences as s, i}
    <SentenceItem
      sentence={s}
      idx={i}
      {mode}
      {playingIdx}
      {onPlay}
      {updateLessonSentences}
      dictationInputs={dictationInputs[i]}
      dictationResult={dictationResults[i]}
      inputRefs={dictationInputRefs[i]}
      {checkDictation}
      {playKeySound}
      onInputChange={(wi: number, value: string) => {
        dictationInputs[i][wi] = value;
      }}
    />
  {/each}
</ul>
