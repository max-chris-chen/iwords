import type { LayoutLoad } from "./$types";

export const load: LayoutLoad = async ({ fetch }) => {
  // 获取当前登录用户信息
  try {
    const res = await fetch("/api/users/me");
    if (res.ok) {
      const data = await res.json();
      return { user: data.user };
    }
  } catch {}
  return { user: null };
};
