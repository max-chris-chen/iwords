import { getDb } from "$lib/mongodb";
import { ObjectId } from "mongodb";
import { deleteLessonsBySectionId } from "./lesson";

export async function createSection(
  courseId: ObjectId,
  userId: ObjectId,
  title: string,
) {
  const db = await getDb();
  const course = await db
    .collection("courses")
    .findOne({ _id: courseId, user: userId });
  if (!course) {
    return null;
  }
  const section = {
    _id: new ObjectId(),
    courseId: courseId,
    title: title,
  };
  await db.collection("sections").insertOne(section);
  return section;
}

export async function updateSection(
  sectionId: ObjectId,
  courseId: ObjectId,
  userId: ObjectId,
  data: { title: string },
) {
  const db = await getDb();
  const course = await db
    .collection("courses")
    .findOne({ _id: courseId, user: userId });
  if (!course) {
    return null;
  }
  const section = await db
    .collection("sections")
    .findOne({ _id: sectionId, courseId: courseId });
  if (!section) {
    return null;
  }

  const result = await db
    .collection("sections")
    .updateOne({ _id: sectionId }, { $set: { title: data.title } });
  return result;
}

export async function deleteSection(
  sectionId: ObjectId,
  courseId: ObjectId,
  userId: ObjectId,
) {
  const db = await getDb();
  const course = await db
    .collection("courses")
    .findOne({ _id: courseId, user: userId });
  if (!course) {
    return null;
  }

  await deleteLessonsBySectionId(sectionId);

  const result = await db
    .collection("sections")
    .deleteOne({ _id: sectionId, courseId: courseId });
  return result;
}
