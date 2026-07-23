import { type NextRequest, NextResponse } from "next/server"
import { generateTokens, setAuthCookies, verifyAdminCredentials, addSecurityHeaders } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    // Validate input
    if (!username || !password) {
      return addSecurityHeaders(
        NextResponse.json(
          { success: false, error: "Username and password are required" },
          { status: 400 }
        )
      )
    }

    // Verify credentials against .env variables
    if (!verifyAdminCredentials(username, password)) {
      return addSecurityHeaders(
        NextResponse.json(
          { success: false, error: "Invalid credentials" },
          { status: 401 }
        )
      )
    }

    // Generate tokens
    const { accessToken, refreshToken } = await generateTokens({
      username,
      role: "admin",
    })

    // Set cookies and return success
    const response = await setAuthCookies(accessToken, refreshToken)
    return addSecurityHeaders(response)

  } catch (error) {
    console.error("Login error:", error)
    return addSecurityHeaders(
      NextResponse.json(
        { success: false, error: "Internal server error" },
        { status: 500 }
      )
    )
  }
}