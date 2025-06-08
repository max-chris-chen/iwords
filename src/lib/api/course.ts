import type { Course } from "$lib/models/course";

export async function updateCourse(
  id: string,
  data: Partial<Course>,
): Promise<Course> {
  const res = await fetch(`/api/courses/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return await res.json();
}
