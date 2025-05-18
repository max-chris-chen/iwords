<script setup lang="ts">
import { ref } from 'vue';

// TTS Service interface
interface TTSService {
  getAudioUrl(text: string): Promise<string>;
}

// Youdao TTS implementation (default)
class YoudaoTTS implements TTSService {
  async getAudioUrl(text: string): Promise<string> {
    // Youdao TTS API (public, for demo; production should use server proxy)
    // Example: http://dict.youdao.com/dictvoice?audio=hello&type=2
    return `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(text)}&type=2`;
  }
}

// Service registry for extensibility
const ttsServices: Record<string, TTSService> = {
  youdao: new YoudaoTTS(),
  // baidu: new BaiduTTS(),
  // xunfei: new XunfeiTTS(),
};

const props = defineProps<{
  text: string;
  service?: 'youdao' | 'baidu' | 'xunfei';
}>();

const audio = ref<HTMLAudioElement | null>(null);
const loading = ref(false);

async function play() {
  loading.value = true;
  const service = ttsServices[props.service || 'youdao'];
  const url = await service.getAudioUrl(props.text);
  if (audio.value) {
    audio.value.src = url;
    audio.value.play();
  }
  loading.value = false;
}
</script>

<template>
  <div class="tts-player">
    <span>{{ text }}</span>
    <button :disabled="loading" @click="play">🔊 播放</button>
    <audio ref="audio" />
  </div>
</template>

<style scoped>
.tts-player {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
