// Server-side database initialization
import clientPromise from "./mongodb"

export async function initializeDatabase() {
  try {
    console.log("Initializing database...")
    const client = await clientPromise
    const db = client.db("myDatabase")

    // Create collections if they don't exist
    const collections = await db.listCollections().toArray()
    const collectionNames = collections.map((c) => c.name)

    const requiredCollections = ["sections", "projects", "experiences", "education", "skills", "categories", "settings"]

    for (const collection of requiredCollections) {
      if (!collectionNames.includes(collection)) {
        console.log(`Creating ${collection} collection...`)
        await db.createCollection(collection)
      }
    }

    // Initialize settings if they don't exist
    const settingsCollection = db.collection("settings")
    const settings = await settingsCollection.findOne({})

    if (!settings) {
      await settingsCollection.insertOne({
        theme: "light",
        showPortrait: true,
        resumeUrl: "/resume.pdf",
        updatedAt: new Date(),
      })
    }

    console.log("Database initialization complete")
    return true
  } catch (error) {
    console.error("Database initialization error:", error)
    return false
  }
}
