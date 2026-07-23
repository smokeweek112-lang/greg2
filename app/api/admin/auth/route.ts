import { type NextRequest, NextResponse } from "next/server"
import { addSecurityHeaders } from "@/lib/auth"

export async function POST(request: NextRequest) {
  return addSecurityHeaders(
    NextResponse.json(
      {
        error: "This endpoint is deprecated. Use /api/auth/login instead.",
      },
      { status: 404 },
    ),
  )
}

export async function GET() {
  return addSecurityHeaders(
    NextResponse.json(
      {
        error: "This endpoint is deprecated. Use /api/auth/me instead.",
      },
      { status: 404 },
    ),
  )
}
