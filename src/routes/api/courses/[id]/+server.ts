import { getDb } from "$lib/mongodb";
import type { RequestHandler } from "@sveltejs/kit";
import { ObjectId } from "mongodb";

export const GET: RequestHandler = async ({ params, locals }) => {
  try {
    if (!locals.user?._id) {
      return new Response("Unauthorized", { status: 401 });
    }
    const db = await getDb();
    let courseId: ObjectId;
    try {
      courseId = new ObjectId(params.id);
    } catch {
      return new Response("Invalid course id", { status: 400 });
    }
    const course = await db
      .collection("courses")
      .findOne({ _id: courseId, user: locals.user._id });
    if (!course) {
      return new Response("Not found", { status: 404 });
    }
    return new Response(JSON.stringify(course), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to fetch course";
    return new Response(message, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ params, locals, request }) => {
  try {
    if (!locals.user?._id) {
      return new Response("Unauthorized", { status: 401 });
    }
    const db = await getDb();
    let courseId: ObjectId;
    try {
      courseId = new ObjectId(params.id);
    } catch {
      return new Response("Invalid course id", { status: 400 });
    }
    const course = await db
      .collection("courses")
      .findOne({ _id: courseId, user: locals.user._id });
    if (!course) {
      return new Response("Not found", { status: 404 });
    }
    const body = await request.json();
    if (body.section) {
      // Add section
      const section = {
        _id: new ObjectId(),
        title: body.section.title,
        lessons: [],
      };
      await db
        .collection("courses")
        .updateOne({ _id: courseId }, { $push: { sections: section } } as any);
      return new Response(JSON.stringify(section), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    } else if (body.lesson && body.sectionId) {
      // Add lesson to section
      const lesson = {
        _id: new ObjectId(),
        title: body.lesson.title,
        content: body.lesson.content || "",
      };
      await db
        .collection("courses")
        .updateOne(
          { _id: courseId, "sections._id": new ObjectId(body.sectionId) },
          { $push: { "sections.$.lessons": lesson } } as any,
        );
      return new Response(JSON.stringify(lesson), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    } else {
      return new Response("Invalid request body", { status: 400 });
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to update course";
    return new Response(message, { status: 500 });
  }
};
