import { getDb } from "$lib/mongodb";
import type { RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = async ({ locals }) => {
  try {
    if (!locals.user?._id) {
      return new Response("Unauthorized", { status: 401 });
    }
    const db = await getDb();
    const courses = await db
      .collection("courses")
      .find({ user: locals.user._id })
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
