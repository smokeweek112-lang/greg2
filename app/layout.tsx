import type React from "react"
import type { Metadata } from "next"
import { helveticaNeue } from "./fonts"
import "./globals.css"

import SmoothScrollWrapper from "../components/smoothscrollwrapper"

export const metadata: Metadata = {
  title: "GREGORMEL",
  description: "The best tattoo salon in the world",
  generator: "React",
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={helveticaNeue.variable}>
      <body>
        <SmoothScrollWrapper>{children}</SmoothScrollWrapper>
      </body>
    </html>
  )
}