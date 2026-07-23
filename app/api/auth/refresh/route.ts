import { type NextRequest, NextResponse } from "next/server"
import { verifyToken, generateTokens, setAuthCookies, addSecurityHeaders } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get("refresh_token")?.value

    if (!refreshToken) {
      return addSecurityHeaders(
        NextResponse.json(
          { success: false, error: "No refresh token" },
          { status: 401 }
        )
      )
    }

    // Verify refresh token
    const payload = await verifyToken(refreshToken)
    if (!payload || payload.type !== "refresh") {
      return addSecurityHeaders(
        NextResponse.json(
          { success: false, error: "Invalid refresh token" },
          { status: 401 }
        )
      )
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = await generateTokens({
      username: payload.username,
      role: payload.role,
    })

    // Set new cookies
    const response = await setAuthCookies(accessToken, newRefreshToken)
    return addSecurityHeaders(response)

  } catch (error) {
    console.error("Token refresh error:", error)
    return addSecurityHeaders(
      NextResponse.json(
        { success: false, error: "Internal server error" },
        { status: 500 }
      )
    )
  }
}