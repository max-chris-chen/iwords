import { getAuthenticatedUserId } from "$lib/server/auth";
import type { RequestHandler } from "@sveltejs/kit";
import { ObjectId } from "mongodb";
import {
  getCourseWithDetails,
  updateCourse,
  findCourseById,
} from "$lib/server/db/course";

export const GET: RequestHandler = async ({ params, locals }) => {
  try {
    const userId = getAuthenticatedUserId(locals);
    let courseId: ObjectId;
    try {
      courseId = new ObjectId(params.id);
    } catch {
      return new Response("Invalid course id", { status: 400 });
    }
    const courseWithDetails = await getCourseWithDetails(courseId, userId);
    if (!courseWithDetails) {
      return new Response("Not found", { status: 404 });
    }
    // 返回 course + sections + lessons
    return new Response(JSON.stringify(courseWithDetails), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to fetch course";
    return new Response(message, { status: 500 });
  }
};

export const PUT: RequestHandler = async ({ params, locals, request }) => {
  try {
    const userId = new ObjectId(getAuthenticatedUserId(locals));
    let courseId: ObjectId;
    try {
      courseId = new ObjectId(params.id);
    } catch {
      return new Response("Invalid course id", { status: 400 });
    }
    const course = await findCourseById(courseId, userId);
    if (!course) {
      return new Response("Not found", { status: 404 });
    }
    const body = await request.json();
    const result = await updateCourse(courseId, userId, body);
    if (result.modifiedCount === 1) {
      const updatedCourse = await findCourseById(courseId, userId);
      return new Response(JSON.stringify(updatedCourse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } else if (result.matchedCount === 1 && result.modifiedCount === 0) {
      const course = await findCourseById(courseId, userId);
      return new Response(JSON.stringify(course), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } else {
      return new Response("Course not found or not updated", { status: 404 });
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to update course";
    return new Response(message, { status: 500 });
  }
};
