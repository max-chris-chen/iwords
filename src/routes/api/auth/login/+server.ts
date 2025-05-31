import type { User } from "$lib/models/user";
import { connectToDatabase } from "$lib/mongodb";
import { json } from "@sveltejs/kit";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

export async function POST({ request, cookies }) {
  const { username, password } = await request.json();

  if (!username || !password) {
    return json(
      { error: "Missing required fields: username and password." },
      { status: 400 },
    );
  }

  try {
    const { db } = await connectToDatabase();
    const usersCollection = db.collection<User>("users");
    const user = await usersCollection.findOne({ username });
    if (!user || !user.password) {
      return json({ error: "Invalid username or password." }, { status: 401 });
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return json({ error: "Invalid username or password." }, { status: 401 });
    }

    // Create session
    const sessionId = uuidv4();
    const sessionsCollection = db.collection("sessions");
    await sessionsCollection.insertOne({
      sessionId,
      userId: user._id,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    cookies.set("sessionId", sessionId, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
    });
    // Do not return password
    const { ...userWithoutPassword } = user;
    return json(
      { message: "Login successful", user: userWithoutPassword },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error logging in:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    return json(
      { error: "Failed to login.", detail: errorMessage },
      { status: 500 },
    );
  }
}
