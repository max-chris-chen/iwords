import { getLesson } from "$lib/server/db/lesson";
import { error } from "@sveltejs/kit";
import { ObjectId } from "mongodb";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => {
  const { id, sectionId, lessonId } = params;
  try {
    const lesson = await getLesson(new ObjectId(lessonId));

    if (!lesson) {
      throw error(404, "课程未找到");
    }

    // 检查课程是否属于正确的部分和课程
    if (lesson.sectionId?.toString() !== sectionId) {
      throw error(403, "该课程不属于本章节");
    }

    return {
      lesson,
      courseId: id,
      sectionId,
    };
  } catch (e: unknown) {
    const err = e as Error;
    throw error(500, err.message || "加载课程失败");
  }
};
