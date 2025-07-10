import { getAuthenticatedUserId } from "$lib/server/auth";
import { getCourseWithDetails } from "$lib/server/db/course";
import {
  createSection,
  updateSection,
  deleteSection,
} from "$lib/server/db/section";
import { fail, redirect } from "@sveltejs/kit";
import { ObjectId } from "mongodb";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, locals }) => {
  const userId = getAuthenticatedUserId(locals);
  const course = await getCourseWithDetails(new ObjectId(params.id), userId);

  if (course) {
    const totalLessons = course.sections.reduce(
      (acc, section) => acc + (section.lessons?.length ?? 0),
      0,
    );
    const coursePlain = JSON.parse(JSON.stringify(course));
    return {
      course: { ...coursePlain, totalLessons },
    };
  }

  return {
    course: null,
  };
};
export const actions: Actions = {
  createSection: async ({ request, params, locals }) => {
    const userId = getAuthenticatedUserId(locals);
    const data = await request.formData();
    const title = data.get("title") as string;

    if (!title?.trim()) {
      return fail(400, { success: false, message: "章节标题不能为空" });
    }

    try {
      await createSection(new ObjectId(params.id), userId, title);
    } catch (error) {
      console.error(error);
      return fail(500, { success: false, message: "创建失败" });
    }
    throw redirect(303, `/courses/${params.id}`);
  },
  updateSection: async ({ request, params, locals }) => {
    const userId = getAuthenticatedUserId(locals);
    const data = await request.formData();
    const title = data.get("title") as string;
    const sectionId = data.get("sectionId") as string;

    if (!title?.trim()) {
      return fail(400, { success: false, message: "章节标题不能为空" });
    }

    if (!sectionId) {
      return fail(400, { success: false, message: "缺少 sectionId" });
    }

    try {
      await updateSection(
        new ObjectId(sectionId),
        new ObjectId(params.id),
        userId,
        { title },
      );
    } catch (error) {
      console.error(error);
      return fail(500, { success: false, message: "更新失败" });
    }
    throw redirect(303, `/courses/${params.id}`);
  },
  deleteSection: async ({ request, params, locals }) => {
    const userId = getAuthenticatedUserId(locals);
    const data = await request.formData();
    const sectionId = data.get("sectionId") as string;

    if (!sectionId) {
      return fail(400, { success: false, message: "缺少 sectionId" });
    }

    try {
      await deleteSection(
        new ObjectId(sectionId),
        new ObjectId(params.id),
        userId,
      );
    } catch (error) {
      console.error(error);
      return fail(500, { success: false, message: "删除失败" });
    }
    throw redirect(303, `/courses/${params.id}`);
  },
};
