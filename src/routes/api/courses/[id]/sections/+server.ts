import { getAuthenticatedUserId } from "$lib/server/auth";
import { getDb } from "$lib/mongodb";
import type { RequestHandler } from "@sveltejs/kit";
import { ObjectId } from "mongodb";

// POST /api/courses/[id]/sections
export const POST: RequestHandler = async ({ params, locals, request }) => {
  try {
    const userId = getAuthenticatedUserId(locals);
    const db = await getDb();
    let courseId: ObjectId;
    try {
      courseId = new ObjectId(params.id);
    } catch {
      return new Response("Invalid course id", { status: 400 });
    }
    const course = await db
      .collection("courses")
      .findOne({ _id: courseId, user: userId });
    if (!course) {
      return new Response("Not found", { status: 404 });
    }
    const body = await request.json();
    if (!body.title || typeof body.title !== "string" || !body.title.trim()) {
      return new Response("Section title required", { status: 400 });
    }
    const section = {
      _id: new ObjectId(),
      courseId: courseId,
      title: body.title,
    };
    await db.collection("sections").insertOne(section);
    return new Response(JSON.stringify(section), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to add section";
    return new Response(message, { status: 500 });
  }
};
