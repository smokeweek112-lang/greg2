"use client"

import { useCallback, useState, useEffect } from "react"
import Link from "next/link"

// Constants are moved to a separate object for better organisation.
const CONFIG = {
  NAV_ITEMS: [
    { href: "/", label: "Home" },
    { href: "/work", label: "Work" },
    { href: "/about", label: "About" },
    { href: "/booking", label: "Booking" },
    { href: "/shop", label: "Shop" },
  ],
  SOCIAL_LINKS: [
    { href: "https://www.instagram.com/gregormel?igsh=dHpwenJzZHRwdHRz&utm_source=qr", label: "INSTAGRAM" },
    { href: "https://www.tiktok.com/@gregor.melashych?_t=ZM-8y4Z93Uvs7s&_r=1", label: "TIKTOK" },
  ],
  CONTACT_INFO: ["YEHORMELASHYCH@GMAIL.COM"],
  SCROLL_THRESHOLD: 50,
  ANIMATION_DURATION: 2000,
}

// Custom hook for scroll control
function useScrollVisibility() {
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY

      // Show header if we scroll up or are at the top of the page
      if (currentScrollY < lastScrollY || currentScrollY < CONFIG.SCROLL_THRESHOLD) {
        setIsVisible(true)
      } else if (currentScrollY > lastScrollY && currentScrollY > CONFIG.SCROLL_THRESHOLD) {
        // Hide header if scrolling down
        setIsVisible(false)
      }

      setLastScrollY(currentScrollY)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [lastScrollY])

  return isVisible
}

// Custom hook for menu management
function useMenuToggle() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleMenu = useCallback(() => {
    setIsMenuOpen(prev => !prev)
  }, [])

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false)
  }, [])

  return { isMenuOpen, toggleMenu, closeMenu }
}

// Component for desktop navigation
function DesktopNavigation() {
  return (
    <nav className="hidden md:flex items-center space-x-16">
      {CONFIG.NAV_ITEMS.map((item) => (
        <Link 
          key={item.href} 
          href={item.href} 
          className="hn-light hover:underline underline-offset-4"
        >
          {item.label.toUpperCase()}
        </Link>
      ))}
    </nav>
  )
}

// Component for mobile menu
function MobileMenu({ isOpen, onClose }) {
  return (
    <>
      {/* Overlay */}
      <div
        className={`md:hidden fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        style={{ transitionDuration: `${CONFIG.ANIMATION_DURATION}ms` }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Menu Panel */}
      <div
        className={`md:hidden fixed top-0 right-0 h-full w-full bg-neutral-100 z-50 transform transition-transform ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ transitionDuration: `${CONFIG.ANIMATION_DURATION}ms` }}
      >
        {/* Header */}
        <div className="flex justify-end items-center py-4 px-7 border-black/10">
          <button
            className="hn-heavy text-lg text-black tracking-tighter"
            onClick={onClose}
            aria-label="Close menu"
          >
            CLOSE
          </button>
        </div>

        <div className="flex flex-col h-full justify-center py-8 px-4">
          {/* Navigation - located below the middle of the screen */}
          <div className="flex flex-col mt-16">
            <nav className="flex flex-col space-y-2">
              {CONFIG.NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-5xl hn-light text-black transition-opacity tracking-tighter"
                  onClick={onClose}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Footer - placed immediately after navigation */}
            <div className="mt-8">
              <MenuFooter />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// Component for mobile menu footer
function MenuFooter() {
  return (
    <div className="border-t border-neutral-300 pt-6">
      <div className="grid grid-cols-2">
        {/* Social Media */}
        <div>
          <h3 className="text-sm font-bold text-black mb-3 hn-bold tracking-tighter">
            SOCIAL MEDIA
          </h3>
          <div className="flex flex-col">
            {CONFIG.SOCIAL_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-black transition-opacity hn-bold tracking-tighter"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div className="-ml-4">
          <h3 className="text-sm font-bold text-black mb-3 hn-bold tracking-tighter">
            CONTACT
          </h3>
          <div className="flex flex-col">
            {CONFIG.CONTACT_INFO.map((email) => (
              <a
                key={email}
                href={`mailto:${email}`}
                className="text-sm text-black transition-opacity hn-bold break-all tracking-tighter"
              >
                {email}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Main component Header
export default function Header() {
  const isVisible = useScrollVisibility()
  const { isMenuOpen, toggleMenu, closeMenu } = useMenuToggle()

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 py-4 px-7 transition-all ease-in-out ${
          isVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
        } ${isMenuOpen ? "text-black" : "text-white"}`}
        style={{ transitionDuration: `${CONFIG.ANIMATION_DURATION}ms` }}
      >
        <div className="max-w-1xl mx-auto flex justify-between items-center">
          <div className="flex items-start space-x-32">
            <Link href="/" className="text-3xl font-bold tracking-tighter">
              GREG<span className="ars-demibold">O</span>RMEL
            </Link>
            <DesktopNavigation />
          </div>

          <button
            className="md:hidden hn-heavy text-lg tracking-tighter"
            onClick={toggleMenu}
            aria-label="Open menu"
          >
            MENU
          </button>
        </div>
      </header>

      <MobileMenu isOpen={isMenuOpen} onClose={closeMenu} />
    </>
  )
}
