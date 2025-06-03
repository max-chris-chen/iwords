import { splitTextToSentences } from "$lib/ai";
import type { CaptionChunk } from "$lib/models/course";
import { getDb } from "$lib/mongodb";
import type { RequestHandler } from "@sveltejs/kit";
import { ObjectId } from "mongodb";

// POST /api/courses/[id]/sections/[sectionId]/lessons
export const POST: RequestHandler = async ({ params, locals, request }) => {
  try {
    if (!locals.user?._id) {
      return new Response("Unauthorized", { status: 401 });
    }
    const db = await getDb();
    let courseId: ObjectId;
    let sectionId: ObjectId;
    try {
      courseId = new ObjectId(params.id);
      sectionId = new ObjectId(params.sectionId);
    } catch {
      return new Response("Invalid course or section id", { status: 400 });
    }
    // 校验课程归属
    const course = await db
      .collection("courses")
      .findOne({ _id: courseId, user: locals.user._id });
    if (!course) {
      return new Response("Not found", { status: 404 });
    }
    // 校验 section 归属
    const section = await db
      .collection("sections")
      .findOne({ _id: sectionId, courseId });
    if (!section) {
      return new Response("Section not found", { status: 404 });
    }
    const body = (await request.json()) as {
      title: string;
      content?: string;
      sentences?: { text: string }[];
    };
    if (!body.title || typeof body.title !== "string") {
      return new Response("Lesson title required", { status: 400 });
    }
    // AI 拆句
    let sentences: {
      text: string;
      audioUrl?: string;
      caption?: CaptionChunk;
    }[] = [];
    if (
      body.content &&
      typeof body.content === "string" &&
      body.content.trim()
    ) {
      try {
        const arr = await splitTextToSentences(body.content);
        sentences = arr.map((t: string) => ({ text: t }));
      } catch (err) {
        // AI 失败不阻断主流程
        console.error("DeepSeek splitTextToSentences error:", err);
        sentences = [];
      }
    }

    // sentences 不为空则调用 tts
    if (sentences.length > 0) {
      const { textToSpeech } = await import("$lib/ai");
      for (const s of sentences) {
        try {
          const ttsRes = await textToSpeech(s.text);
          s.audioUrl = ttsRes.audioUrl; // 只存储文件路径
          if (ttsRes.speech_marks) {
            try {
              s.caption =
                typeof ttsRes.speech_marks === "string"
                  ? JSON.parse(ttsRes.speech_marks)
                  : ttsRes.speech_marks;
            } catch {
              s.caption = undefined;
            }
          }
        } catch (err) {
          console.error("TTS error for sentence:", s.text, err);
        }
      }
    }

    const lesson = {
      _id: new ObjectId(),
      sectionId: sectionId,
      title: body.title,
      content: body.content || "",
      // text 字段移除，避免类型错误
      sentences,
    };
    await db.collection("lessons").insertOne(lesson);
    return new Response(JSON.stringify(lesson), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to add lesson";
    return new Response(message, { status: 500 });
  }
};
