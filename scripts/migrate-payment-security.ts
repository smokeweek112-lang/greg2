import { connectToDatabase } from '@/lib/db'

async function migratePaymentSecurity() {
  try {
    console.log('🔧 Starting payment security migration...')

    const { db, bookings } = await connectToDatabase()

    // 1. Create a composite index for quick search by paymentId + paymentStatus
    await bookings.createIndex({
      paymentId: 1,
      paymentStatus: 1
    }, {
      name: 'paymentId_paymentStatus_index',
      background: true
    })
    console.log('✅ Created paymentId + paymentStatus index')

    // 2. Create an index for bookingHash (if it doesn't exist yet)
    await bookings.createIndex({
      bookingHash: 1
    }, {
      unique: true,
      name: 'bookingHash_unique_index',
      background: true
    })
    console.log('✅ Created bookingHash index')

    // 3. Create an index for expiresAt for automatic clearing
    await bookings.createIndex({
      expiresAt: 1
    }, {
      name: 'expiresAt_index',
      background: true
    })
    console.log('✅ Created expiresAt index')

    // 4. Update existing orders without paymentStatus
    const updateResult = await bookings.updateMany(
      { paymentStatus: { $exists: false } },
      {
        $set: {
          paymentStatus: 'unpaid',
          updatedAt: new Date().toISOString()
        }
      }
    )
    console.log(`✅ Updated ${updateResult.modifiedCount} bookings with paymentStatus`)

    // 5. Add expiresAt for unpaid orders without this field
    const expiredDate = new Date()
    expiredDate.setDate(expiredDate.getDate() + 7)

    const expireResult = await bookings.updateMany(
      {
        paymentStatus: 'unpaid',
        expiresAt: { $exists: false }
      },
      {
        $set: {
          expiresAt: expiredDate.toISOString(),
          updatedAt: new Date().toISOString()
        }
      }
    )
    console.log(`✅ Added expiration date to ${expireResult.modifiedCount} unpaid bookings`)

    // 6. Find potential duplicates of paymentId (if any)
    const duplicatePaymentIds = await bookings.aggregate([
      {
        $match: {
          paymentId: { $exists: true, $ne: null },
          paymentStatus: 'paid'
        }
      },
      {
        $group: {
          _id: '$paymentId',
          count: { $sum: 1 },
          bookings: { $push: { bookingHash: '$bookingHash', _id: '$_id' } }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ]).toArray()

    if (duplicatePaymentIds.length > 0) {
      console.log('🚨 FOUND POTENTIAL FRAUD - Duplicate payment IDs:')
      duplicatePaymentIds.forEach(dup => {
        console.log(`   Payment ID: ${dup._id} used by ${dup.count} bookings:`)
        dup.bookings.forEach((booking: any) => {
          console.log(`     - ${booking.bookingHash} (${booking._id})`)
        })
      })
     
      // Flag suspicious orders (except for the first one)
      for (const dup of duplicatePaymentIds) {
        // All except the first
        const bookingsToFlag = dup.bookings.slice(1)

        for (const booking of bookingsToFlag) {
          await bookings.updateOne(
            { _id: booking._id },
            {
              $set: {
                paymentStatus: 'failed',
                fraudDetected: true,
                fraudReason: 'Duplicate payment ID detected during migration',
                updatedAt: new Date().toISOString()
              }
            }
          )
        }
      }
      console.log('🔒 Flagged suspicious bookings with duplicate payment IDs')
    } else {
      console.log('✅ No duplicate payment IDs found')
    }
   
    console.log('🎉 Payment security migration completed successfully!')
   
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  }
}

// Start migration
if (require.main === module) {
  migratePaymentSecurity().then(() => {
    console.log('Migration completed')
    process.exit(0)
  }).catch((error) => {
    console.error('Migration failed:', error)
    process.exit(1)
  })
}

export default migratePaymentSecurity