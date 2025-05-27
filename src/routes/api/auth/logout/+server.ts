import { json } from "@sveltejs/kit";

export async function POST({ cookies }) {
  cookies.delete("sessionId", { path: "/" });
  return json({ message: "Logged out successfully" }, { status: 200 });
}
