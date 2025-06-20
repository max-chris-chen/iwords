<script lang="ts">
  import { onMount } from "svelte";

  let text = $state("");
  let playing = $state(false);
  let audio = $state<HTMLAudioElement | null>(null);
  let audioData = $state("");
  let audioFormat = $state("");
  let speechMarks = $state<{
    chunks?: {
      start_time: number;
      end_time: number;
      start: number;
      end: number;
    }[];
  } | null>(null);
  let currentWordIdx = $state(-1);
  let words = $state<{
    start_time: number;
    end_time: number;
    start: number;
    end: number;
  }[]>([]);
  let speed = $state(1.0);

  // 用户登录状态
  let user = $state<{
    username?: string;
    nickname?: string;
    avatarUrl?: string;
  } | null>(null);
  let loadingUser = $state(true);

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

  // 获取当前登录用户
  async function fetchUser() {
    loadingUser = true;
    try {
      const res = await fetch("/api/users/me");
      if (res.ok) {
        const data = await res.json();
        user = data.user;
      } else {
        user = null;
      }
    } catch {
      user = null;
    }
    loadingUser = false;
  }
  onMount(fetchUser);

  // 登出
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    user = null;
    await fetchUser();
  }

  // 未登录时不再自动跳转到 /login，仅提示
  // $: if (!loadingUser && !user) {
  //   goto('/login');
  // }
</script>

{#if loadingUser}
  <div>正在加载用户信息...</div>
{:else if !user}
  <div style="margin:2em 0;max-width:400px">
    <div style="color: #888; text-align: center;">请先登录后使用本功能</div>
    <div style="margin-top:1em; text-align:center;">
      <a href="/login" style="color: #1976d2; text-decoration: underline;"
        >前往登录</a
      >
      或
      <a href="/register" style="color: #1976d2; text-decoration: underline;"
        >注册新账号</a
      >
    </div>
  </div>
{:else}
  <div style="margin:2em 0;max-width:400px">
    <div>欢迎，{user.username || user.nickname}！</div>
    {#if user.avatarUrl}
      <img
        src={user.avatarUrl}
        alt="avatar"
        style="width:48px;height:48px;border-radius:50%"
      />
    {/if}
    <button on:click={logout}>登出</button>
  </div>
  <div>
    <textarea bind:value={text} rows="4" cols="50" placeholder="请输入英文..."
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
    <button on:click={synthesize} disabled={!text.trim() || playing}
      >合成</button
    >
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
