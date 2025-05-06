// import { NextResponse } from "next/server"
// import { initializeDatabase } from "@/lib/db-init"

// export async function GET() {
//   try {
//     const success = await initializeDatabase()

//     if (success) {
//       return NextResponse.json({ success: true, message: "Database initialized successfully" })
//     } else {
//       return NextResponse.json({ success: false, message: "Database initialization failed" }, { status: 500 })
//     }
//   } catch (error) {
//     console.error("Error initializing database:", error)
//     return NextResponse.json({ success: false, error: "Failed to initialize database" }, { status: 500 })
//   }
// }
