import type { ObjectId } from 'mongodb';

export interface UserRecording {
  _id?: ObjectId;
  userId: ObjectId;
  lessonId: ObjectId;
  sentenceIndex: number;
  recordingUrl: string;
  createdAt: Date;
  duration?: number; // in seconds
  mimeType?: string;
}
