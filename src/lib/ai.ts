import {
  env
} from "$env/dynamic/private";
import crypto from "crypto";
import fs from "fs-extra";
import path from "path";
/**
 * 调用 DeepSeek API，将文本拆分成句子并返回 JSON 数组字符串
 * @param text 输入的长文本
 * @param apiKey DeepSeek API Key（建议从服务端环境变量传入）
 * @returns Promise<string[]> 句子数组
 */
export async function splitTextToSentences(text: string): Promise<string[]> {
  if (!env.DEEPSEEK_API_KEY) throw new Error("Missing DEEPSEEK_API_KEY");
  const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        {
          role: "user",
          content: `请将下面这段文字拆分成句子，只返回 JSON 数组，不要任何解释、描述或代码块标记：${text}`,
        },
      ],
    }),
  });
  if (!response.ok) {
    throw new Error("DeepSeek API 调用失败: " + (await response.text()));
  }
  const data = await response.json();
  let result = data.choices?.[0]?.message?.content?.trim();
  // 兼容 AI 可能返回 markdown 代码块和多余前缀
  result = result.replace(/^[^\[]*```json|```$/g, "").trim();
  result = result.replace(/^[^\[]*\[/, "["); // 去除前面多余的描述性文字
  try {
    const arr = JSON.parse(result);
    if (Array.isArray(arr)) return arr;
    throw new Error("DeepSeek 返回内容不是数组");
  } catch {
    throw new Error("解析 DeepSeek 返回内容失败: " + result);
  }
}

// 音频文件存储目录，可通过环境变量 AUDIO_DIR 配置，默认 static/audio
const AUDIO_DIR_PATH = env.AUDIO_DIR || path.resolve("static/audio");

/**
 * 调用 Speechify API，将文本转为语音音频数据
 * @param text 要合成的文本
 * @param options 可选参数：voice, output_format
 * @returns Promise<{ audioUrl: string; audio_format: string; speech_marks?: unknown }>
 */
export async function textToSpeech(
  text: string,
  options?: { voice?: string; output_format?: string },
): Promise<{ audioUrl: string; audio_format: string; speech_marks?: unknown }> {
  const API_KEY = env.SPEECHIFY_API_KEY;
  if (!API_KEY) throw new Error("SPEECHIFY_API_KEY not set");
  const voice = options?.voice || "kristy";
  const output_format = options?.output_format || "mp3";

  // 1. 生成唯一hash作为文件名
  const hash = crypto
    .createHash("md5")
    .update(text + voice + output_format)
    .digest("hex");
  const audioFile = path.join(AUDIO_DIR_PATH, `${hash}.${output_format}`);
  // 公开访问路径为 /api/audio/xxx.mp3
  const publicAudioPath = `/api/audio/${hash}.${output_format}`;

  // 2. 检查文件是否已存在
  if (await fs.pathExists(audioFile)) {
    return {
      audioUrl: publicAudioPath,
      audio_format: output_format,
    };
  }

  // 3. 若不存在则调用API
  const response = await fetch(
    "https://api.sws.speechify.com/v1/audio/speech",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        accept: "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        input: text,
        voice_id: voice,
        audio_format: output_format,
      }),
    },
  );
  if (!response.ok) {
    const err = await response.text();
    throw new Error("Speechify error: " + err);
  }
  const data = await response.json();
  // 4. 保存音频到磁盘
  await fs.ensureDir(AUDIO_DIR_PATH);
  await fs.writeFile(audioFile, Buffer.from(data.audio_data, "base64"));
  return {
    audioUrl: publicAudioPath,
    audio_format: data.audio_format,
    speech_marks: data.speech_marks,
  };
}
