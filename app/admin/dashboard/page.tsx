"use client"

import type React from "react"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Calendar, Clock, Users, CheckCircle, AlertTriangle } from "lucide-react"
import AdminLayout from "@/components/admin/admin-layout"

interface StatisticsSummary {
  totalBookings: number
  pendingBookings: number
  confirmedBookings: number
  rejectedBookings: number
  paidBookings: number
  unpaidBookings: number
}

export default function AdminDashboard() {
  const [statistics, setStatistics] = useState<StatisticsSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const response = await fetch("/api/admin/statistics")
        const data = await response.json()

        if (data.success) {
          setStatistics(data.statistics)
        } else {
          setError("Failed to load statistics")
        }
      } catch (error) {
        console.error("Error fetching statistics:", error)
        setError("An error occurred while loading statistics")
      } finally {
        setLoading(false)
      }
    }

    fetchStatistics()
  }, [])

  return (
    <AdminLayout title="Dashboard">
      {loading ? (
        <div className="flex justify-center py-10">
          <p>Loading data...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-500 p-4 rounded-md">{error}</div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <DashboardCard
              title="Total Orders"
              value={statistics?.totalBookings || 0}
              icon={<Calendar className="h-8 w-8" />}
              color="bg-blue-50 text-blue-500"
              link="/admin/dashboard/orders"
            />

            <DashboardCard
              title="Pending Confirmation"
              value={statistics?.pendingBookings || 0}
              icon={<Clock className="h-8 w-8" />}
              color="bg-yellow-50 text-yellow-500"
              link="/admin/dashboard/orders?status=pending"
            />

            <DashboardCard
              title="Confirmed"
              value={statistics?.confirmedBookings || 0}
              icon={<Users className="h-8 w-8" />}
              color="bg-green-50 text-green-500"
              link="/admin/dashboard/orders?status=confirmed"
            />

            <DashboardCard
              title="Paid Orders"
              value={statistics?.paidBookings || 0}
              icon={<CheckCircle className="h-8 w-8" />}
              color="bg-emerald-50 text-emerald-500"
              link="/admin/dashboard/orders?payment=paid"
            />

            <DashboardCard
              title="Unpaid Orders"
              value={statistics?.unpaidBookings || 0}
              icon={<AlertTriangle className="h-8 w-8" />}
              color="bg-orange-50 text-orange-500"
              link="/admin/dashboard/orders?payment=unpaid"
            />
          </div>

          <div className="border-t pt-6">
            <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <QuickActionCard
                title="Order Management"
                description="View and manage all bookings"
                link="/admin/dashboard/orders"
              />

              <QuickActionCard
                title="Schedule Management"
                description="Mark busy dates and times"
                link="/admin/dashboard/schedule"
              />

              <QuickActionCard
                title="Telegram Settings"
                description="Configure Telegram notifications"
                link="/admin/dashboard/telegram"
              />

              <QuickActionCard
                title="Payment Settings"
                description="Configure prices and payment system"
                link="/admin/dashboard/payment"
              />
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

interface DashboardCardProps {
  title: string
  value: number
  icon: React.ReactNode
  color: string
  link: string
}

function DashboardCard({ title, value, icon, color, link }: DashboardCardProps) {
  return (
    <Link href={link} className="block">
      <div className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center space-x-4">
          <div className={`${color} p-3 rounded-full`}>{icon}</div>
          <div>
            <p className="text-neutral-500 text-sm">{title}</p>
            <h3 className="text-3xl font-bold">{value}</h3>
          </div>
        </div>
      </div>
    </Link>
  )
}

interface QuickActionCardProps {
  title: string
  description: string
  link: string
}

function QuickActionCard({ title, description, link }: QuickActionCardProps) {
  return (
    <Link href={link} className="block">
      <div className="border rounded-lg p-5 hover:bg-neutral-50 transition-colors">
        <h3 className="font-medium mb-2">{title}</h3>
        <p className="text-neutral-500 text-sm">{description}</p>
      </div>
    </Link>
  )
}
