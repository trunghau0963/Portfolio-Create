import { NextResponse } from "next/server";
import clientPromise from "../../../../lib/mongodb";
import type { User as DbUser } from "@/models/User"; // Assuming you have a User model type
// IMPORTANT: In a real application, use a library like bcrypt to hash and compare passwords!
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("myDatabase"); // Replace with your database name
    const usersCollection = db.collection<DbUser>("Users"); // Changed "Users" to "users"

    // Find user by email
    // Explicitly type the user document or use projection if needed
    const user = await usersCollection.findOne({ email });

    if (!user) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      );
    }

    // *** SECURITY WARNING ***
    // Replace this plain text comparison with a secure hashing check (e.g., bcrypt.compare)
    // Ensure your user document actually has a 'password' field
    const passwordMatches = user.password
      ? await bcrypt.compare(password, user.password)
      : false;

    console.log("passwordMatches", passwordMatches);

    if (!passwordMatches) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Credentials are valid
    // Return necessary user info (excluding password/hash)
    return NextResponse.json({
      message: "Login successful",
      user: {
        id: user._id.toString(), // Include user ID
        email: user.email,
        name: user.name || "User Name", // Use actual name field from your DB
        isAdmin: user.isAdmin || false, // Use actual admin field from your DB
      },
    });
  } catch (error) {
    console.error("Login API Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      { message: `Server error during login: ${errorMessage}` },
      { status: 500 }
    );
  }
}
