import { fetchLesson } from "$lib/api/lesson";
import { error } from "@sveltejs/kit";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ params, fetch }) => {
  const { id, sectionId, lessonId } = params;
  try {
    const lesson = await fetchLesson(id, sectionId, lessonId, fetch);
    return {
      lesson,
      courseId: id,
      sectionId,
    };
  } catch (e: unknown) {
    const err = e as Error;
    throw error(500, err.message || "Failed to load lesson");
  }
};
