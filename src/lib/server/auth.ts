import { ObjectId } from "mongodb";
import type { App } from "app";
import { error } from "@sveltejs/kit";

/**
 * Validates the user from locals and returns their ObjectId.
 * If the user is not authenticated, it throws a 401 HTTP error.
 * @param locals - The request locals object.
 * @returns {ObjectId} - The user's ObjectId.
 * @throws {HttpError} - Throws a 401 error if authentication fails.
 */
export function getAuthenticatedUserId(locals: App.Locals): ObjectId {
  if (!locals.user?.userId) {
    throw error(401, "Unauthorized");
  }
  try {
    return new ObjectId(locals.user.userId);
  } catch {
    // This handles cases where userId from JWT is not a valid ObjectId string.
    throw error(401, "Invalid user identity in token");
  }
}
