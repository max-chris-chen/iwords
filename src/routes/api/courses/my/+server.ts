import { getDb } from "$lib/mongodb";
import { getAuthenticatedUserId } from "$lib/server/auth";
import type { RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = async ({ locals }) => {
  try {
    const userId = getAuthenticatedUserId(locals);

    const db = await getDb();
    const courses = await db
      .collection("courses")
      .find({ user: userId })
      .sort({ createdAt: -1 })
      .toArray();
    return new Response(JSON.stringify(courses), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(e.message || "Failed to fetch courses", {
      status: 500,
    });
  }
};
