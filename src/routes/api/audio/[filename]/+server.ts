import { AUDIO_DIR } from "$env/static/private";
import type { RequestHandler } from "@sveltejs/kit";
import fs from "fs";
import { Readable } from "node:stream";
import path from "path";

export const GET: RequestHandler = async ({ params }) => {
  const filename = params.filename;
  if (!filename || filename.includes("..") || filename.includes("/")) {
    return new Response("Invalid filename", { status: 400 });
  }
  const filePath = path.join(AUDIO_DIR, filename);
  try {
    await fs.promises.access(filePath, fs.constants.R_OK);
    const stat = await fs.promises.stat(filePath);
    const stream = fs.createReadStream(filePath);
    return new Response(Readable.toWeb(stream), {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": stat.size.toString(),
        "Accept-Ranges": "bytes",
      },
    });
  } catch {
    return new Response("Audio file not found", { status: 404 });
  }
};
