import { json, error } from "@sveltejs/kit";
import { getDb } from "$lib/mongodb";
import { ObjectId } from "mongodb";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ locals, params }) => {
  const user = locals.user;
  if (!user) {
    throw error(401, "Unauthorized");
  }

  const { lessonId } = params;
  if (!lessonId || !ObjectId.isValid(lessonId)) {
    throw error(400, "Invalid lessonId");
  }

  try {
    const userId = new ObjectId(user.userId);
    const lessonObjectId = new ObjectId(lessonId);
    const db = await getDb();
    const userRecordings = await db
      .collection("user_recordings")
      .find({
        userId: userId,
        lessonId: lessonObjectId,
      })
      .sort({ createdAt: -1 })
      .toArray();

    if (!userRecordings) {
      return json([]);
    }

    return json(userRecordings);
  } catch (e) {
    console.error("Failed to fetch recordings:", e);
    throw error(500, "Internal Server Error");
  }
};
