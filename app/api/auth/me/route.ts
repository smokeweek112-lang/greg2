import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser, addSecurityHeaders } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)

    if (!user) {
      return addSecurityHeaders(
        NextResponse.json(
          { success: false, error: "Not authenticated" },
          { status: 401 }
        )
      )
    }

    return addSecurityHeaders(
      NextResponse.json({
        success: true,
        user: {
          username: user.username,
          role: user.role,
        },
      })
    )
  } catch (error) {
    console.error("Auth check error:", error)
    return addSecurityHeaders(
      NextResponse.json(
        { success: false, error: "Internal server error" },
        { status: 500 }
      )
    )
  }
}