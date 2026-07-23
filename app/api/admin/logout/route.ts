import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST() {
  // Delete the admin session cookie
  const cookieStore = cookies()
  await cookieStore.delete("admin_session")

  return NextResponse.json({ success: true })
}
