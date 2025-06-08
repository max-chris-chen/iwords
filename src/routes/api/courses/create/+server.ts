import { CourseStatus, type Course } from "$lib/models/course";
import { getDb } from "$lib/mongodb";
import type { RequestHandler } from "@sveltejs/kit";

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const db = await getDb();
    const data = await request.json();

    // 这里假设已登录用户ID在 locals.user._id
    const userId = locals.user?._id || data.user || null;
    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    const now = new Date();
    const course: Course = {
      ...data,
      user: userId,
      status: data.status || CourseStatus.Draft,
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection("courses").insertOne(course);
    const newCourse = { ...course, _id: result.insertedId };

    return new Response(JSON.stringify(newCourse), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(e.message || "Failed to create course", {
      status: 500,
    });
  }
};
