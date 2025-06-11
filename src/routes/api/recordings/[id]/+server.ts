import { env } from '$env/dynamic/private';
import { getDb } from '$lib/mongodb';
import { error, json } from '@sveltejs/kit';
import { ObjectId } from 'mongodb';
import type { RequestHandler } from './$types';
import fs from 'fs/promises';
import path from 'path';

export const DELETE: RequestHandler = async ({ params, locals }) => {
  const user = locals.user;
  if (!user) {
    throw error(401, 'Unauthorized');
  }

  const { id } = params;
  if (!id || !ObjectId.isValid(id)) {
    throw error(400, 'Invalid recording ID');
  }

  const recordingId = new ObjectId(id);
  const db = await getDb();
  const recordingsCollection = db.collection('user_recordings');

  const recording = await recordingsCollection.findOne({ _id: recordingId });

  if (!recording) {
    throw error(404, 'Recording not found');
  }

  if (recording.userId.toHexString() !== user._id.toHexString()) {
    throw error(403, 'Forbidden');
  }

  // Delete file from filesystem
  const audioDir = env.AUDIO_DIR;
  if (audioDir && recording.recordingUrl) {
    const filePath = path.join(audioDir, recording.recordingUrl);
    try {
      await fs.unlink(filePath);
      console.log(`Deleted audio file: ${filePath}`);
    } catch (e) {
      // Log error but continue to delete from DB
      console.error(`Failed to delete audio file: ${filePath}`, e);
    }
  }

  // Delete from database
  await recordingsCollection.deleteOne({ _id: recordingId });

  return json({ message: 'Recording deleted successfully' }, { status: 200 });
};
