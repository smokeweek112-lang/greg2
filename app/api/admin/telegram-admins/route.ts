import { NextResponse, type NextRequest } from "next/server"
import { ObjectId } from "mongodb"
import { connectToDatabase } from "@/lib/db"
import { requireAdmin } from "@/lib/auth"

// Get all Telegram admins
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { db } = await connectToDatabase()
    const collection = db.collection("telegramAdmins")

    const admins = await collection.find({}).toArray()

    return NextResponse.json({
      success: true,
      admins: admins.map((admin) => ({
        id: admin._id.toString(),
        name: admin.name,
        chatId: admin.chatId,
      })),
    })
  } catch (error) {
    console.error("Error getting Telegram admins:", error)
    return NextResponse.json({ success: false, error: "Failed to get Telegram admins" }, { status: 500 })
  }
}

// Add a new Telegram admin
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { name, chatId } = await request.json()

    if (!name || !chatId) {
      return NextResponse.json({ success: false, error: "Name and chatId are required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const collection = db.collection("telegramAdmins")

    // Check if admin with this chatId already exists
    const existingAdmin = await collection.findOne({ chatId })
    if (existingAdmin) {
      return NextResponse.json({ success: false, error: "Admin with this Chat ID already exists" }, { status: 400 })
    }

    // Insert new admin
    const result = await collection.insertOne({
      _id: new ObjectId(),
      name,
      chatId,
      createdAt: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      id: result.insertedId.toString(),
    })
  } catch (error) {
    console.error("Error adding Telegram admin:", error)
    return NextResponse.json({ success: false, error: "Failed to add Telegram admin" }, { status: 500 })
  }
}

// Delete a Telegram admin
export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ success: false, error: "Admin ID is required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const collection = db.collection("telegramAdmins")

    const result = await collection.deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, error: "Admin not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting Telegram admin:", error)
    return NextResponse.json({ success: false, error: "Failed to delete Telegram admin" }, { status: 500 })
  }
}
