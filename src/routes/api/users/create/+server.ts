import type { User } from "$lib/models/user";
import { connectToDatabase } from "$lib/mongodb";
import { json } from "@sveltejs/kit";

export async function POST({ request }) {
  const { username, email, phone } = await request.json();

  if (!username || !email || !phone) {
    return json(
      {
        error:
          "Missing required fields: username, email, and phone are required.",
      },
      { status: 400 },
    );
  }

  // Basic email validation
  if (!/\S+@\S+\.\S+/.test(email)) {
    return json({ error: "Invalid email format." }, { status: 400 });
  }

  // Basic phone validation (example: 10 digits)
  if (!/^\d{10}$/.test(phone)) {
    return json(
      { error: "Invalid phone number format. Expected 10 digits." },
      { status: 400 },
    );
  }

  try {
    const { db } = await connectToDatabase();
    const usersCollection = db.collection<User>("users");

    // Check if user already exists (optional, based on your needs)
    const existingUserByEmail = await usersCollection.findOne({ email });
    if (existingUserByEmail) {
      return json(
        { error: "User with this email already exists." },
        { status: 409 },
      );
    }
    const existingUserByUsername = await usersCollection.findOne({ username });
    if (existingUserByUsername) {
      return json(
        { error: "User with this username already exists." },
        { status: 409 },
      );
    }

    const newUser: User = {
      username,
      email,
      phone,
      createdAt: new Date(),
    };

    const result = await usersCollection.insertOne(newUser);

    if (!result.insertedId) {
      return json({ error: "Failed to create user." }, { status: 500 });
    }

    // Fetch the inserted document to return it in the response
    const insertedUser = await usersCollection.findOne({
      _id: result.insertedId,
    });

    return json(
      { message: "User created successfully", user: insertedUser },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating user:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    return json(
      {
        error: "Failed to connect to database or create user.",
        detail: errorMessage,
      },
      { status: 500 },
    );
  }
}
