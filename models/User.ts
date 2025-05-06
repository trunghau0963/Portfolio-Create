import type { ObjectId } from "mongodb"

export interface User {
  _id?: ObjectId
  email: string
  name: string
  password: string
  isAdmin: boolean
  createdAt: Date
  updatedAt: Date
}

export interface SafeUser {
  id: string
  email: string
  name: string
  isAdmin: boolean
}

export function sanitizeUser(user: User): SafeUser {
  return {
    id: user._id?.toString() || "",
    email: user.email,
    name: user.name,
    isAdmin: user.isAdmin,
  }
}
