import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const client = await clientPromise
    const db = client.db("portfolio")

    const result = await db.collection("paragraphs").deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 1) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: "Paragraph not found" }, { status: 404 })
    }
  } catch (error) {
    console.error("Error deleting paragraph:", error)
    return NextResponse.json({ error: "Failed to delete paragraph" }, { status: 500 })
  }
}
