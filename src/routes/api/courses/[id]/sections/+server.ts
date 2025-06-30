import { getAuthenticatedUserId } from "$lib/server/auth";
import type { RequestHandler } from "@sveltejs/kit";
import { ObjectId } from "mongodb";
import { createSection } from "$lib/server/db/section";

// POST /api/courses/[id]/sections
export const POST: RequestHandler = async ({ params, locals, request }) => {
  try {
    const userId = getAuthenticatedUserId(locals);
    let courseId: ObjectId;
    try {
      courseId = new ObjectId(params.id);
    } catch {
      return new Response("Invalid course id", { status: 400 });
    }
    const body = await request.json();
    if (!body.title || typeof body.title !== "string" || !body.title.trim()) {
      return new Response("Section title required", { status: 400 });
    }
    const section = await createSection(courseId, userId, body.title.trim());
    if (!section) {
      return new Response("Not found", { status: 404 });
    }
    return new Response(JSON.stringify(section), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to add section";
    return new Response(message, { status: 500 });
  }
};
