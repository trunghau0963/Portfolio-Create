import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const sectionId = searchParams.get("sectionId")

    if (!sectionId) {
      return NextResponse.json({ error: "Section ID is required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("portfolio")
    const paragraphs = await db.collection("paragraphs").find({ sectionId }).sort({ order: 1 }).toArray()

    return NextResponse.json(paragraphs)
  } catch (error) {
    console.error("Error fetching paragraphs:", error)
    return NextResponse.json({ error: "Failed to fetch paragraphs" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const paragraph = await request.json()
    const client = await clientPromise
    const db = client.db("portfolio")

    const now = new Date()
    const result = await db.collection("paragraphs").insertOne({
      ...paragraph,
      createdAt: now,
      updatedAt: now,
    })

    return NextResponse.json({
      ...paragraph,
      _id: result.insertedId,
      createdAt: now,
      updatedAt: now,
    })
  } catch (error) {
    console.error("Error saving paragraph:", error)
    return NextResponse.json({ error: "Failed to save paragraph" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const paragraph = await request.json()
    const client = await clientPromise
    const db = client.db("portfolio")

    const { _id, ...updateData } = paragraph
    const objectId = new ObjectId(_id)

    const now = new Date()
    await db.collection("paragraphs").updateOne({ _id: objectId }, { $set: { ...updateData, updatedAt: now } })

    return NextResponse.json({
      ...paragraph,
      updatedAt: now,
    })
  } catch (error) {
    console.error("Error updating paragraph:", error)
    return NextResponse.json({ error: "Failed to update paragraph" }, { status: 500 })
  }
}
