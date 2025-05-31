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
    const course = await db
      .collection("courses")
      .findOne({ _id: courseId, user: locals.user._id });
    if (!course) {
      return new Response("Not found", { status: 404 });
    }
    const body = await request.json();
    if (!body.title || typeof body.title !== "string") {
      return new Response("Lesson title required", { status: 400 });
    }
    const lesson = {
      _id: new ObjectId(),
      title: body.title,
      content: body.content || "",
      text: body.text || "",
      sentences: body.sentences || [],
    };
    await db
      .collection("courses")
      .updateOne(
        { _id: courseId, "sections._id": sectionId },
        { $push: { "sections.$.lessons": lesson } },
      );
    return new Response(JSON.stringify(lesson), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to add lesson";
    return new Response(message, { status: 500 });
  }
};
