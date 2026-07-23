import { MongoClient, type Db, type Collection, ObjectId } from "mongodb"
import type { Booking, TelegramAdmin, TimeSlot } from "./types"
import { createHash } from "crypto"

// MongoDB connection string
const uri = process.env.MONGODB_URI
const dbName = process.env.MONGODB_DB

// Cached connection
let cachedClient: MongoClient | null = null
let cachedDb: Db | null = null

export async function connectToDatabase(): Promise<{
  client: MongoClient
  db: Db
  bookings: Collection<Booking>
  timeSlots: Collection<TimeSlot>
  telegramAdmins: Collection<TelegramAdmin>
}> {
  // If we already have a connection, use it
  if (cachedClient && cachedDb) {
    return {
      client: cachedClient,
      db: cachedDb,
      bookings: cachedDb.collection<Booking>("bookings"),
      timeSlots: cachedDb.collection<TimeSlot>("timeSlots"),
      telegramAdmins: cachedDb.collection<TelegramAdmin>("telegramAdmins"),
    }
  }

  // Connect to the database
  const client = await MongoClient.connect(uri!)
  const db = client.db(dbName)

  // Cache the connection
  cachedClient = client
  cachedDb = db

  return {
    client,
    db,
    bookings: db.collection<Booking>("bookings"),
    timeSlots: db.collection<TimeSlot>("timeSlots"),
    telegramAdmins: db.collection<TelegramAdmin>("telegramAdmins"),
  }
}

export async function getDb(): Promise<Db> {
  const { db } = await connectToDatabase()
  return db
}

// Generate a unique hash for a booking
export function generateBookingHash(bookingId: string, username: string): string {
  return createHash("sha256").update(`${bookingId}-${username}-${Date.now()}`).digest("hex").substring(0, 12)
}

// Get all bookings
export async function getAllBookings(): Promise<Booking[]> {
  const { bookings } = await connectToDatabase()
  return bookings.find({}).sort({ createdAt: -1 }).toArray()
}

// Add a new booking
export async function addBooking(booking: Omit<Booking, "_id" | "bookingHash">): Promise<{
  id: string
  bookingHash: string
}> {
  const { bookings } = await connectToDatabase()
  const newBookingId = new ObjectId()
  const bookingHash = generateBookingHash(newBookingId.toString(), booking.username)

  // Unpaid bookings get a payment window; a scheduled job later marks overdue ones as failed.
  const expiryDays = Number(process.env.BOOKING_UNPAID_EXPIRY_DAYS) || 7
  const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toISOString()

  const newBooking = {
    ...booking,
    _id: newBookingId,
    bookingHash,
    status: "pending",
    paymentStatus: "unpaid",
    expiresAt,
    createdAt: new Date().toISOString(),
    notifiedAdmins: false,
  }

  await bookings.insertOne(newBooking)

  return { id: newBookingId.toString(), bookingHash }
}

// Mark a booking as paid after a Stripe payment has been verified server-side.
// `sessionId` is the Stripe Checkout session id and is stored as the payment id.
// Guards against reusing one Stripe session across different bookings (fraud/replay).
export async function markBookingPaid(
  bookingHash: string,
  sessionId: string,
  amountCents: number,
): Promise<{ ok: boolean; reason?: string; newlyPaid: boolean; booking: Booking | null }> {
  const { bookings } = await connectToDatabase()

  // A given Stripe session must never mark more than one booking as paid.
  const sessionUsedElsewhere = await bookings.findOne({
    paymentId: sessionId,
    bookingHash: { $ne: bookingHash },
  })
  if (sessionUsedElsewhere) {
    return { ok: false, reason: "session_already_used", newlyPaid: false, booking: null }
  }

  const now = new Date().toISOString()

  // Only transition bookings that are not already paid. This makes the operation
  // idempotent, so the Stripe webhook and the redirect callback can both call it
  // without double-marking or sending duplicate notifications. Paying also confirms
  // the booking (no separate admin approval step is required).
  const result = await bookings.updateOne(
    { bookingHash, paymentStatus: { $ne: "paid" } },
    {
      $set: {
        paymentStatus: "paid",
        status: "confirmed",
        paymentId: sessionId,
        paymentAmount: amountCents,
        updatedAt: now,
      },
    },
  )

  const booking = await bookings.findOne({ bookingHash })

  return {
    ok: booking !== null,
    reason: booking ? undefined : "booking_not_found",
    newlyPaid: result.modifiedCount > 0,
    booking,
  }
}

