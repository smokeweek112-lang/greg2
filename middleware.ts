import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getCurrentUser, addSecurityHeaders } from "@/lib/auth"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const response = NextResponse.next()
  addSecurityHeaders(response)

  // Protect admin dashboard pages: redirect unauthenticated users to the login page.
  // `/admin` itself is the login page and stays public.
  if (pathname.startsWith("/admin") && pathname !== "/admin") {
    const user = await getCurrentUser(request)

    if (!user || user.type !== "access" || user.role !== "admin") {
      return NextResponse.redirect(new URL("/admin", request.url))
    }
  }

  // Protect admin API routes (defense in depth — each route also checks auth).
  // `/api/auth/*` is excluded so login/refresh/logout stay reachable.
  if (pathname.startsWith("/api/admin")) {
    const user = await getCurrentUser(request)

    if (!user || user.type !== "access" || user.role !== "admin") {
      return addSecurityHeaders(
        NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }),
      )
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
}
