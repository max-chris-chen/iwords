import { getDb } from "$lib/mongodb";
import type { RequestHandler } from "@sveltejs/kit";
import { ObjectId } from "mongodb";

// PATCH /api/courses/[id]/sections/[sectionId]
export const PATCH: RequestHandler = async ({ params, locals, request }) => {
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
      return new Response("Invalid id", { status: 400 });
    }
    const course = await db
      .collection("courses")
      .findOne({ _id: courseId, user: locals.user._id });
    if (!course) {
      return new Response("Not found", { status: 404 });
    }
    const body = await request.json();
    const updateFields: Record<string, unknown> = {};
    if (typeof body.title === "string")
      updateFields["sections.$.title"] = body.title;
    // 可扩展更多字段
    const result = await db
      .collection("courses")
      .updateOne(
        { _id: courseId, "sections._id": sectionId },
        { $set: updateFields },
      );
    if (result.modifiedCount === 1) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } else {
      return new Response("Section not found or not updated", { status: 404 });
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to update section";
    return new Response(message, { status: 500 });
  }
};

// DELETE /api/courses/[id]/sections/[sectionId]
export const DELETE: RequestHandler = async ({ params, locals }) => {
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
      return new Response("Invalid id", { status: 400 });
    }
    const course = await db
      .collection("courses")
      .findOne({ _id: courseId, user: locals.user._id });
    if (!course) {
      return new Response("Not found", { status: 404 });
    }
    const result = await db
      .collection("courses")
      .updateOne(
        { _id: courseId },
        { $pull: { sections: { _id: sectionId } } },
      );
    if (result.modifiedCount === 1) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } else {
      return new Response("Section not found or not deleted", { status: 404 });
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to delete section";
    return new Response(message, { status: 500 });
  }
};
