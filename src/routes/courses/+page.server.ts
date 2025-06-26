import { getAuthenticatedUserId } from "$lib/server/auth";
import type { PageServerLoad } from "./$types";
import { error } from "@sveltejs/kit";
import { getCoursesByUserId } from "$lib/server/db/course";

export const load: PageServerLoad = async ({ locals }) => {
  try {
    const userId = getAuthenticatedUserId(locals);
    const courses = await getCoursesByUserId(userId);
    return { courses: courses || [] };
  } catch (e) {
    console.error("加载课程失败 (server):", e);
    throw error(500, "获取课程列表失败，请稍后重试。");
  }
};
