import type { Handle } from "@sveltejs/kit";
import { redirect } from "@sveltejs/kit";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "$env/static/private";

export const handle: Handle = async ({ event, resolve }) => {
  const token = event.cookies.get("token");
  event.locals.user = null; // Initialize user as null

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (typeof decoded === "object" && decoded !== null) {
        event.locals.user = decoded as App.Locals["user"];
      } else {
        event.locals.user = null;
      }
    } catch {
      event.locals.user = null;
    }
  }

  if (!event.locals.user) {
    if (
      event.url.pathname !== "/login" &&
      event.url.pathname !== "/register" &&
      !event.url.pathname.startsWith("/api")
    ) {
      throw redirect(303, "/login");
    }
  }

  const response = await resolve(event);
  return response;
};
