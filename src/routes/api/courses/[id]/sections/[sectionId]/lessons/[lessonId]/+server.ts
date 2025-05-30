import { getDb } from "$lib/mongodb";
import type { RequestHandler } from "@sveltejs/kit";
import { ObjectId } from "mongodb";

// PATCH /api/courses/[id]/sections/[sectionId]/lessons/[lessonId]
export const PATCH: RequestHandler = async ({ params, locals, request }) => {
  try {
    if (!locals.user?._id) {
      return new Response("Unauthorized", { status: 401 });
    }
    const db = await getDb();
    let courseId: ObjectId;
    let sectionId: ObjectId;
    let lessonId: ObjectId;
    try {
      courseId = new ObjectId(params.id);
      sectionId = new ObjectId(params.sectionId);
      lessonId = new ObjectId(params.lessonId);
    } catch {
      return new Response("Invalid id", { status: 400 });
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
    const body = await request.json();
    const updateFields: Record<string, unknown> = {};
    if (typeof body.title === "string") updateFields["title"] = body.title;
    if (typeof body.content === "string") updateFields["content"] = body.content;
    if (typeof body.text === "string") updateFields["text"] = body.text;
    if (Array.isArray(body.sentences)) updateFields["sentences"] = body.sentences;
    const result = await db
      .collection("lessons")
      .updateOne({ _id: lessonId, sectionId }, { $set: updateFields });
    if (result.modifiedCount === 1) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } else {
      return new Response("Lesson not found or not updated", { status: 404 });
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to update lesson";
    return new Response(message, { status: 500 });
  }
};

// DELETE /api/courses/[id]/sections/[sectionId]/lessons/[lessonId]
export const DELETE: RequestHandler = async ({ params, locals }) => {
  try {
    if (!locals.user?._id) {
      return new Response("Unauthorized", { status: 401 });
    }
    const db = await getDb();
    let courseId: ObjectId;
    let sectionId: ObjectId;
    let lessonId: ObjectId;
    try {
      courseId = new ObjectId(params.id);
      sectionId = new ObjectId(params.sectionId);
      lessonId = new ObjectId(params.lessonId);
    } catch {
      return new Response("Invalid id", { status: 400 });
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
    const result = await db
      .collection("lessons")
      .deleteOne({ _id: lessonId, sectionId });
    if (result.deletedCount === 1) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } else {
      return new Response("Lesson not found or not deleted", { status: 404 });
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to delete lesson";
    return new Response(message, { status: 500 });
  }
};
