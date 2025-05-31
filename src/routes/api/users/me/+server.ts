import { json } from "@sveltejs/kit";

export async function GET({ locals }) {
  if (!locals.user) {
    return json({ user: null }, { status: 200 });
  }
  // Remove password from user object before returning
  // (password property already removed from model, so just spread the user)
  const { ...userWithoutPassword } = locals.user;
  return json({ user: userWithoutPassword }, { status: 200 });
}
