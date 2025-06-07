import type { Lesson } from '$lib/models/course';

export async function fetchLesson(id: string, sectionId: string, lessonId: string): Promise<Lesson> {
  const res = await fetch(`/api/courses/${id}/sections/${sectionId}/lessons/${lessonId}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchLessons(id: string, sectionId: string): Promise<Lesson[]> {
  const res = await fetch(`/api/courses/${id}/sections/${sectionId}/lessons`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function createLesson(id: string, sectionId: string, data: any): Promise<Lesson> {
  const res = await fetch(`/api/courses/${id}/sections/${sectionId}/lessons`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updateLesson(id: string, sectionId: string, lessonId: string, data: any): Promise<Lesson> {
  const res = await fetch(`/api/courses/${id}/sections/${sectionId}/lessons/${lessonId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteLesson(id: string, sectionId: string, lessonId: string): Promise<any> {
  const res = await fetch(`/api/courses/${id}/sections/${sectionId}/lessons/${lessonId}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
} 