import { getDb } from "$lib/mongodb";
import type { Course, Lesson, Section } from "$lib/models/course";
import type { ObjectId } from "mongodb";
import { CourseStatus } from "$lib/models/course";

interface SectionWithLessons extends Section {
  lessons: Lesson[];
}

interface CourseWithDetails extends Course {
  sections: SectionWithLessons[];
}

export async function getCoursesByUserId(userId: ObjectId): Promise<Course[]> {
  const db = await getDb();
  const coursesData = await db
    .collection("courses")
    .find({ user: userId })
    .sort({ createdAt: -1 })
    .toArray();

  // 从数据库返回的数据可能包含 BSON 类型（如 ObjectId），
  // 在传递给客户端之前需要进行序列化，以确保它们是纯粹的 JSON。
  return JSON.parse(JSON.stringify(coursesData));
}

// 插入课程到数据库
export async function insertCourse(course: Course): Promise<Course> {
  const db = await getDb();
  // 先移除 _id 字段，避免类型冲突，由 MongoDB 自动生成
  const { _id: _, ...courseData } = course as Partial<Course>;
  const result = await db.collection("courses").insertOne(courseData);
  // 返回插入后的完整对象，_id 转为 string
  return { ...courseData, _id: result.insertedId.toString() } as Course;
}

export async function findCourseById(courseId: ObjectId, userId: ObjectId) {
  const db = await getDb();
  return await db
    .collection("courses")
    .findOne({ _id: courseId, user: userId });
}

export async function getCourseWithDetails(
  courseId: ObjectId,
  userId: ObjectId,
): Promise<CourseWithDetails | null> {
  const db = await getDb();
  const course = await db
    .collection("courses")
    .findOne({ _id: courseId, user: userId });

  if (!course) {
    return null;
  }

  // 查询所有 section
  const sections = await db.collection("sections").find({ courseId }).toArray();

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

  return {
    ...course,
    sections: sectionsWithLessons,
  } as unknown as CourseWithDetails;
}

export async function updateCourse(
  courseId: ObjectId,
  userId: ObjectId,
  body: Record<string, unknown>,
) {
  const db = await getDb();

  const update: Record<string, unknown> = {};
  if (body.title !== undefined) update.title = body.title;
  if (body.coverImage !== undefined) update.coverImage = body.coverImage;
  if (body.description !== undefined) update.description = body.description;
  if (body.isPublic !== undefined) update.isPublic = body.isPublic;
  if (
    body.status !== undefined &&
    Object.values(CourseStatus).includes(body.status as CourseStatus)
  ) {
    update.status = body.status;
  }

  if (Object.keys(update).length === 0) {
    return { matchedCount: 1, modifiedCount: 0 }; // Nothing to update
  }

  update.updatedAt = new Date();

  const result = await db
    .collection("courses")
    .updateOne({ _id: courseId, user: userId }, { $set: update });

  return result;
}
