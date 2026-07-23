"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/header"
import Footer from "@/components/footer"
import BookingConfirmation from "@/components/booking-confirmation"
import BodySelector from "@/components/body-selector"
import FileUpload from "@/components/file-upload"
import ScrollIndicators from "@/components/scroll-indicators"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import CloudflareTurnstile from "@/components/cloudflare-turnstile"
import InstagramSection from "@/components/instagram-section"

function SectionHeader({
  index,
  title,
  subtitle,
  required,
  error,
}: {
  index: string
  title: string
  subtitle?: string
  required?: boolean
  error?: boolean
}) {
  return (
    <div className="mb-10 md:mb-12">
      <p className="text-xs uppercase tracking-[0.35em] text-neutral-500 mb-4">{index}</p>
      <h2 className={`text-3xl md:text-5xl font-light mb-6 ${error ? "text-red-400" : ""}`}>
        {title}
        {required && <span className="text-red-400"> *</span>}
      </h2>
      <div className="w-full h-px bg-neutral-600"></div>
      {subtitle && <p className="mt-6 text-lg text-neutral-400 font-light">{subtitle}</p>}
    </div>
  )
}

export default function Booking() {
  const router = useRouter()
  const [availabilityText, setAvailabilityText] = useState("")
  const [bookingComplete, setBookingComplete] = useState(false)
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false)

  // Form fields
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [instagram, setInstagram] = useState("")
  const [hasTattoos, setHasTattoos] = useState<boolean | null>(null)
  const [bodyType, setBodyType] = useState<"feminine" | "masculine" | null>(null)
  const [bodyPart, setBodyPart] = useState<string[] | null>(null)
  const [idea, setIdea] = useState("")
  const [tattooFile, setTattooFile] = useState<File | null>(null)
  const [tattooImageData, setTattooImageData] = useState<string | null>(null)
  const [marketingConsent, setMarketingConsent] = useState(false)
  const [ageConfirmation, setAgeConfirmation] = useState(false)
  const [privacyPolicyConsent, setPrivacyPolicyConsent] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [turnstileVerified, setTurnstileVerified] = useState(false)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Phone number formatting and validation
  const formatGermanPhoneNumber = (value: string) => {
    // Remove all non-digit characters except the plus sign
    let cleaned = value.replace(/[^\d+]/g, "")

    // Ensure it starts with +49
    if (!cleaned.startsWith("+49") && cleaned.startsWith("49")) {
      cleaned = "+" + cleaned
    } else if (!cleaned.startsWith("+") && !cleaned.startsWith("49")) {
      cleaned = "+49" + cleaned
    } else if (!cleaned.startsWith("+49") && !cleaned.startsWith("49")) {
      cleaned = "+49" + cleaned
    }

    // Format with spaces: +49 XXX XXXXXXX
    if (cleaned.length > 3) {
      cleaned = cleaned.substring(0, 3) + " " + cleaned.substring(3)
    }
    if (cleaned.length > 7) {
      cleaned = cleaned.substring(0, 7) + " " + cleaned.substring(7)
    }

    return cleaned
  }

  const validateGermanPhoneNumber = (value: string) => {
    // German phone numbers should match this pattern: +49 XXX XXXXXXX
    const regex = /^\+49\s\d{3}\s\d{7,8}$/
    return regex.test(value)
  }

  const validateEmail = (email: string) => {
    const regex = /\S+@\S+\.\S+/
    return regex.test(email)
  }

  const validateInstagram = (username: string) => {
    // Instagram usernames can't have spaces and should be reasonable length
    return username.length > 0 && username.length <= 30 && !username.includes(" ")
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!fullName) errors.fullName = "required"
    if (!email) errors.email = "required"
    else if (!validateEmail(email)) errors.email = "invalid"

    if (!phone) errors.phone = "required"
    else if (!validateGermanPhoneNumber(phone)) errors.phone = "invalid"

    if (!idea) errors.idea = "required"

    if (!ageConfirmation) errors.ageConfirmation = "required"
    if (!privacyPolicyConsent) errors.privacyPolicyConsent = "required"

    // CRITICAL: Checking the Turnstile token
    if (!turnstileVerified || !turnstileToken) {
      errors.turnstile = "Please complete the security verification"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleTurnstileVerify = (token: string) => {
    console.log("✅ Turnstile verified:", token.substring(0, 20) + "...")
    setTurnstileToken(token)
    setTurnstileVerified(true)
    if (formErrors.turnstile) {
      const updatedErrors = { ...formErrors }
      delete updatedErrors.turnstile
      setFormErrors(updatedErrors)
    }
    setError(null)
  }

  const handleTurnstileError = () => {
    console.error("❌ Turnstile error")
    setTurnstileToken(null)
    setTurnstileVerified(false)
    setFormErrors(prev => ({ ...prev, turnstile: "Security verification failed" }))
    setError("Security verification failed. Please try again.")
  }

  const handleTurnstileExpire = () => {
    console.log("⏰ Turnstile expired")
    setTurnstileToken(null)
    setTurnstileVerified(false)
    setFormErrors(prev => ({ ...prev, turnstile: "Security verification expired" }))
    setError("Security verification expired. Please verify again.")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    // Prevent form submission and page refresh
    e.preventDefault()
    e.stopPropagation()

    console.log("🚀 Form submission started")

    if (!validateForm()) {
      setError("Please fill in all required fields and complete security verification")
      return
    }

    // Additional Turnstile check before sending
    if (!turnstileVerified || !turnstileToken) {
      setError("Please complete the security verification")
      setFormErrors(prev => ({ ...prev, turnstile: "Security verification required" }))
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const bookingData = {
        availability: availabilityText,
        fullName,
        email,
        phone,
        instagram,
        hasTattoos: !!hasTattoos,
        bodyType: bodyType || "",
        bodyPart: bodyPart || "",
        idea,
        tattooImage: tattooImageData || "",
        marketingConsent,
        ageConfirmation,
        privacyPolicyConsent,
        turnstileToken,
      }

      console.log("📡 Sending booking request with turnstile token:", !!turnstileToken)

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookingData),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("📋 API Response:", data)

      if (data.success) {
        if (data.bookingHash) {
          localStorage.setItem("bookingHash", data.bookingHash)
          // Use window.location.href instead of router.push for hard navigation
          window.location.href = `/booking/${data.bookingHash}`
        }
      } else {
        console.error("❌ Booking failed:", data)

        // Special error handling Turnstile
        if (data.error && (
          data.error.includes("timeout-or-duplicate") ||
          data.error.includes("turnstile") ||
          data.error.includes("verification")
        )) {
          setError("Security verification expired. Please verify again.")

          // Reset Turnstile status
          setTurnstileVerified(false)
          setTurnstileToken(null)

          // Attempt to reset the widget
          if ((window as any).resetTurnstile) {
            try {
              (window as any).resetTurnstile()
            } catch (resetError) {
              console.error("Error resetting Turnstile:", resetError)
            }
          }

          setFormErrors(prev => ({ ...prev, turnstile: "Please verify again" }))
        } else {
          setError(data.error || "Failed to send request")
        }

        // Debugging information in development
        if (process.env.NODE_ENV === 'development' && data.debug) {
          console.log("🔍 Debug info:", data.debug)
        }
      }
    } catch (err) {
      console.error("💥 Error sending request:", err)
      setError("An error occurred while submitting the application. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const fieldLabelClass = (hasError: boolean) =>
    `text-xs uppercase tracking-[0.25em] mb-3 block ${hasError ? "text-red-400" : "text-neutral-500"}`

  const fieldInputClass = (hasError: boolean) =>
    `h-12 rounded-none border-0 border-b bg-transparent px-0 text-lg md:text-lg font-light text-white placeholder:text-neutral-600 focus-visible:ring-0 focus-visible:ring-offset-0 transition-colors ${
      hasError ? "border-red-400" : "border-neutral-700 focus:border-white"
    }`

  const textareaClass = (hasError: boolean) =>
    `min-h-[160px] rounded-none border bg-transparent p-5 text-lg md:text-lg font-light text-white placeholder:text-neutral-600 focus-visible:ring-0 focus-visible:ring-offset-0 transition-colors ${
      hasError ? "border-red-400" : "border-neutral-700 focus:border-white"
    }`

  const choiceButtonClass = (selected: boolean) =>
    `w-full h-14 border text-sm uppercase tracking-[0.2em] transition-colors duration-300 ${
      selected
        ? "bg-white text-black border-white"
        : "bg-transparent text-white border-neutral-600 hover:bg-white hover:text-black"
    }`

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <ScrollIndicators />
      <Header />

      <main className="flex-1 py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16 md:mb-24">
            <p className="text-xs md:text-sm uppercase tracking-[0.35em] text-neutral-500 mb-6">Booking</p>
            <h1 className="text-5xl md:text-7xl font-light mb-8">Book a Session</h1>
            <div className="w-full h-px bg-neutral-600 mb-8"></div>
            <p className="text-lg md:text-xl text-neutral-400 font-light max-w-2xl mx-auto">
              Tell us about your idea — we'll take care of the rest.
            </p>
          </div>

          {bookingComplete ? (
            <BookingConfirmation />
          ) : (
            <form onSubmit={handleSubmit} className="space-y-24 md:space-y-32">
              {/* Personal Information */}
              <section>
                <SectionHeader
                  index="01"
                  title="Personal Information"
                  subtitle="Tell us who you are and how we can reach you."
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-10">
                  <div>
                    <Label htmlFor="fullName" className={fieldLabelClass(!!formErrors.fullName)}>
                      Full Name <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Johann Schmidt"
                      className={fieldInputClass(!!formErrors.fullName)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="email" className={fieldLabelClass(!!formErrors.email)}>
                      Email <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="example@email.com"
                      className={fieldInputClass(!!formErrors.email)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone" className={fieldLabelClass(!!formErrors.phone)}>
                      Phone Number <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(formatGermanPhoneNumber(e.target.value))}
                      placeholder="+49 171 1234567"
                      className={fieldInputClass(!!formErrors.phone)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="instagram" className={fieldLabelClass(!!formErrors.instagram)}>
                      Instagram Account
                    </Label>
                    <Input
                      id="instagram"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      placeholder="@username"
                      className={fieldInputClass(!!formErrors.instagram)}
                    />
                  </div>
                </div>
              </section>

              {/* About You */}
              <section>
                <SectionHeader
                  index="02"
                  title="About You"
                  subtitle="A couple of quick questions to help us prepare."
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-12">
                  {/* Do you already have tattoos? */}
                  <div>
                    <Label className={fieldLabelClass(!!formErrors.hasTattoos)}>
                      Do you already have tattoos?
                    </Label>
                    <div className="grid grid-cols-2 gap-4 mt-1">
                      <button
                        type="button"
                        className={choiceButtonClass(hasTattoos === true)}
                        onClick={() => setHasTattoos(true)}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        className={choiceButtonClass(hasTattoos === false)}
                        onClick={() => setHasTattoos(false)}
                      >
                        No
                      </button>
                    </div>
                  </div>

                  {/* Your body type */}
                  <div>
                    <Label className={fieldLabelClass(!!formErrors.bodyType)}>
                      Your body type
                    </Label>
                    <div className="grid grid-cols-2 gap-4 mt-1">
                      <button
                        type="button"
                        className={choiceButtonClass(bodyType === "feminine")}
                        onClick={() => setBodyType("feminine")}
                      >
                        More feminine
                      </button>
                      <button
                        type="button"
                        className={choiceButtonClass(bodyType === "masculine")}
                        onClick={() => setBodyType("masculine")}
                      >
                        More masculine
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              {/* Body Part Selection */}
              <section>
                <SectionHeader
                  index="03"
                  title="Placement"
                  subtitle="Select where on your body the tattoo will live."
                  error={!!formErrors.bodyPart}
                />

                <BodySelector onSelectBodyPart={(parts) => setBodyPart(parts)} selectedBodyPart={bodyPart || []} />
              </section>

              {/* Tattoo Idea */}
              <section>
                <SectionHeader
                  index="04"
                  title="Your Idea"
                  subtitle="Describe the tattoo — style, size, meaning, anything that matters."
                  required
                  error={!!formErrors.idea}
                />

                <Textarea
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  placeholder="Describe what tattoo you would like to get, its size, style and other important details..."
                  className={textareaClass(!!formErrors.idea)}
                  maxLength={500}
                />
                <div className="mt-3 text-right text-xs uppercase tracking-[0.25em] text-neutral-600">
                  {idea.length} / 500
                </div>
              </section>

              {/* Date and Time Selection */}
              <section>
                <SectionHeader
                  index="05"
                  title="Availability"
                  subtitle="When could you come in? A rough idea is enough."
                  error={!!formErrors.availability}
                />

                <Textarea
                  value={availabilityText}
                  onChange={(e) => setAvailabilityText(e.target.value)}
                  placeholder="Specify convenient date and time for your appointment, like morning of July 10th or weekday evenings..."
                  className={textareaClass(!!formErrors.availability)}
                  maxLength={200}
                />
                <div className="mt-3 text-right text-xs uppercase tracking-[0.25em] text-neutral-600">
                  {availabilityText.length} / 200
                </div>
              </section>

              {/* Tattoo Example Upload */}
              <section>
                <SectionHeader
                  index="06"
                  title="Reference"
                  subtitle="Already have an image that captures the vibe? Share it."
                  error={!!formErrors.tattooFile}
                />

                <div className="max-w-2xl">
                  <FileUpload onFileChange={setTattooFile} onFileDataUrl={setTattooImageData} />
                </div>
              </section>

              {/* Agreements */}
              <section>
                <SectionHeader
                  index="07"
                  title="Confirmations"
                  subtitle="The formal part — quick to read, quick to check."
                />

                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <Checkbox
                      id="marketing"
                      checked={marketingConsent}
                      onCheckedChange={(checked) => setMarketingConsent(checked === true)}
                      className="mt-1 rounded-none border-neutral-600 data-[state=checked]:bg-white data-[state=checked]:text-black"
                    />
                    <Label htmlFor="marketing" className="text-base md:text-lg font-light leading-relaxed text-neutral-300">
                      I agree to receive personalized marketing emails
                    </Label>
                  </div>

                  <div className="flex items-start gap-4">
                    <Checkbox
                      id="age"
                      checked={ageConfirmation}
                      onCheckedChange={(checked) => setAgeConfirmation(checked === true)}
                      className="mt-1 rounded-none border-neutral-600 data-[state=checked]:bg-white data-[state=checked]:text-black"
                    />
                    <Label
                      htmlFor="age"
                      className={`text-base md:text-lg font-light leading-relaxed ${formErrors.ageConfirmation ? "text-red-400" : "text-neutral-300"}`}
                    >
                      I hereby confirm that I am over 18 years old <span className="text-red-400">*</span>
                    </Label>
                  </div>

                  <div className="flex items-start gap-4">
                    <Checkbox
                      id="privacy"
                      checked={privacyPolicyConsent}
                      onCheckedChange={(checked) => setPrivacyPolicyConsent(checked === true)}
                      className="mt-1 rounded-none border-neutral-600 data-[state=checked]:bg-white data-[state=checked]:text-black"
                    />
                    <Label
                      htmlFor="privacy"
                      className={`text-base md:text-lg font-light leading-relaxed ${formErrors.privacyPolicyConsent ? "text-red-400" : "text-neutral-300"}`}
                    >
                      I agree to the{" "}
                      <button
                        type="button"
                        className="text-white underline underline-offset-4 hover:text-neutral-300"
                        onClick={() => setShowPrivacyPolicy(true)}
                      >
                        privacy policy
                      </button>{" "}
                      <span className="text-red-400">*</span>
                    </Label>
                  </div>
                </div>
              </section>

              {/* Cloudflare Turnstile */}
              <section>
                <SectionHeader
                  index="08"
                  title="Verification"
                  subtitle="One quick check to confirm you're human."
                  error={!!formErrors.turnstile}
                />

                <CloudflareTurnstile
                  onVerify={handleTurnstileVerify}
                  onError={handleTurnstileError}
                  onExpire={handleTurnstileExpire}
                  sitekey={process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY}
                />
                {formErrors.turnstile && (
                  <div className="mt-4 text-sm tracking-wide text-red-400">
                    {formErrors.turnstile}
                  </div>
                )}
              </section>

              {error && (
                <div className="border border-red-500/30 px-6 py-4 text-center text-sm tracking-wide text-red-400">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-14 md:h-16 border border-neutral-600 bg-transparent text-white font-semibold tracking-[0.2em] text-sm md:text-base hover:bg-white hover:text-black transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-white"
              >
                {isSubmitting ? "SUBMITTING..." : "SUBMIT APPLICATION"}
              </button>
            </form>
          )}
        </div>
      </main>

      {/* Instagram Section */}
      <InstagramSection />

      <Footer />

      {/* Privacy Policy Dialog */}
      <Dialog open={showPrivacyPolicy} onOpenChange={setShowPrivacyPolicy}>
        <DialogContent className="flex max-h-[85dvh] w-[calc(100%-2rem)] max-w-3xl flex-col gap-0 rounded-none sm:rounded-none border-neutral-700 bg-black p-0 text-white">
          <DialogHeader className="border-b border-neutral-800 px-6 md:px-8 pt-6 md:pt-8 pb-6 text-left">
            <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">Legal</p>
            <DialogTitle className="text-2xl md:text-3xl font-light text-white">Privacy Policy</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto overscroll-contain px-6 md:px-8 py-6 space-y-4 text-sm leading-relaxed text-neutral-300 [scrollbar-width:thin] [scrollbar-color:#404040_transparent]">
            <p>
              <strong className="text-white">Last updated:</strong>18 July 2025
            </p>

            <h3 className="text-lg font-medium text-white">Introduction</h3>
            <p>
              This Privacy Policy describes how our tattoo salon collects, uses and discloses your information when
              using our website and services.
            </p>

            <h3 className="text-lg font-medium text-white">Information We Collect</h3>
            <p>We collect the following information:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Personal information (name, email, phone number, Instagram)</li>
              <li>Tattoo preference information</li>
              <li>Images you upload</li>
              <li>Booking information</li>
            </ul>

            <h3 className="text-lg font-medium text-white">How We Use Your Information</h3>
            <p>We use the collected information to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Process and fulfill your booking requests</li>
              <li>Contact you about your booking</li>
              <li>Improve our services</li>
              <li>Send marketing messages (with your consent)</li>
            </ul>

            <h3 className="text-lg font-medium text-white">Data Storage</h3>
            <p>
              We store your information only for the time necessary to provide the requested services and in accordance
              with our legal obligations.
            </p>

            <h3 className="text-lg font-medium text-white">Information Disclosure</h3>
            <p>
              We do not sell your personal information to third parties. We may share information with our trusted
              partners who help us provide services.
            </p>

            <h3 className="text-lg font-medium text-white">Your Rights</h3>
            <p>You have the right to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Request access to your personal information</li>
              <li>Correct inaccurate information</li>
              <li>Request deletion of your information</li>
              <li>Withdraw consent for data processing</li>
            </ul>

            <h3 className="text-lg font-medium text-white">Security</h3>
            <p>We take reasonable measures to protect your information from unauthorized access or disclosure.</p>

            <h3 className="text-lg font-medium text-white">Changes to Privacy Policy</h3>
            <p>We may update our Privacy Policy from time to time. We will notify you of any material changes.</p>

            <h3 className="text-lg font-medium text-white">Contact Information</h3>
            <p>
              If you have questions about our Privacy Policy, please contact us by email:{" "}
              <a
                href="mailto:yehormelashych@gmail.com"
                className="text-white underline underline-offset-4 hover:text-neutral-300"
              >
                yehormelashych@gmail.com
              </a>
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
