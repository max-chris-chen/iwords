import { CourseStatus, type Course } from "$lib/models/course";
import { getDb } from "$lib/mongodb";
import { getAuthenticatedUserId } from "$lib/server/auth";
import type { RequestHandler } from "@sveltejs/kit";

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const userId = getAuthenticatedUserId(locals);
    const db = await getDb();
    const data = await request.json();

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
