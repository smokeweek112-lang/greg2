import { SignJWT, jwtVerify } from "jose"
import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required")
}

if (!process.env.ADMIN_USERNAME) {
  throw new Error("ADMIN_USERNAME environment variable is required")
}

if (!process.env.ADMIN_PASSWORD) {
  throw new Error("ADMIN_PASSWORD environment variable is required")
}

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET)
const JWT_ALGORITHM = "HS256"
const ACCESS_TOKEN_EXPIRES_IN = 24 * 60 * 60 // 24 hours in seconds
const REFRESH_TOKEN_EXPIRES_IN = 7 * 24 * 60 * 60 // 7 days in seconds

export interface JWTPayload {
  username: string
  role: string
  type: "access" | "refresh"
  iat: number
  exp: number
}

// Verify admin credentials
export function verifyAdminCredentials(username: string, password: string): boolean {
  return username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD
}

// Generate JWT tokens using jose
export async function generateTokens(payload: Omit<JWTPayload, "type" | "iat" | "exp">): Promise<{
  accessToken: string
  refreshToken: string
}> {
  const now = Math.floor(Date.now() / 1000)

  // Access token (24 hours)
  const accessToken = await new SignJWT({ ...payload, type: "access" })
    .setProtectedHeader({ alg: JWT_ALGORITHM })
    .setIssuedAt(now)
    .setExpirationTime(now + ACCESS_TOKEN_EXPIRES_IN)
    .sign(JWT_SECRET)

  // Refresh token (7 days)
  const refreshToken = await new SignJWT({ ...payload, type: "refresh" })
    .setProtectedHeader({ alg: JWT_ALGORITHM })
    .setIssuedAt(now)
    .setExpirationTime(now + REFRESH_TOKEN_EXPIRES_IN)
    .sign(JWT_SECRET)

  return { accessToken, refreshToken }
}

// Verify JWT token using jose
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as JWTPayload
  } catch (error) {
    console.error("Token verification failed:", error)
    return null
  }
}

// Set secure HTTP-only cookies
export async function setAuthCookies(accessToken: string, refreshToken: string): Promise<NextResponse> {
  const response = NextResponse.json({ success: true })

  // Set access token cookie (24 hours)
  response.cookies.set("access_token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: ACCESS_TOKEN_EXPIRES_IN,
    path: "/",
  })

  // Set refresh token cookie (7 days)
  response.cookies.set("refresh_token", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: REFRESH_TOKEN_EXPIRES_IN,
    path: "/",
  })

  return response
}

// Clear auth cookies
export async function clearAuthCookies(): Promise<NextResponse> {
  const response = NextResponse.json({ success: true })

  response.cookies.delete("access_token")
  response.cookies.delete("refresh_token")

  return response
}

// Get current user from request
export async function getCurrentUser(request?: NextRequest): Promise<JWTPayload | null> {
  try {
    let accessToken: string | undefined

    if (request) {
      accessToken = request.cookies.get("access_token")?.value
    } else {
      const cookieStore = await cookies()
      accessToken = cookieStore.get("access_token")?.value
    }

    if (!accessToken) {
      return null
    }

    return await verifyToken(accessToken)
  } catch (error) {
    console.error("getCurrentUser error:", error)
    return null
  }
}

// Add security headers
export function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-XSS-Protection", "1; mode=block")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")

  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
  }

  return response
}

// Middleware helper for protected routes
export async function requireAuth(request: NextRequest): Promise<{ user: JWTPayload } | NextResponse> {
  const user = await getCurrentUser(request)

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (user.type !== "access") {
    return NextResponse.json({ error: "Invalid token type" }, { status: 401 })
  }

  return { user }
}

// Route-handler helper: require a valid admin access token.
// Reads the session from the request cookies via next/headers, so it works for
// both `Request` and `NextRequest` handlers. Returns the user, or a ready-to-send
// 401 NextResponse when the caller is not an authenticated admin.
export async function requireAdmin(): Promise<{ user: JWTPayload } | NextResponse> {
  const user = await getCurrentUser()

  if (!user || user.type !== "access" || user.role !== "admin") {
    return addSecurityHeaders(
      NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }),
    )
  }

  return { user }
}