import { json } from "@sveltejs/kit";

export async function GET() {
  const API_KEY = process.env.SPEECHIFY_API_KEY;
  if (!API_KEY)
    return json({ error: "SPEECHIFY_API_KEY not set" }, { status: 500 });

  const response = await fetch("https://api.sws.speechify.com/v1/voices", {
    method: "GET",
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
  });

  if (!response.ok) {
    const err = await response.text();
    return json({ error: "Speechify error", detail: err }, { status: 500 });
  }
  const data = await response.json();
  return json(data);
}
