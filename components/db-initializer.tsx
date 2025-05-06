"use client"

import { useEffect, useState } from "react"

export function DatabaseInitializer() {
  const [initialized, setInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function init() {
      try {
        const response = await fetch("/api/init-db")
        const data = await response.json()

        setInitialized(data.success)
        if (!data.success) {
          setError(data.message || "Failed to initialize database")
        }
      } catch (err) {
        console.error("Database initialization error:", err)
        setError("Error initializing database")
      }
    }

    init()
  }, [])

  // This component doesn't render anything visible
  return null
}
