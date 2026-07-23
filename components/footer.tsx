'use client'

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export default function Footer() {
  const [copyNotifications, setCopyNotifications] = useState([])

  const copyEmail = () => {
    const email = "YEHORMELASHYCH@GMAIL.COM"
    navigator.clipboard.writeText(email.toLowerCase())
    
    const newNotification = {
      id: Date.now() + Math.random(),
      text: email
    }
    
    setCopyNotifications(prev => [...prev, newNotification])
    
    setTimeout(() => {
      setCopyNotifications(prev => prev.filter(notification => notification.id !== newNotification.id))
    }, 2000)
  }

  return (
    <footer className="min-h-screen bg-black text-white px-4 sm:px-8 md:px-12 py-8 sm:py-12 md:py-16 flex flex-col justify-between">
      <div className="flex-1 flex flex-col justify-center">
        <div className="w-full">
          {/* Top section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-16 sm:mb-24 md:mb-32">
            {/* Left side: Title + Button */}
            <div>
              <h4 className="text-2xl sm:text-3xl md:text-5xl font-light mb-4 sm:mb-6 md:mb-8">
                Relax and 
                <br />
                take a seat.
              </h4>
              <Link href="/booking">
                <Button
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:text-black px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg bg-transparent rounded-none"
                >
                  TAKE A SEAT
                </Button>
              </Link>
            </div>

            {/* Spacer */}
            <div className="hidden md:block" />

            {/* Right side: Social & Contact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h5 className="text-base sm:text-lg mb-2 text-neutral-500">Social Media</h5>
                <p className="text-sm">
                  <Link
                    href="https://www.instagram.com/gregormel?igsh=dHpwenJzZHRwdHRz&utm_source=qr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    INSTAGRAM
                  </Link>
                </p>
                <p className="text-sm">
                  <Link
                    href="https://www.tiktok.com/@gregor.melashych?_t=ZM-8y4Z93Uvs7s&_r=1"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    TIKTOK
                  </Link>
                </p>
              </div>
            
              <div>
                <h5 className="text-base sm:text-lg mb-2 text-neutral-500">Contact</h5>
                <div className="w-full text-left">
                 <div className="text-xs sm:text-sm relative">
                   <button
                     onClick={copyEmail}
                     className="hover:underline cursor-pointer transition-colors hover:text-neutral-300 break-all text-left"
                   >
                     YEHORMELASHYCH@GMAIL.COM
                   </button>
                   
                   <div className="absolute top-0 left-0 pointer-events-none">
                     {copyNotifications.map((notification) => (
                       <div
                         key={notification.id}
                         className="absolute text-xs sm:text-sm text-neutral-300 font-medium animate-[flyUp_2s_ease-out_forwards]"
                       >
                         {notification.text}
                       </div>
                     ))}
                   </div>
                 </div>
                </div>
                <p className="text-xs sm:text-sm">
                  TELEGRAM:{" "}
                  <a
                    href="https://t.me/gregormel"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    @gregormel
                  </a>
                </p>
                <p className="text-xs sm:text-sm">
                  WHATSAPP:{" "}
                  <a
                    href="https://wa.me/491788645947"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    +49 178 8645947
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="text-right mb-4 sm:mb-6 md:mb-8">
        <p className="font-bold text-sm sm:text-base">All Rights Reserved.</p>
        <p className="font-bold text-sm sm:text-base">©2025</p>
      </div>

      {/* Large logo at the very end */}
     <div className="text-center">
       <h1 className="text-[8vw] sm:text-[10vw] md:text-[12vw] font-bold leading-none tracking-tighter">
         GREG<span className="ars-demibold">O</span>RMEL
       </h1>
     </div>

      <style jsx>{`
        @keyframes flyUp {
          0% {
            transform: translateY(0px);
            opacity: 1;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translateY(-50px);
            opacity: 0;
          }
        }
      `}</style>
    </footer>
  )
}