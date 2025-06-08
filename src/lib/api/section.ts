import type { Section } from "$lib/models/course";

export async function createSection(
  courseId: string,
  data: { title: string },
): Promise<Section> {
  const res = await fetch(`/api/courses/${courseId}/sections`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updateSection(
  courseId: string,
  sectionId: string,
  data: { title: string },
): Promise<Section> {
  const res = await fetch(`/api/courses/${courseId}/sections/${sectionId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteSection(
  courseId: string,
  sectionId: string,
): Promise<void> {
  const res = await fetch(`/api/courses/${courseId}/sections/${sectionId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(await res.text());
}
