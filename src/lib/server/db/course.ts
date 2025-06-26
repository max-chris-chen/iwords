import { getDb } from "$lib/mongodb";
import type { Course } from "$lib/models/course";
import type { ObjectId } from "mongodb";

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
