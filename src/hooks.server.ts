import { connectToDatabase } from "$lib/mongodb";
import type { Handle } from "@sveltejs/kit";
import { ObjectId } from "mongodb";

export const handle: Handle = async ({ event, resolve }) => {
  const sessionId = event.cookies.get("sessionId");
  event.locals.user = null; // Initialize user as null

  if (sessionId) {
    try {
      const { db } = await connectToDatabase();
      const sessionsCollection = db.collection("sessions");
      const session = await sessionsCollection.findOne({ sessionId });

      if (session && session.userId) {
        const usersCollection = db.collection("users");
        let user;
        // Try to find user by ObjectId or string
        try {
          user = await usersCollection.findOne({
            _id: new ObjectId(session.userId),
          });
        } catch {
          user = await usersCollection.findOne({ _id: session.userId });
        }
        if (user) {
          // Omit sensitive data like password if you store it
          const { password, ...userData } = user;
          event.locals.user = userData as App.Locals["user"];
        }
      }
    } catch (error) {
      console.error("Error fetching user from session:", error);
      // Optionally clear the cookie if session is invalid
      // event.cookies.delete('sessionId', { path: '/' });
    }
  }

  const response = await resolve(event);
  return response;
};
