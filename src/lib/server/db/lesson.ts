import { getDb } from "$lib/mongodb";
import { ObjectId } from "mongodb";

export async function deleteLessonsBySectionId(sectionId: ObjectId) {
  const db = await getDb();
  return await db.collection("lessons").deleteMany({ sectionId: sectionId });
}

export async function updateLesson(
  lessonId: ObjectId,
  sectionId: ObjectId,
  courseId: ObjectId,
  userId: ObjectId,
  data: { title?: string; content?: string },
) {
  const db = await getDb();
  // 确认 course 存在并且属于该用户
  const course = await db
    .collection("courses")
    .findOne({ _id: courseId, user: userId });
  if (!course) {
    return null;
  }
  // 确认 section 属于该 course
  const section = await db
    .collection("sections")
    .findOne({ _id: sectionId, courseId: courseId });
  if (!section) {
    return null;
  }

  const updateFields: Record<string, unknown> = {};
  if (typeof data.title === "string") updateFields.title = data.title;
  if (typeof data.content === "string") updateFields.content = data.content;

  if (Object.keys(updateFields).length === 0) {
    return { matchedCount: 1, modifiedCount: 0 };
  }

  const result = await db
    .collection("lessons")
    .updateOne({ _id: lessonId, sectionId: sectionId }, { $set: updateFields });
  return result;
}

export async function getLesson(lessonId: ObjectId) {
  const db = await getDb();
  const lesson = await db.collection("lessons").findOne({ _id: lessonId });
  if (!lesson) {
    return null;
  }
  // to JSON
  return JSON.parse(JSON.stringify(lesson));
}