// Mark unpaid bookings whose payment window (expiresAt) has passed as "failed".
// Non-destructive: the booking and all its data are kept — only paymentStatus changes.
// Paid bookings and bookings without an expiresAt are never touched.
export async function expireUnpaidBookings(): Promise<number> {
  const { bookings } = await connectToDatabase()
  const now = new Date().toISOString()

  const result = await bookings.updateMany(
    {
      paymentStatus: "unpaid",
      expiresAt: { $lt: now },
    },
    {
      $set: { paymentStatus: "failed", updatedAt: now },
    },
  )

  return result.modifiedCount
}

// Update booking status
export async function updateBookingStatus(id: string, status: "pending" | "confirmed" | "rejected"): Promise<boolean> {
  const { bookings } = await connectToDatabase()
  const result = await bookings.updateOne({ _id: new ObjectId(id) }, { $set: { status } })
  return result.modifiedCount > 0
}

// Get booking by ID
export async function getBookingById(id: string): Promise<Booking | null> {
  const { bookings } = await connectToDatabase()
  return bookings.findOne({ _id: new ObjectId(id) })
}

// Get booking by hash
export async function getBookingByHash(hash: string): Promise<Booking | null> {
  const { bookings } = await connectToDatabase()
  return bookings.findOne({ bookingHash: hash })
}

// Get bookings by status
export async function getBookingsByStatus(status: "pending" | "confirmed" | "rejected"): Promise<Booking[]> {
  const { bookings } = await connectToDatabase()
  return bookings.find({ status }).sort({ createdAt: -1 }).toArray()
}

// Get bookings by date
export async function getBookingsByDate(date: string): Promise<Booking[]> {
  const { bookings } = await connectToDatabase()
  // Match bookings for the given date (YYYY-MM-DD format)
  return bookings
    .find({
      date: { $regex: `^${date}` },
    })
    .toArray()
}

// Get Telegram admins
export async function getTelegramAdmins(): Promise<TelegramAdmin[]> {
  const { telegramAdmins } = await connectToDatabase()
  return telegramAdmins.find({}).toArray()
}

// Add Telegram admin
export async function addTelegramAdmin(chatId: string, name: string): Promise<boolean> {
  const { telegramAdmins } = await connectToDatabase()

  // Check if admin already exists
  const existingAdmin = await telegramAdmins.findOne({ chatId })

  if (existingAdmin) {
    return true
  }

  const result = await telegramAdmins.insertOne({
    _id: new ObjectId(),
    chatId,
    name,
    createdAt: new Date().toISOString(),
  })

  return result.acknowledged
}

// Remove Telegram admin
export async function removeTelegramAdmin(chatId: string): Promise<boolean> {
  const { telegramAdmins } = await connectToDatabase()
  const result = await telegramAdmins.deleteOne({ chatId })
  return result.deletedCount > 0
}

// Check if time slot is available
export async function isTimeSlotAvailable(date: string, time: string): Promise<boolean> {
  const { timeSlots } = await connectToDatabase()

  // Format date to YYYY-MM-DD format if it's a Date object
  const formattedDate = typeof date === "object" ? new Date(date).toISOString().split("T")[0] : date.split("T")[0]

  const existingTimeSlot = await timeSlots.findOne({
    date: formattedDate,
    time,
  })

  return !existingTimeSlot
}

// Get available time slots for a date
export async function getAvailableTimesForDate(date: string): Promise<string[]> {
  // Available hours (10:00 to 20:00)
  const allTimes = Array.from({ length: 11 }, (_, i) => {
    const hour = i + 10
    return `${hour}:00`
  })

  const { timeSlots } = await connectToDatabase()

  // Format date to YYYY-MM-DD format
  const formattedDate = typeof date === "object" ? new Date(date).toISOString().split("T")[0] : date.split("T")[0]

  // Find all booked slots for this date
  const bookedSlots = await timeSlots.find({ date: formattedDate }).toArray()
  const bookedTimes = new Set(bookedSlots.map((slot) => slot.time))

  // Return times that are not booked
  return allTimes.filter((time) => !bookedTimes.has(time))
}

