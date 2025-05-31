/**
 * 调用 DeepSeek API，将文本拆分成句子并返回 JSON 数组字符串
 * @param text 输入的长文本
 * @param apiKey DeepSeek API Key（建议从服务端环境变量传入）
 * @returns Promise<string[]> 句子数组
 */
export async function splitTextToSentences(text: string, apiKey: string): Promise<string[]> {
  if (!apiKey) throw new Error('Missing DEEPSEEK_API_KEY');
  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'user',
          content: `请将下面这段文字拆分成句子，并以 JSON 数组字符串返回：${text}`
        }
      ]
    })
  });
  if (!response.ok) {
    throw new Error('DeepSeek API 调用失败: ' + (await response.text()));
  }
  const data = await response.json();
  let result = data.choices?.[0]?.message?.content?.trim();
  // 兼容 AI 可能返回 markdown 代码块
  result = result.replace(/^```json|```$/g, '').trim();
  try {
    const arr = JSON.parse(result);
    if (Array.isArray(arr)) return arr;
    throw new Error('DeepSeek 返回内容不是数组');
  } catch (e) {
    throw new Error('解析 DeepSeek 返回内容失败: ' + result);
  }
}
