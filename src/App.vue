<template>
  <header>
    <div class="wrapper">
      Hello world
      <textarea
        v-model="inputText"
        rows="4"
        cols="40"
        placeholder="请输入英文内容..."
        style="margin-bottom: 8px; display: block"
      ></textarea>
      <EnglishTTSPlayer :text="inputText" />
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import EnglishTTSPlayer from './components/EnglishTTSPlayer.vue'

const inputText = ref('My bed is')
</script>
