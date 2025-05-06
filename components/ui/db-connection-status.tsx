"use client"

import { useState } from "react"
import { useSections } from "@/context/section-context"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle, RefreshCw, Database } from "lucide-react"

export function DbConnectionStatus() {
  const { connectionStatus, retryConnection, error } = useSections()
  const [isRetrying, setIsRetrying] = useState(false)

  const handleRetry = async () => {
    setIsRetrying(true)
    try {
      await retryConnection()
    } finally {
      setIsRetrying(false)
    }
  }

  if (connectionStatus === "unknown" || connectionStatus === "checking") {
    return (
      <div className="fixed bottom-4 right-4 bg-yellow-100 text-yellow-800 p-3 rounded-md shadow-md flex items-center space-x-2 z-50">
        <Database className="h-5 w-5" />
        <span>Checking database connection...</span>
      </div>
    )
  }

  if (connectionStatus === "error") {
    return (
      <div className="fixed bottom-4 right-4 bg-red-100 text-red-800 p-3 rounded-md shadow-md flex flex-col z-50">
        <div className="flex items-center space-x-2 mb-2">
          <AlertCircle className="h-5 w-5" />
          <span>Database connection error</span>
        </div>
        {error && <p className="text-xs mb-2">{error}</p>}
        <Button
          variant="outline"
          size="sm"
          onClick={handleRetry}
          disabled={isRetrying}
          className="flex items-center space-x-1"
        >
          <RefreshCw className={`h-4 w-4 ${isRetrying ? "animate-spin" : ""}`} />
          <span>{isRetrying ? "Retrying..." : "Retry Connection"}</span>
        </Button>
        <p className="text-xs mt-2">Using local storage data for now</p>
      </div>
    )
  }

  if (connectionStatus === "connected") {
    return (
      <div className="fixed bottom-4 right-4 bg-green-100 text-green-800 p-3 rounded-md shadow-md flex items-center space-x-2 z-50 animate-fadeOut">
        <CheckCircle className="h-5 w-5" />
        <span>Connected to database</span>
      </div>
    )
  }

  return null
}
