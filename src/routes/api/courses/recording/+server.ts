import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import fs from "fs/promises";
import path from "path";
import { env } from "$env/dynamic/private";
import { getDb } from "$lib/mongodb";
import { ObjectId } from "mongodb";

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const user = locals.user;
    if (!user) {
      return json({ message: "Not authenticated." }, { status: 401 });
    }

    const formData = await request.formData();
    const audioFile = formData.get("audio");
    const courseId = formData.get("courseId") as string;
    const lessonId = formData.get("lessonId") as string;
    const sentenceId = formData.get("sentenceId") as string;
    const durationStr = formData.get("duration") as string;
    const duration = durationStr ? parseFloat(durationStr) : 0;

    if (
      !audioFile ||
      !(audioFile instanceof File) ||
      !lessonId ||
      !sentenceId ||
      !courseId
    ) {
      return json(
        {
          message:
            "Invalid request data. Audio file, courseId, lessonId, and sentenceId are required.",
        },
        { status: 400 },
      );
    }

    // Security: Validate file type and size
    if (audioFile.type !== "audio/webm") {
      return json({ message: "Invalid file type. Only audio/webm is accepted." }, { status: 400 });
    }
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
    if (audioFile.size > MAX_FILE_SIZE) {
      return json({ message: `File size exceeds the limit of ${MAX_FILE_SIZE / 1024 / 1024} MB.` }, { status: 400 });
    }

    const audioBuffer = Buffer.from(await audioFile.arrayBuffer());

    const audioDir = env.AUDIO_DIR;
    if (!audioDir) {
      console.error("AUDIO_DIR environment variable is not set.");
      return json(
        { message: "Server is not configured for file uploads." },
        { status: 500 },
      );
    }

    const recordingsPath = path.join(audioDir, "recordings");
    await fs.mkdir(recordingsPath, { recursive: true });

    const fileName = `u${user._id}_c${courseId}_l${lessonId}_s${sentenceId}_${Date.now()}.webm`;
    const filePath = path.join(recordingsPath, fileName);
    const relativePath = path.join("recordings", fileName);

    await fs.writeFile(filePath, audioBuffer);

    console.log(`Recording saved to ${filePath}`);

    // Now, insert into the new collection
    const db = await getDb();
    const recordingsCollection = db.collection("user_recordings");

    const newRecording = {
      userId: new ObjectId(user._id),
      lessonId: new ObjectId(lessonId),
      sentenceId: new ObjectId(sentenceId),
      recordingUrl: relativePath,
      createdAt: new Date(),
      duration: duration,
      mimeType: "audio/webm",
    };

    const result = await recordingsCollection.insertOne(newRecording);

    return json(
      {
        message: "Recording submitted and path saved successfully!",
        filePath: relativePath,
        insertedId: result.insertedId,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error processing recording submission:", error);
    return json(
      { message: "Failed to process the recording." },
      { status: 500 },
    );
  }
};
