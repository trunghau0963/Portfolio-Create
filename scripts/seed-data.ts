import clientPromise from "../lib/mongodb"
import { initializeDatabase } from "../lib/db-init"
import bcrypt from "bcryptjs"

async function seedDatabase() {
  try {
    console.log("Connecting to MongoDB...")
    await initializeDatabase()

    const client = await clientPromise
    const db = client.db("portfolio")

    // Seed users if not exists
    const usersCollection = db.collection("users")
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
    }

    // Seed sections if not exists
    const sectionsCollection = db.collection("sections")
    const sectionsCount = await sectionsCollection.countDocuments()

    if (sectionsCount === 0) {
      console.log("Creating default sections...")
      const defaultSections = [
        {
          id: "hero",
          title: "Home",
          type: "hero",
          visible: true,
          order: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "about",
          title: "About",
          type: "introduction",
          visible: true,
          order: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "projects",
          title: "Projects",
          type: "projects",
          visible: true,
          order: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "experience",
          title: "Experience",
          visible: true,
          type: "experience",
          order: 3,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "skills",
          title: "Skills",
          type: "skills",
          visible: true,
          order: 4,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "education",
          title: "Education",
          type: "education",
          visible: true,
          order: 5,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      await sectionsCollection.insertMany(defaultSections)
      console.log("Default sections created successfully")
    }

    // Seed categories if not exists
    const categoriesCollection = db.collection("categories")
    const categoriesCount = await categoriesCollection.countDocuments()

    if (categoriesCount === 0) {
      console.log("Creating default categories...")
      const defaultCategories = [
        {
          name: "Web Development",
          order: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "Mobile Development",
          order: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "UI/UX Design",
          order: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      await categoriesCollection.insertMany(defaultCategories)
      console.log("Default categories created successfully")
    }

    console.log("Database seeding completed")
    process.exit(0)
  } catch (error) {
    console.error("Error seeding database:", error)
    process.exit(1)
  }
}

seedDatabase()
