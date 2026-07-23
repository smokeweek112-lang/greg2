"use client"

import { useEffect, useState, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import AdminLayout from "@/components/admin/admin-layout"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import { ru } from "date-fns/locale"
import type { Booking } from "@/lib/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Lightbox } from "@/components/lightbox"
import { Badge } from "@/components/ui/badge"

// Utility to truncate text longer than maxLength and add ellipsis
const truncate = (text = "", maxLength = 32) => {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength - 3)}...`
}

export default function OrdersPage() {
  const searchParams = useSearchParams()
  const statusParam = searchParams.get("status")

  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>(statusParam || "all")
  const [filterPayment, setFilterPayment] = useState<string>("all")
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxImage, setLightboxImage] = useState("")

  const fetchBookings = useCallback(async () => {
    setLoading(true)
    try {
      let url = "/api/bookings"
      const params = new URLSearchParams()

      if (filterStatus !== "all") params.append("status", filterStatus)

      if (params.toString()) url += `?${params.toString()}`

      const response = await fetch(url)
      const data = await response.json()

      if (data.success) setBookings(data.bookings)
      else setError("Failed to load bookings")
    } catch (error) {
      setError("An error occurred while loading bookings")
    } finally {
      setLoading(false)
    }
  }, [filterStatus])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "d MMMM yyyy", { locale: ru })
    } catch {
      return dateString
    }
  }
  const formatDateWithTime = (dateString: string) => {
    try {
      return format(new Date(dateString), "d MMMM yyyy HH:mm:ss", { locale: ru })
    } catch {
      return dateString
    }
  }

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "pending":
        return { text: "Pending", color: "bg-yellow-100 text-yellow-800" }
      case "confirmed":
        return { text: "Confirmed", color: "bg-green-100 text-green-800" }
      case "rejected":
        return { text: "Rejected", color: "bg-red-100 text-red-800" }
      default:
        return { text: "Unknown", color: "bg-neutral-100 text-neutral-800" }
    }
  }

  const getPaymentDisplay = (paymentStatus?: string) => {
    switch (paymentStatus) {
      case "paid":
        return { text: "Paid", color: "bg-green-100 text-green-800" }
      case "failed":
        return { text: "Failed", color: "bg-red-100 text-red-800" }
      default:
        return { text: "Unpaid", color: "bg-neutral-100 text-neutral-700" }
    }
  }

  // Format a Stripe amount (minor units, e.g. cents) as a currency string.
  const formatAmount = (amountMinor?: number) => {
    if (typeof amountMinor !== "number") return null
    return `€${(amountMinor / 100).toFixed(2)}`
  }

  const viewBookingDetails = (booking: Booking) => {
    setLightboxOpen(false)
    setSelectedBooking(booking)
    setShowDetailsDialog(true)
  }
  const openLightbox = (imageUrl: string) => {
    setShowDetailsDialog(false)
    setLightboxImage(imageUrl)
    setLightboxOpen(true)
  }
  const handleLightboxClose = () => {
    setLightboxOpen(false)
    if (selectedBooking) setShowDetailsDialog(true)
  }

  // Payment filtering is applied on the client over the already-fetched list.
  const visibleBookings =
    filterPayment === "all"
      ? bookings
      : bookings.filter((b) => (b.paymentStatus || "unpaid") === filterPayment)

  return (
    <AdminLayout title="Order Management">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-full sm:w-64">
              <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending Confirmation</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-full sm:w-64">
              <Select value={filterPayment} onValueChange={(value) => setFilterPayment(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Payment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payments</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={fetchBookings} variant="outline">
            Refresh
          </Button>
        </div>

        {error && <div className="bg-red-50 text-red-500 p-4 rounded-md">{error}</div>}
        {loading ? (
          <div className="flex justify-center py-10">
            <p>Loading bookings...</p>
          </div>
        ) : visibleBookings.length === 0 ? (
          <div className="text-center py-10 bg-neutral-50 rounded-md">
            <p className="text-neutral-500">No bookings to display</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-neutral-50">
                  <th className="px-4 py-3 text-left text-sm font-medium text-neutral-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-neutral-500 uppercase tracking-wider">
                    Created Date
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-neutral-500 uppercase tracking-wider">
                    Body Part
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-neutral-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-neutral-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-neutral-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {visibleBookings.map((booking) => {
                  const statusDisplay = getStatusDisplay(booking.status)
                  const paymentDisplay = getPaymentDisplay(booking.paymentStatus)
                  const paidAmount = booking.paymentStatus === "paid" ? formatAmount(booking.paymentAmount) : null
                  const name = booking.fullName || booking.name || ""
                  const clientInfo = truncate(name)
                  const parts = Array.isArray(booking.bodyPart)
                    ? booking.bodyPart.join(", ")
                    : booking.bodyPart || "Not specified"
                  const partsTrunc = truncate(parts)

                  return (
                    <tr key={booking._id} className="hover:bg-neutral-50" title={name}>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="font-medium">{clientInfo}</div>
                        <div className="text-sm text-neutral-500" title={booking.phone}>
                          {truncate(booking.phone)}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div>{formatDate(booking.createdAt)}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap" title={parts}>
                        <div className="font-medium">{partsTrunc}</div>
                        <div className="text-sm text-neutral-500">
                          {booking.bodyType === "feminine" ? "Female" : "Male"}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`${statusDisplay.color} px-2 py-1 rounded-full text-xs`}>
                          {statusDisplay.text}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`${paymentDisplay.color} px-2 py-1 rounded-full text-xs`}>
                          {paymentDisplay.text}
                        </span>
                        {paidAmount && <div className="text-xs text-neutral-500 mt-1">{paidAmount}</div>}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right space-x-2">
                        <Button
                          variant="outline"
                          className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
                          onClick={() => viewBookingDetails(booking)}
                          size="sm"
                        >
                          Details
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Booking Details Dialog */}
      {selectedBooking && (
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Booking Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="flex flex-wrap gap-2 mb-2">
                <Badge variant="outline" className={getStatusDisplay(selectedBooking.status).color}>
                  {getStatusDisplay(selectedBooking.status).text}
                </Badge>
                <Badge variant="outline" className={getPaymentDisplay(selectedBooking.paymentStatus).color}>
                  {getPaymentDisplay(selectedBooking.paymentStatus).text}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-neutral-500">Personal Information</h3>
                  <div className="mt-2 space-y-2">
                    <p>
                      <span className="font-medium">Full Name:</span> {selectedBooking.fullName || selectedBooking.name}
                    </p>
                    <p>
                      <span className="font-medium">Email:</span> {selectedBooking.email}
                    </p>
                    <p>
                      <span className="font-medium">Phone:</span> {selectedBooking.phone}
                    </p>
                    <p>
                      <span className="font-medium">Instagram:</span> {selectedBooking.instagram}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-neutral-500">Booking Information</h3>
                  <div className="mt-2 space-y-2">
                    <p>
                      <span className="font-medium">Created Date:</span> {formatDateWithTime(selectedBooking.createdAt)}
                    </p>
                    <p>
                      <span className="font-medium">Preferred Time:</span> {selectedBooking.availability}
                    </p>
                    <p>
                      <span className="font-medium">Status:</span> {getStatusDisplay(selectedBooking.status).text}
                    </p>
                    <p>
                      <span className="font-medium">Payment:</span>{" "}
                      {getPaymentDisplay(selectedBooking.paymentStatus).text}
                      {selectedBooking.paymentStatus === "paid" && formatAmount(selectedBooking.paymentAmount)
                        ? ` — ${formatAmount(selectedBooking.paymentAmount)}`
                        : ""}
                    </p>
                    {selectedBooking.paymentId && (
                      <p className="break-all">
                        <span className="font-medium">Payment ID:</span> {selectedBooking.paymentId}
                      </p>
                    )}
                    {selectedBooking.bookingHash && (
                      <p>
                        <span className="font-medium">Public Link:</span>{" "}
                        <a
                          href={`/booking/${selectedBooking.bookingHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          /booking/{selectedBooking.bookingHash}
                        </a>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-neutral-500">Tattoo Information</h3>
                <div className="mt-2 space-y-2">
                  <p>
                    <span className="font-medium">Body Parts:</span>
                    {Array.isArray(selectedBooking.bodyPart)
                      ? selectedBooking.bodyPart.join(", ")
                      : selectedBooking.bodyPart || "Not specified"}
                  </p>
                  <p>
                    <span className="font-medium">Body Type:</span>{" "}
                    {selectedBooking.bodyType === "feminine" ? "Female" : "Male"}
                  </p>
                  <p>
                    <span className="font-medium">Has Tattoos:</span> {selectedBooking.hasTattoos ? "Yes" : "No"}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-neutral-500">Idea Description</h3>
                <div className="mt-2 p-3 bg-neutral-50 rounded-md">
                  <p className="whitespace-pre-wrap break-words">{selectedBooking.idea || "Not specified"}</p>
                </div>
              </div>

              {/* Body Parts Image */}
              {selectedBooking.bodyPartsImage && (
                <div>
                  <h3 className="text-sm font-medium text-neutral-500">Selected Body Parts</h3>
                  <div className="mt-2">
                    <img
                      src={selectedBooking.bodyPartsImage || "/placeholder.svg"}
                      alt="Selected body parts"
                      className="max-h-64 rounded-md object-contain cursor-pointer border"
                      onClick={() => openLightbox(selectedBooking.bodyPartsImage!)}
                    />
                  </div>
                </div>
              )}

              {selectedBooking.tattooImage && (
                <div>
                  <h3 className="text-sm font-medium text-neutral-500">Tattoo Example</h3>
                  <div className="mt-2">
                    <img
                      src={selectedBooking.tattooImage || "/placeholder.svg"}
                      alt="Example of a tattoo"
                      className="max-h-64 rounded-md object-contain cursor-pointer"
                      onClick={() => openLightbox(selectedBooking.tattooImage)}
                    />
                  </div>
                </div>
              )}

            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Image Lightbox */}
      <Lightbox open={lightboxOpen} onClose={handleLightboxClose} image={lightboxImage} />
    </AdminLayout>
  )
}