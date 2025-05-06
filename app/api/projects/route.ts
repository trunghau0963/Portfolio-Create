import { NextResponse } from "next/server"
import { dataService } from "@/services/data-service"

export async function GET() {
  try {
    const projects = await dataService.getProjects()
    return NextResponse.json(projects)
  } catch (error) {
    console.error("Error fetching projects:", error)
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const project = await request.json()
    const savedProject = await dataService.saveProject(project)
    return NextResponse.json(savedProject)
  } catch (error) {
    console.error("Error saving project:", error)
    return NextResponse.json({ error: "Failed to save project" }, { status: 500 })
  }
}
