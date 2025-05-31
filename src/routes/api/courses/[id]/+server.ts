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

// Add this new handler for lesson creation under a section
export const POST: RequestHandler = async ({
  params,
  locals,
  request,
  url,
}) => {
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
    // RESTful: /api/courses/:id/sections/:sectionId/lessons
    const pathname = url.pathname;
    const lessonMatch = pathname.match(
      /\/api\/courses\/([\w-]+)\/sections\/([\w-]+)\/lessons$/,
    );
    if (lessonMatch) {
      const sectionId = lessonMatch[2];
      const body = await request.json();
      if (!body.title || typeof body.title !== "string") {
        return new Response("Lesson title required", { status: 400 });
      }
      const lesson = {
        _id: new ObjectId(),
        title: body.title,
        content: body.content || "",
        text: body.text || "",
        sentences: body.sentences || [],
      };
      await db
        .collection("courses")
        .updateOne(
          { _id: courseId, "sections._id": new ObjectId(sectionId) },
          { $push: { "sections.$.lessons": lesson } },
        );
      return new Response(JSON.stringify(lesson), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    }
    const body = await request.json();
    if (body.section) {
      // Add section
      const section = {
        _id: new ObjectId(),
        title: body.section.title,
        lessons: [],
      };
      await db.collection("courses").updateOne({ _id: courseId }, {
        $push: { sections: section },
      } as import("mongodb").UpdateFilter<import("mongodb").Document>);
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
        text: body.lesson.text || "",
        sentences: body.lesson.sentences || [],
      };
      await db
        .collection("courses")
        .updateOne(
          { _id: courseId, "sections._id": new ObjectId(body.sectionId) },
          {
            $push: { "sections.$.lessons": lesson },
          } as import("mongodb").UpdateFilter<import("mongodb").Document>,
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

export const PUT: RequestHandler = async ({ params, locals, request }) => {
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
    // Section update
    if (body.sectionId && typeof body.title === "string") {
      const sectionObjectId = new ObjectId(body.sectionId);
      const result = await db
        .collection("courses")
        .updateOne(
          { _id: courseId, "sections._id": sectionObjectId },
          { $set: { "sections.$.title": body.title } },
        );
      if (result.modifiedCount === 1) {
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      } else {
        return new Response("Section not found or not updated", {
          status: 404,
        });
      }
    }
    // Section delete
    if (body.deleteSectionId) {
      const sectionObjectId = new ObjectId(body.deleteSectionId);
      const result = await db
        .collection("courses")
        .updateOne({ _id: courseId, user: locals.user._id }, {
          $pull: { sections: { _id: sectionObjectId } },
        } as unknown as import("mongodb").UpdateFilter<
          import("mongodb").Document
        >);
      if (result.modifiedCount === 1) {
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      } else {
        return new Response("Section not found or not deleted", {
          status: 404,
        });
      }
    }
    // Lesson update (edit)
    if (body.editLesson && body.sectionId && body.lessonId) {
      const sectionObjectId = new ObjectId(body.sectionId);
      const lessonObjectId = new ObjectId(body.lessonId);
      const updateFields: Record<string, unknown> = {};
      if (typeof body.editLesson.title === "string")
        updateFields["sections.$[section].lessons.$[lesson].title"] =
          body.editLesson.title;
      if (typeof body.editLesson.content === "string")
        updateFields["sections.$[section].lessons.$[lesson].content"] =
          body.editLesson.content;
      const result = await db.collection("courses").updateOne(
        { _id: courseId },
        { $set: updateFields },
        {
          arrayFilters: [
            { "section._id": sectionObjectId },
            { "lesson._id": lessonObjectId },
          ],
        },
      );
      if (result.modifiedCount === 1) {
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      } else {
        return new Response("Lesson not found or not updated", { status: 404 });
      }
    }
    const update: Record<string, unknown> = {};
    if (typeof body.title === "string") update.title = body.title;
    if (typeof body.coverImage === "string")
      update.coverImage = body.coverImage;
    if (typeof body.description === "string")
      update.description = body.description;
    if (typeof body.isPublic === "boolean") update.isPublic = body.isPublic;
    update.updatedAt = new Date();
    await db
      .collection("courses")
      .updateOne({ _id: courseId, user: locals.user._id }, { $set: update });
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to update course";
    return new Response(message, { status: 500 });
  }
};
