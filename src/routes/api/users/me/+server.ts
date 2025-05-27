import { json } from "@sveltejs/kit";

export async function GET({ locals }) {
  if (!locals.user) {
    return json({ user: null }, { status: 200 });
  }
  // 不返回敏感信息
  const { password, ...userWithoutPassword } = locals.user;
  return json({ user: userWithoutPassword }, { status: 200 });
}
