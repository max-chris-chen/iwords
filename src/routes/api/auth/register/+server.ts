import type { User } from "$lib/models/user";
import { connectToDatabase } from "$lib/mongodb";
import { json } from "@sveltejs/kit";
import bcrypt from "bcryptjs";

export async function POST({ request }) {
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

    // Check for existing user
    const existingUser = await usersCollection.findOne({ username });
    if (existingUser) {
      return json(
        { error: "User with this username already exists." },
        { status: 409 },
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser: User = {
      username,
      password: hashedPassword,
      createdAt: new Date(),
    };

    const result = await usersCollection.insertOne(newUser);
    if (!result.insertedId) {
      return json({ error: "Failed to create user." }, { status: 500 });
    }

    // Do not return password in response
    const { ...userWithoutPassword } = newUser;
    return json(
      { message: "User registered successfully", user: userWithoutPassword },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error registering user:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    return json(
      { error: "Failed to register user.", detail: errorMessage },
      { status: 500 },
    );
  }
}
