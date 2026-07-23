import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/db"
import { ObjectId } from "mongodb"
import { requireAdmin } from "@/lib/auth"

// GET: Fetch Telegram admins
export async function GET() {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { db } = await connectToDatabase()
    const telegramAdminsCollection = db.collection("telegramAdmins")

    const admins = await telegramAdminsCollection.find({}).toArray()

    return NextResponse.json({ success: true, admins })
  } catch (error) {
    console.error("Error fetching Telegram admins:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch Telegram admins" }, { status: 500 })
  }
}

// POST: Add a new Telegram admin
export async function POST(request: Request) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { chatId, name } = await request.json()

    if (!chatId || !name) {
      return NextResponse.json({ success: false, error: "Chat ID and name are required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const telegramAdminsCollection = db.collection("telegramAdmins")

    // Check if the admin already exists
    const existingAdmin = await telegramAdminsCollection.findOne({ chatId })
    if (existingAdmin) {
      return NextResponse.json({ success: false, error: "This chat ID is already registered" }, { status: 400 })
    }

    // Add the admin
    await telegramAdminsCollection.insertOne({
      _id: new ObjectId(),
      chatId,
      name,
      addedAt: new Date().toISOString(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error adding Telegram admin:", error)
    return NextResponse.json({ success: false, error: "Failed to add Telegram admin" }, { status: 500 })
  }
}

// DELETE: Remove a Telegram admin
export async function DELETE(request: Request) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ success: false, error: "Admin ID is required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const telegramAdminsCollection = db.collection("telegramAdmins")

    // Remove the admin
    const result = await telegramAdminsCollection.deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, error: "Admin not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error removing Telegram admin:", error)
    return NextResponse.json({ success: false, error: "Failed to remove Telegram admin" }, { status: 500 })
  }
}