// Get all time slots for a date
export async function getTimeSlotsForDate(date: string): Promise<TimeSlot[]> {
  const { timeSlots } = await connectToDatabase()

  // Format date to YYYY-MM-DD format
  const formattedDate = typeof date === "object" ? new Date(date).toISOString().split("T")[0] : date.split("T")[0]

  return timeSlots.find({ date: formattedDate }).sort({ time: 1 }).toArray()
}

// Add a time slot (either blocked by admin or booked by client)
export async function addTimeSlot(slot: Omit<TimeSlot, "_id" | "createdAt">): Promise<string> {
  const { timeSlots } = await connectToDatabase()

  // Check if slot already exists
  const existingSlot = await timeSlots.findOne({
    date: slot.date,
    time: slot.time,
  })

  if (existingSlot) {
    throw new Error("This time slot is already taken")
  }

  const result = await timeSlots.insertOne({
    ...slot,
    _id: new ObjectId(),
    createdAt: new Date().toISOString(),
  })

  return result.insertedId.toString()
}

// Add multiple time slots at once
export async function addMultipleTimeSlots(
  date: string,
  times: string[],
  note: string,
): Promise<{ success: boolean; addedCount: number }> {
  const { timeSlots } = await connectToDatabase()
  let addedCount = 0

  for (const time of times) {
    try {
      // Check if slot already exists
      const existingSlot = await timeSlots.findOne({
        date,
        time,
      })

      if (!existingSlot) {
        await timeSlots.insertOne({
          date,
          time,
          fullName: "BLOCKED",
          isBlocked: true,
          note: note || "",
          createdAt: new Date().toISOString(),
        })
        addedCount++
      }
    } catch (error) {
      console.error(`Error adding time slot for ${date} ${time}:`, error)
    }
  }

  return { success: addedCount > 0, addedCount }
}

// Remove a time slot
export async function removeTimeSlot(id: string): Promise<boolean> {
  const { timeSlots } = await connectToDatabase()
  const result = await timeSlots.deleteOne({ _id: new ObjectId(id) })
  return result.deletedCount > 0
}

// Get statistics
export async function getStatistics() {
  const { bookings } = await connectToDatabase()

  const totalBookings = await bookings.countDocuments({ isBlocked: { $ne: true } })
  const pendingBookings = await bookings.countDocuments({ status: "pending", isBlocked: { $ne: true } })
  const confirmedBookings = await bookings.countDocuments({ status: "confirmed", isBlocked: { $ne: true } })
  const rejectedBookings = await bookings.countDocuments({ status: "rejected", isBlocked: { $ne: true } })

  // Calculate bookings per month for the current year
  const currentYear = new Date().getFullYear()
  const bookingsPerMonth = []

  for (let month = 0; month < 12; month++) {
    const startDate = new Date(currentYear, month, 1)
    const endDate = new Date(currentYear, month + 1, 0)

    const count = await bookings.countDocuments({
      createdAt: {
        $gte: startDate.toISOString(),
        $lte: endDate.toISOString(),
      },
      isBlocked: { $ne: true },
    })

    bookingsPerMonth.push(count)
  }

  return {
    totalBookings,
    pendingBookings,
    confirmedBookings,
    rejectedBookings,
    bookingsPerMonth,
  }
}

// Initialize database with seed data if empty
export async function initializeDatabase() {
  // Intentionally left blank
}

// Cleanup Functions
export async function cleanupOldBookings(olderThanDays = 30): Promise<number> {
  const { bookings } = await connectToDatabase()
  const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000).toISOString()

  const result = await bookings.deleteMany({
    status: "rejected",
    createdAt: { $lt: cutoffDate },
  })

  return result.deletedCount
}

// Utility Functions
export async function closeConnection(): Promise<void> {
  if (cachedClient) {
    await cachedClient.close()
    cachedClient = null
    cachedDb = null
    console.log("MongoDB connection closed")
  }
}

export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const { db } = await connectToDatabase()
    await db.admin().ping()
    return true
  } catch (error) {
    console.error("Database health check failed:", error)
    return false
  }
}