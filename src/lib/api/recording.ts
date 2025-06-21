import type { UserRecording } from "$lib/models/recording";

export async function fetchRecordings(
  lessonId: string,
): Promise<UserRecording[]> {
  const res = await fetch(`/api/lessons/${lessonId}/recordings`);
  if (!res.ok) {
    if (res.status === 404) {
      return [];
    }
    throw new Error(await res.text());
  }
  return res.json();
}
