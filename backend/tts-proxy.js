import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import fetch from 'node-fetch'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

const API_KEY = process.env.SPEECHIFY_API_KEY
if (!API_KEY) {
  throw new Error('SPEECHIFY_API_KEY environment variable is not set')
}

app.post('/api/tts', async (req, res) => {
  const { text, voice = 'kristy', output_format = 'mp3' } = req.body
  if (!text) return res.status(400).json({ error: 'Missing text' })
  try {
    const response = await fetch('https://api.sws.speechify.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        accept: 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        input: text,
        voice_id: voice,
        audio_format: output_format,
      }),
    })
    if (!response.ok) {
      const err = await response.text()
      return res.status(500).json({ error: 'Speechify error', detail: err })
    }
    const data = await response.json()
    res.json({ audio_data: data.audio_data, audio_format: data.audio_format })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// 获取可用 voice_id 的接口
app.get('/api/voices', async (req, res) => {
  try {
    const response = await fetch('https://api.sws.speechify.com/v1/voices', {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
    })
    if (!response.ok) {
      const err = await response.text()
      return res.status(500).json({ error: 'Speechify error', detail: err })
    }
    const data = await response.json()
    res.json(data)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log('TTS proxy server running on port', PORT)
})
