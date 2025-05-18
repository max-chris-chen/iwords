<script setup lang="ts">
import { ref } from 'vue'

const ttsService = {
  async getAudioUrl(text: string): Promise<string> {
    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text
      }),
    })
    if (!response.ok) throw new Error('TTS proxy failed')
    const data = await response.json()
    if (data.audioUrl) {
      return data.audioUrl
    } else if (data.audio_data && data.audio_format) {
      return `data:audio/${data.audio_format};base64,${data.audio_data}`
    } else {
      throw new Error('No audio data returned')
    }
  },
}

const props = defineProps<{
  text: string
}>()

const audio = ref<HTMLAudioElement | null>(null)
const loading = ref(false)

async function play() {
  loading.value = true
  try {
    const url = await ttsService.getAudioUrl(props.text)
    if (audio.value) {
      audio.value.src = url
      audio.value.play()
    }
  } catch (e) {
    console.error(e)
  }
  loading.value = false
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
