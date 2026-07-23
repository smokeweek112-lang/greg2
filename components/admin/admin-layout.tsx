"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  LayoutDashboard,
  Users,
  BarChart3,
  LogOut,
  Menu,
  X,
  Calendar,
  MessageSquare,
  Shield,
  Settings,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { checkAuth, logout, stopTokenRefresh, type AdminSession } from "@/lib/auth-client"

interface AdminLayoutProps {
  children: React.ReactNode
  title: string
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [session, setSession] = useState<AdminSession>({ isAuthenticated: false })
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const authSession = await checkAuth()
        setSession(authSession)

        if (!authSession.isAuthenticated) {
          router.push("/admin")
        }
      } catch (error) {
        console.error("Error checking authentication:", error)
        router.push("/admin")
      } finally {
        setIsLoading(false)
      }
    }

    verifyAuth()
  }, [router])

  const handleLogout = async () => {
    try {
      stopTokenRefresh()
      const success = await logout()
      if (success) {
        router.push("/admin")
      }
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (!session.isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col">
      {/* Mobile Header */}
      <header className="bg-black text-white p-4 md:hidden flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1">
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <h1 className="font-bold">Admin Panel</h1>
        </div>
        <Button variant="ghost" size="icon" onClick={handleLogout} className="text-white hover:bg-neutral-800">
          <LogOut size={20} />
        </Button>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside
          className={`
          ${isSidebarOpen ? "block" : "hidden"} 
          md:block bg-black text-white w-64 p-6 flex-shrink-0
          fixed md:static inset-0 z-10 md:z-0
          h-full md:h-auto
          overflow-y-auto
        `}
        >
          <div className="hidden md:block mb-8">
            <div className="flex items-center space-x-2 mb-2">
              <Shield className="h-6 w-6" />
              <h1 className="text-2xl font-bold">Admin Panel</h1>
            </div>
            <div className="text-sm text-neutral-400">
              <p>{session.user?.email}</p>
              {session.user?.isMfaEnabled && (
                <Badge variant="secondary" className="mt-1 text-xs">
                  MFA Enabled
                </Badge>
              )}
            </div>
          </div>

          <nav className="space-y-6">
            <div className="space-y-1">
              <p className="text-neutral-400 text-sm uppercase tracking-wider mb-2">Main</p>

              <Link
                href="/admin/dashboard"
                className="flex items-center space-x-2 px-2 py-2 rounded hover:bg-neutral-800"
                onClick={() => setIsSidebarOpen(false)}
              >
                <LayoutDashboard size={20} />
                <span>Dashboard</span>
              </Link>

              <Link
                href="/admin/dashboard/statistics"
                className="flex items-center space-x-2 px-2 py-2 rounded hover:bg-neutral-800"
                onClick={() => setIsSidebarOpen(false)}
              >
                <BarChart3 size={20} />
                <span>Statistics</span>
              </Link>
            </div>

            <div className="space-y-1">
              <p className="text-neutral-400 text-sm uppercase tracking-wider mb-2">Management</p>

              <Link
                href="/admin/dashboard/orders"
                className="flex items-center space-x-2 px-2 py-2 rounded hover:bg-neutral-800"
                onClick={() => setIsSidebarOpen(false)}
              >
                <Users size={20} />
                <span>Order Management</span>
              </Link>

              <Link
                href="/admin/dashboard/schedule"
                className="flex items-center space-x-2 px-2 py-2 rounded hover:bg-neutral-800"
                onClick={() => setIsSidebarOpen(false)}
              >
                <Calendar size={20} />
                <span>Schedule Management</span>
              </Link>

              <Link
                href="/admin/dashboard/telegram"
                className="flex items-center space-x-2 px-2 py-2 rounded hover:bg-neutral-800"
                onClick={() => setIsSidebarOpen(false)}
              >
                <MessageSquare size={20} />
                <span>Telegram Settings</span>
              </Link>
            </div>

            <div className="space-y-1">
              <p className="text-neutral-400 text-sm uppercase tracking-wider mb-2">Security</p>

              <Link
                href="/admin/dashboard/security"
                className="flex items-center space-x-2 px-2 py-2 rounded hover:bg-neutral-800"
                onClick={() => setIsSidebarOpen(false)}
              >
                <Settings size={20} />
                <span>Security Settings</span>
              </Link>
            </div>
          </nav>

          <div className="mt-auto pt-8 md:hidden">
            <Button
              variant="ghost"
              className="w-full justify-start text-white hover:bg-neutral-800"
              onClick={handleLogout}
            >
              <LogOut size={20} className="mr-2" />
              Logout
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="mb-6 flex justify-between items-center">
            <h1 className="text-2xl font-bold">{title}</h1>
            <div className="hidden md:block">
              <Button variant="outline" className="flex items-center space-x-2 bg-transparent" onClick={handleLogout}>
                <LogOut size={16} />
                <span>Logout</span>
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
