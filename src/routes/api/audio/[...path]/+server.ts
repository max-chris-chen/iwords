import { env } from '$env/dynamic/private';
import { error } from '@sveltejs/kit';
import fs from 'fs';
import path from 'path';
import type { RequestHandler } from './$types';

const audioDir = env.AUDIO_DIR;

export const GET: RequestHandler = ({ params }) => {
    if (!audioDir) {
        console.error('AUDIO_DIR environment variable is not set.');
        throw error(500, 'Server is not configured for file uploads.');
    }

    const requestedPath = params.path || '';
    const filePath = path.join(audioDir, requestedPath);

    // Security: ensure the resolved path is still within the audio directory
    const resolvedPath = path.resolve(filePath);
    const resolvedAudioDir = path.resolve(audioDir);
    if (!resolvedPath.startsWith(resolvedAudioDir)) {
        throw error(403, 'Forbidden');
    }

    if (fs.existsSync(filePath)) {
        const fileStream = fs.createReadStream(filePath);
        const stats = fs.statSync(filePath);

        let contentType = 'application/octet-stream';
        const ext = path.extname(filePath).toLowerCase();
        if (ext === '.wav') {
            contentType = 'audio/wav';
        } else if (ext === '.webm') {
            contentType = 'audio/webm';
        } else if (ext === '.mp3') {
            contentType = 'audio/mpeg';
        }

        const headers = {
            'Content-Type': contentType,
            'Content-Length': stats.size.toString(),
            'Accept-Ranges': 'bytes',
        };
        return new Response(fileStream as unknown as ReadableStream, { headers });
    } else {
        console.error(`File not found: ${filePath}`);
        throw error(404, 'Not Found');
    }
};
