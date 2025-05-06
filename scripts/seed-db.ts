import clientPromise from "../lib/mongodb"
import bcrypt from "bcryptjs"

async function seedDatabase() {
  try {
    console.log("Connecting to MongoDB...")
    const client = await clientPromise
    const db = client.db("portfolio")

    // Check if users collection exists, create it if not
    const collections = await db.listCollections().toArray()
    if (!collections.some((c) => c.name === "users")) {
      console.log("Creating users collection...")
      await db.createCollection("users")
    }

    const usersCollection = db.collection("users")

    // Check if admin user exists
    const adminUser = await usersCollection.findOne({ email: "admin@portfolio.com" })

    if (!adminUser) {
      console.log("Creating admin user...")
      const hashedPassword = await bcrypt.hash("admin123", 10)
      const now = new Date()

      await usersCollection.insertOne({
        email: "admin@portfolio.com",
        name: "Admin User",
        password: hashedPassword,
        isAdmin: true,
        createdAt: now,
        updatedAt: now,
      })

      console.log("Admin user created successfully")
    } else {
      console.log("Admin user already exists")
    }

    console.log("Database seeding completed")
    process.exit(0)
  } catch (error) {
    console.error("Error seeding database:", error)
    process.exit(1)
  }
}

seedDatabase()
