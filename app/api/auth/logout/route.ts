import { type NextRequest, NextResponse } from "next/server"
import { clearAuthCookies, addSecurityHeaders } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const response = await clearAuthCookies()
    return addSecurityHeaders(response)
  } catch (error) {
    console.error("Logout error:", error)
    return addSecurityHeaders(
      NextResponse.json(
        { success: false, error: "Internal server error" },
        { status: 500 }
      )
    )
  }
}