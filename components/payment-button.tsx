"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, CreditCard, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

const rotatingLogos = [
  "/images/unionpay.svg",
  "/images/jcb.svg",
  "/images/discover.svg",
  "/images/diners.svg",
  "/images/amex.svg",
]

interface PaymentButtonProps {
  bookingHash: string
  price?: number
  currency?: string
  isPaid?: boolean
  className?: string
}

export default function PaymentButton({
  bookingHash,
  price = Number(process.env.NEXT_PUBLIC_BOOKING_PRICE) || 100,
  currency = "eur",
  isPaid = false,
  className = "",
}: PaymentButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showErrorDialog, setShowErrorDialog] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("")
  const [currentLogoIndex, setCurrentLogoIndex] = useState(0);

  const formatCurrency = (amount: number, currency: string) => {
    const currencySymbol = currency === "eur" ? "€" : currency === "usd" ? "$" : "£"
    return `${amount}${currencySymbol}`
  }

  const handlePaymentMethodSelect = (method: string) => {
    setSelectedPaymentMethod(method)
  }

  const handlePayment = async () => {
    if (isPaid || !selectedPaymentMethod) return
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookingHash,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP error ${response.status}: ${errorText}`)
      }

      const data = await response.json()
      if (data.success && data.url) {
        // Verify Turnstile token
        if (data.sessionId) {
          localStorage.setItem(`payment_session_${bookingHash}`, data.sessionId)
        }
        
        // If this is an existing payment, display a notification
        if (data.isExisting) {
          console.log("Redirecting to existing payment session")
        }
        
        window.location.href = data.url
      } else {
        setError(data.error || "Unknown error when creating a payment")
        setShowErrorDialog(true)
        setShowPaymentModal(false)
      }
    } catch (error) {
      console.error("Error creating payment:", error)
      let errorMessage = "Error creating payment"
      
      if (error instanceof Error) {
        // Improved error handling
        if (error.message.includes("already paid")) {
          errorMessage = "This booking is already paid"
        } else if (error.message.includes("not found")) {
          errorMessage = "Booking not found"
        } else {
          errorMessage = error.message
        }
      }
      
      setError(errorMessage)
      setShowErrorDialog(true)
      setShowPaymentModal(false)
    } finally {
      setLoading(false)
    }
  }

  const openPaymentModal = () => {
    setShowPaymentModal(true)
    setSelectedPaymentMethod("")
  }

  const closePaymentModal = () => {
    setShowPaymentModal(false)
    setSelectedPaymentMethod("")
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentLogoIndex((prevIndex) => (prevIndex + 1) % rotatingLogos.length);
    }, 2000);
  
    return () => clearInterval(interval);
  }, []);

  if (isPaid) {
    return (
      <Button disabled className={`bg-green-600 hover:bg-green-700 ${className}`}>
        <CreditCard className="mr-2 h-4 w-4" />
        Paid
      </Button>
    )
  }

  return (
    <>
      <Button 
        onClick={openPaymentModal} 
        disabled={loading} 
        className={`border border-neutral-800 bg-neutral-700/50 text-white px-8 py-2 rounded text-lg transition-all duration-300 hover:scale-95 hover:bg-neutral-900/50 focus:scale-95 focus:bg-neutral-400/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:bg-neutral-500/50 ${className}`}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-4 w-4" />
            Pay {formatCurrency(price, currency)}
          </>
        )}
      </Button>

      {/* Payment Modal Overlay */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Blurred Background */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-md opacity-0 animate-fadeIn transition-all duration-500"
            onClick={closePaymentModal}
          />
          
          {/* Payment Modal */}
          <div className="relative bg-transparent rounded-lg p-10 max-w-2xl w-full text-white">
            {/* Close Button */}
            <button
              onClick={closePaymentModal}
              className="absolute top-6 right-6 text-neutral-400 hover:text-white transition-colors"
            >
              <X className="h-8 w-8" />
            </button>

            {/* Header */}
            <div className="mb-10">
              <h2 className="text-3xl font-medium text-left mb-1">
                To pay: {formatCurrency(price, currency)}
              </h2>
              <p className="text-neutral-400 text-lg text-left">
                Select the payment method convenient for you and complete the purchase
              </p>
            </div>

            {/* Payment Methods */}
            <div className="mb-12">
              <h3 className="text-lg font-medium text-left mb-6">Available payment methods</h3>
              <div className="grid grid-cols-2 gap-4">
                {/* Stripe - Active */}
                <button
                  onClick={() => handlePaymentMethodSelect("stripe")}
                  className={`flex items-center justify-start p-2 rounded-lg border border-neutral-800 bg-neutral-700/50 transition-all duration-300 ease-in-out hover:scale-95 hover:bg-neutral-900/50 ${
                    selectedPaymentMethod === "stripe" ? "scale-95 bg-neutral-900/50" : ""
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 flex items-center justify-center">
                      <img 
                        src="/images/stripe.jpg" 
                        alt="Stripe" 
                        className="w-6 h-6"
                      />
                    </div>
                    <span className="text-md">Stripe</span>
                  </div>

                  {/* Supported services */}
                  <div className="ml-auto flex items-center space-x-2 pr-2">
                    <img 
                      src="/images/visa.svg" 
                      alt="Visa" 
                      className="w-6 h-4 object-contain" 
                    />
                    <img 
                      src="/images/mastercard.svg" 
                      alt="Mastercard" 
                      className="w-6 h-4 object-contain" 
                    />
                    <img 
                      src={rotatingLogos[currentLogoIndex]} 
                      alt="Rotating logo" 
                      className="w-6 h-4 object-contain transition-opacity duration-300" 
                    />
                  </div>
                </button>

                {/* PayPal - Disabled */}
                <button
                  disabled
                  className="flex items-center justify-start p-2 bg-neutral-700/50 rounded-lg border border-neutral-800 opacity-50 cursor-not-allowed"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 flex items-center justify-center">
                      <img 
                        src="/images/paypal.jpg" 
                        alt="PayPal" 
                        className="w-6 h-6"
                      />
                    </div>
                    <span className="text-md">PayPal</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between">
              {/* Total label - left */}
              <div className="flex flex-col">
                <div className="text-3xl text-white font-semibold">Total</div>
                <div className="text-md text-neutral-500">(without VAT)</div>
              </div>

              {/* Buttons - center */}
              <div className="flex space-x-4">
                <button
                  onClick={handlePayment}
                  disabled={!selectedPaymentMethod || loading}
                  className="border border-neutral-800 bg-neutral-700/50 text-white px-8 py-2 rounded text-lg transition-all duration-300 hover:scale-95 hover:bg-neutral-900/50 focus:scale-95 focus:bg-neutral-400/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:bg-neutral-500/50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin inline" />
                      Processing...
                    </>
                  ) : (
                    "Pay"
                  )}
                </button>
                
                <button
                  onClick={closePaymentModal}
                  className="border border-neutral-800 bg-neutral-700/50 text-white px-8 py-2 rounded text-lg transition-all duration-300 hover:scale-95 hover:bg-neutral-900/50 focus:scale-95 focus:bg-neutral-400/50"
                >
                  Cancel
                </button>
              </div>

              {/* Price - right */}
              <div className="text-3xl font-bold">{formatCurrency(price, currency)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Error Dialog */}
      <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Error creating payment</DialogTitle>
            <DialogDescription>
              {error || "An unknown error occurred while creating the payment. Please try again later."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowErrorDialog(false)}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}