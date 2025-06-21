import type {} from "mongodb";

export interface UserRecording {
  _id?: string;
  userId: string;
  lessonId: string;
  sentenceId: string;
  recordingUrl: string;
  createdAt: Date;
  duration?: number; // in seconds
  mimeType?: string;
}
