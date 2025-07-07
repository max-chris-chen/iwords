import type { Handle } from "@sveltejs/kit";
import { redirect } from "@sveltejs/kit";
import jwt from "jsonwebtoken";
import { env } from "$env/dynamic/private";

if (!env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not set in the environment variables.");
}

const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/wechat/callback",
  "/api/auth/wechat/login",
  "/api/tts",
  "/api/voices",
];

export const handle: Handle = async ({ event, resolve }) => {
  const token = event.cookies.get("token");
  event.locals.user = null; // Initialize user as null

  if (env.DEV_MODE_BYPASS_LOGIN === 'true') {
    event.locals.user = {
      userId: env.DEV_USER_ID || 'dev-user-id',
      username: env.DEV_USER_NAME || 'dev-user',
    };
  } else if (token) {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET, {
        algorithms: ['HS256'],
      });
      if (typeof decoded === 'object' && decoded !== null) {
        event.locals.user = decoded as App.Locals['user'];
      } else {
        event.locals.user = null;
      }
    } catch (err) {
      console.error('JWT verification failed:', err);
      event.locals.user = null;
    }
  }

  if (!event.locals.user && !PUBLIC_PATHS.includes(event.url.pathname)) {
    // For API endpoints that are not public, return a 401 Unauthorized error
    if (event.url.pathname.startsWith("/api")) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
      });
    }
    // For page routes, redirect to login
    throw redirect(303, "/login");
  }

  const response = await resolve(event);
  return response;
};
