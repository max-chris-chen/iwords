import { SPEECHIFY_API_KEY } from '$env/static/private';
import { json } from '@sveltejs/kit';

export async function POST({ request }) {
  const { text, voice = 'kristy', output_format = 'mp3' } = await request.json();
  if (!text) return json({ error: 'Missing text' }, { status: 400 });

  const API_KEY =  SPEECHIFY_API_KEY;
  if (!API_KEY) return json({ error: 'SPEECHIFY_API_KEY not set' }, { status: 500 });

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
  });

  if (!response.ok) {
    const err = await response.text();
    return json({ error: 'Speechify error', detail: err }, { status: 500 });
  }
  const data = await response.json();
  return json({
    audio_data: data.audio_data,
    audio_format: data.audio_format,
    speech_marks: data.speech_marks,
  });
}
