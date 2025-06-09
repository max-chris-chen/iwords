import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import fs from 'fs/promises';
import path from 'path';
import { env } from '$env/dynamic/private';
import { getDb } from '$lib/mongodb';
import { ObjectId } from 'mongodb';

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const user = locals.user;
    if (!user) {
      return json({ message: 'Not authenticated.' }, { status: 401 });
    }

    const formData = await request.formData();
    const audioFile = formData.get('audio');
    const courseId = formData.get('courseId') as string;
    const lessonId = formData.get('lessonId') as string;
    const sentenceIndex = parseInt(formData.get('sentenceIndex') as string, 10);

    if (!audioFile || !(audioFile instanceof File) || !lessonId || isNaN(sentenceIndex)) {
      return json(
        { message: 'Invalid request data. Audio file, lessonId, and sentenceIndex are required.' },
        { status: 400 }
      );
    }

    const audioDir = env.AUDIO_DIR;
    if (!audioDir) {
      console.error('AUDIO_DIR environment variable is not set.');
      return json({ message: 'Server is not configured for file uploads.' }, { status: 500 });
    }

    const recordingsPath = path.join(audioDir, 'recordings');
    await fs.mkdir(recordingsPath, { recursive: true });

    const fileName = `u${user._id}_c${courseId}_l${lessonId}_s${sentenceIndex}_${Date.now()}.wav`;
    const filePath = path.join(recordingsPath, fileName);
    const relativePath = path.join('recordings', fileName);

    const audioBuffer = await audioFile.arrayBuffer();
    await fs.writeFile(filePath, Buffer.from(audioBuffer));

    console.log(`Recording saved to ${filePath}`);

    // Now, insert into the new collection
    const db = await getDb();
    const recordingsCollection = db.collection('user_recordings');

    const newRecording = {
      userId: new ObjectId(user._id),
      lessonId: new ObjectId(lessonId),
      sentenceIndex: sentenceIndex,
      recordingUrl: relativePath,
      createdAt: new Date()
    };

    const result = await recordingsCollection.insertOne(newRecording);

    return json(
      {
        message: 'Recording submitted and path saved successfully!',
        filePath: relativePath,
        insertedId: result.insertedId
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error processing recording submission:', error);
    return json({ message: 'Failed to process the recording.' }, { status: 500 });
  }
};
