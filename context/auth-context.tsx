"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

// Demo admin credentials
const DEMO_ADMIN = {
  email: "admin@portfolio.com",
  password: "admin123",
  name: "Admin User",
}

type User = {
  email: string
  name: string
  isAdmin: boolean
}

type AuthContextType = {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check for existing session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("portfolio-user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setIsLoading(false)
  }, [])

  // Save user to localStorage when it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem("portfolio-user", JSON.stringify(user))
    } else {
      localStorage.removeItem("portfolio-user")
    }
  }, [user])

  const login = async (email: string, password: string) => {
    // Simulate API call
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Check against demo credentials
    if (email === DEMO_ADMIN.email && password === DEMO_ADMIN.password) {
      setUser({
        email: DEMO_ADMIN.email,
        name: DEMO_ADMIN.name,
        isAdmin: true,
      })
      setIsLoading(false)
      return true
    }

    setIsLoading(false)
    return false
  }

  const logout = () => {
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, login, logout, isLoading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
