import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db("portfolio")
    const sections = await db.collection("sections").find({}).sort({ order: 1 }).toArray()

    return NextResponse.json(sections)
  } catch (error) {
    console.error("Error fetching sections:", error)
    return NextResponse.json({ error: "Failed to fetch sections" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const section = await request.json()
    const client = await clientPromise
    const db = client.db("portfolio")

    const now = new Date()
    const result = await db.collection("sections").insertOne({
      ...section,
      createdAt: now,
      updatedAt: now,
    })

    return NextResponse.json({
      ...section,
      _id: result.insertedId,
      createdAt: now,
      updatedAt: now,
    })
  } catch (error) {
    console.error("Error saving section:", error)
    return NextResponse.json({ error: "Failed to save section" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const section = await request.json()
    const client = await clientPromise
    const db = client.db("portfolio")

    const { _id, ...updateData } = section
    const objectId = new ObjectId(_id)

    const now = new Date()
    await db.collection("sections").updateOne({ _id: objectId }, { $set: { ...updateData, updatedAt: now } })

    return NextResponse.json({
      ...section,
      updatedAt: now,
    })
  } catch (error) {
    console.error("Error updating section:", error)
    return NextResponse.json({ error: "Failed to update section" }, { status: 500 })
  }
}
