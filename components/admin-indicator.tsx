"use client"

import { useAuth } from "@/context/auth-context"
import { Shield } from "lucide-react"

export default function AdminIndicator() {
  const { user } = useAuth()

  if (!user?.isAdmin) return null

  return (
    <div className="fixed bottom-4 left-4 bg-red-600 text-white px-3 py-2 rounded-full shadow-lg flex items-center gap-2 z-50">
      <Shield className="h-4 w-4" />
      <span className="text-sm font-medium">Admin Mode</span>
    </div>
  )
}
