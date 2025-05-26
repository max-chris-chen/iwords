<script lang="ts">
  let text = "";
  let playing = false;
  let audio: HTMLAudioElement | null = null;
  let audioData = "";
  let audioFormat = "";
  let speechMarks: any = null;
  let currentWordIdx = -1;
  let words: any[] = [];
  let speed = 1.0;

  async function synthesize() {
    playing = false;
    audioData = "";
    audioFormat = "";
    speechMarks = null;
    currentWordIdx = -1;
    words = [];
    if (!text.trim()) return;
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const data = await res.json();
    if (data.audio_data) {
      audioData = data.audio_data;
      audioFormat = data.audio_format;
      speechMarks = data.speech_marks;
      words = speechMarks?.chunks || [];
    }
  }

  function play() {
    if (!audioData) return;
    if (audio) {
      audio.pause();
      audio = null;
    }
    const src = `data:audio/${audioFormat};base64,${audioData}`;
    audio = new Audio(src);
    audio.playbackRate = speed; // 设置播放速度
    playing = true;
    currentWordIdx = -1;
    if (words.length) {
      audio.ontimeupdate = () => {
        // Corrected time calculation: audio.currentTime is already the effective time
        // on the 1.0x speed timeline. Convert to milliseconds.
        const effectiveTimeMs = audio!.currentTime * 1000;
        let idx = words.findIndex(
          (w) =>
            effectiveTimeMs >= w.start_time && effectiveTimeMs < w.end_time,
        );
        if (idx !== -1 && idx !== currentWordIdx) {
          currentWordIdx = idx;
        }
      };
      audio.onended = () => {
        playing = false;
        currentWordIdx = -1;
      };
    }
    audio.play();
  }

  // 动态更新播放速度的函数
  function updatePlaybackSpeed() {
    if (audio && playing) {
      audio.playbackRate = speed;
    }
  }
</script>

<div>
  <textarea bind:value={text} rows="4" cols="50" placeholder="Enter text..."
  ></textarea>
  <div style="margin: 10px 0;">
    <label for="speed">播放速度: </label>
    <select id="speed" bind:value={speed} on:change={updatePlaybackSpeed}>
      <option value={0.5}>0.5x (慢)</option>
      <option value={0.75}>0.75x</option>
      <option value={1.0}>1.0x (正常)</option>
      <option value={1.25}>1.25x</option>
      <option value={1.5}>1.5x (快)</option>
      <option value={2.0}>2.0x (很快)</option>
    </select>
  </div>
  <button on:click={synthesize} disabled={!text.trim() || playing}>合成</button>
  <button on:click={play} disabled={!audioData || playing}>播放</button>
</div>

{#if text}
  <div style="margin-top:1em;font-size:1.2em">
    {#if words.length}
      {#each words as w, i}
        <span class="word {i === currentWordIdx ? 'active' : ''}"
          >{text.slice(w.start, w.end)}</span
        >
      {/each}
    {:else}
      {text}
    {/if}
  </div>
{/if}

<style>
  /* 简洁基础样式 */
  .word {
    transition: background 0.2s;
    padding: 0 2px;
  }
  .word.active {
    background: yellow;
  }
</style>
