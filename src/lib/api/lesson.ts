import type { Lesson } from "$lib/models/course";

// Define types for lesson creation and update data
type LessonCreateData = Omit<Lesson, "id" | "text" | "sentences"> & {
  text?: string;
  sentences?: Lesson["sentences"];
};
type LessonUpdateData = Partial<LessonCreateData>;

export async function fetchLesson(
  id: string,
  sectionId: string,
  lessonId: string,
  fetchFn: typeof fetch = fetch,
): Promise<Lesson> {
  const res = await fetchFn(
    `/api/courses/${id}/sections/${sectionId}/lessons/${lessonId}`,
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchLessons(
  id: string,
  sectionId: string,
): Promise<Lesson[]> {
  const res = await fetch(`/api/courses/${id}/sections/${sectionId}/lessons`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function createLesson(
  id: string,
  sectionId: string,
  data: LessonCreateData,
): Promise<Lesson> {
  const res = await fetch(`/api/courses/${id}/sections/${sectionId}/lessons`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updateLesson(
  id: string,
  sectionId: string,
  lessonId: string,
  data: LessonUpdateData,
): Promise<Lesson> {
  const res = await fetch(
    `/api/courses/${id}/sections/${sectionId}/lessons/${lessonId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteLesson(
  id: string,
  sectionId: string,
  lessonId: string,
): Promise<void> {
  const res = await fetch(
    `/api/courses/${id}/sections/${sectionId}/lessons/${lessonId}`,
    {
      method: "DELETE",
    },
  );
  if (!res.ok) throw new Error(await res.text());
}
