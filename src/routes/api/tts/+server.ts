import { textToSpeech } from "$lib/ai";
import { json } from "@sveltejs/kit";

export async function POST({ request }) {
  const {
    text,
    voice = "kristy",
    output_format = "mp3",
  } = await request.json();
  if (!text) return json({ error: "Missing text" }, { status: 400 });

  try {
    const data = await textToSpeech(text, { voice, output_format });
    return json(data);
  } catch (err) {
    return json({ error: "Speechify error", detail: String(err) }, { status: 500 });
  }
}
