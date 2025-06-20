import { getAuthenticatedUserId } from "$lib/server/auth";
import { getDb } from "$lib/mongodb";
import type { RequestHandler } from "@sveltejs/kit";
import { ObjectId } from "mongodb";
import { CourseStatus } from "$lib/models/course";

export const GET: RequestHandler = async ({ params, locals }) => {
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
    // 查询所有 section
    const sections = await db
      .collection("sections")
      .find({ courseId })
      .toArray();
    // 查询所有 lesson
    const sectionIds = sections.map((s) => s._id);
    const lessons =
      sectionIds.length > 0
        ? await db
            .collection("lessons")
            .find({ sectionId: { $in: sectionIds } })
            .toArray()
        : [];
    // 挂载 lessons 到 section
    const sectionsWithLessons = sections.map((section) => ({
      ...section,
      lessons: lessons.filter(
        (l) => l.sectionId?.toString() === section._id.toString(),
      ),
    }));
    // 返回 course + sections + lessons
    return new Response(
      JSON.stringify({ ...course, sections: sectionsWithLessons }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
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
        .updateOne({ _id: courseId, user: userId }, {
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
        { _id: courseId, user: userId },
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

    // This part handles top-level course property updates
    const update: Record<string, unknown> = {};
    if (body.title !== undefined) update.title = body.title;
    if (body.coverImage !== undefined) update.coverImage = body.coverImage;
    if (body.description !== undefined) update.description = body.description;
    if (body.isPublic !== undefined) update.isPublic = body.isPublic;
    if (
      body.status !== undefined &&
      Object.values(CourseStatus).includes(body.status)
    ) {
      update.status = body.status;
    }

    update.updatedAt = new Date();
    if (Object.keys(update).length > 1) {
      const result = await db
        .collection("courses")
        .updateOne({ _id: courseId, user: userId }, { $set: update });

      if (result.modifiedCount === 1) {
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      } else {
        return new Response("Course not found or not updated", { status: 404 });
      }
    } else {
      return new Response(JSON.stringify({ message: "No fields to update" }), {
        status: 200,
      });
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to update course";
    return new Response(message, { status: 500 });
  }
};
