"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import AdminLayout from "@/components/admin/admin-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, TrendingUp, Users, CheckCircle, Clock, XCircle, CreditCard, AlertTriangle } from "lucide-react"

interface Statistics {
  totalBookings: number
  pendingBookings: number
  confirmedBookings: number
  rejectedBookings: number
  paidBookings: number
  unpaidBookings: number
  bookingsPerMonth: number[]
}

export default function StatisticsPage() {
  const [statistics, setStatistics] = useState<Statistics | null>(null)
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

  if (loading) {
    return (
      <AdminLayout title="Statistics">
        <div className="flex justify-center py-10">
          <p>Loading statistics...</p>
        </div>
      </AdminLayout>
    )
  }

  if (error) {
    return (
      <AdminLayout title="Statistics">
        <div className="bg-red-50 text-red-500 p-4 rounded-md">{error}</div>
      </AdminLayout>
    )
  }

  // Prepare data for charts
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

  const monthlyData =
    statistics?.bookingsPerMonth?.map((count, index) => ({
      month: months[index],
      bookings: count,
    })) || []

  const statusData = [
    { name: "Confirmed", value: statistics?.confirmedBookings || 0, color: "#10b981" },
    { name: "Pending", value: statistics?.pendingBookings || 0, color: "#f59e0b" },
    { name: "Rejected", value: statistics?.rejectedBookings || 0, color: "#ef4444" },
  ].filter((item) => item.value > 0)

  const paymentData = [
    { name: "Paid", value: statistics?.paidBookings || 0, color: "#10b981" },
    { name: "Unpaid", value: statistics?.unpaidBookings || 0, color: "#f59e0b" },
  ].filter((item) => item.value > 0)

  const currentYear = new Date().getFullYear()
  const totalBookings = statistics?.totalBookings || 0
  const confirmedRate = totalBookings > 0 ? Math.round(((statistics?.confirmedBookings || 0) / totalBookings) * 100) : 0
  const paymentRate = totalBookings > 0 ? Math.round(((statistics?.paidBookings || 0) / totalBookings) * 100) : 0

  return (
    <AdminLayout title="Statistics & Analytics">
      <div className="space-y-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Bookings"
            value={statistics?.totalBookings || 0}
            icon={<Calendar className="h-5 w-5" />}
            color="text-blue-600"
            bgColor="bg-blue-50"
          />
          <StatCard
            title="Confirmed Rate"
            value={`${confirmedRate}%`}
            icon={<CheckCircle className="h-5 w-5" />}
            color="text-green-600"
            bgColor="bg-green-50"
            subtitle={`${statistics?.confirmedBookings || 0} confirmed`}
          />
          <StatCard
            title="Payment Rate"
            value={`${paymentRate}%`}
            icon={<CreditCard className="h-5 w-5" />}
            color="text-emerald-600"
            bgColor="bg-emerald-50"
            subtitle={`${statistics?.paidBookings || 0} paid`}
          />
          <StatCard
            title="Pending Orders"
            value={statistics?.pendingBookings || 0}
            icon={<Clock className="h-5 w-5" />}
            color="text-yellow-600"
            bgColor="bg-yellow-50"
            subtitle="Awaiting confirmation"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Bookings Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Monthly Bookings - {currentYear}
              </CardTitle>
              <CardDescription>Booking trends throughout the year</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="bookings" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Booking Status Distribution
              </CardTitle>
              <CardDescription>Current status of all bookings</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Statistics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Status Breakdown</CardTitle>
              <CardDescription>Detailed view of booking statuses</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Confirmed</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-600">{statistics?.confirmedBookings || 0}</div>
                  <div className="text-sm text-neutral-500">{confirmedRate}% of total</div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  <span className="font-medium">Pending</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-yellow-600">{statistics?.pendingBookings || 0}</div>
                  <div className="text-sm text-neutral-500">
                    {totalBookings > 0 ? Math.round(((statistics?.pendingBookings || 0) / totalBookings) * 100) : 0}% of
                    total
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span className="font-medium">Rejected</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-red-600">{statistics?.rejectedBookings || 0}</div>
                  <div className="text-sm text-neutral-500">
                    {totalBookings > 0 ? Math.round(((statistics?.rejectedBookings || 0) / totalBookings) * 100) : 0}%
                    of total
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Status</CardTitle>
              <CardDescription>Payment completion overview</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-emerald-600" />
                  <span className="font-medium">Paid Orders</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-emerald-600">{statistics?.paidBookings || 0}</div>
                  <div className="text-sm text-neutral-500">{paymentRate}% completion rate</div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  <span className="font-medium">Unpaid Orders</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-orange-600">{statistics?.unpaidBookings || 0}</div>
                  <div className="text-sm text-neutral-500">
                    {totalBookings > 0 ? Math.round(((statistics?.unpaidBookings || 0) / totalBookings) * 100) : 0}%
                    pending payment
                  </div>
                </div>
              </div>

              {/* Payment Progress Bar */}
              <div className="mt-4">
                <div className="flex justify-between text-sm text-neutral-600 mb-2">
                  <span>Payment Progress</span>
                  <span>{paymentRate}%</span>
                </div>
                <div className="w-full bg-neutral-200 rounded-full h-2">
                  <div
                    className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${paymentRate}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Performance Summary</CardTitle>
            <CardDescription>Key insights for {currentYear}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.max(...(statistics?.bookingsPerMonth || [0]))}
                </div>
                <div className="text-sm text-neutral-600">Peak Month Bookings</div>
                <div className="text-xs text-neutral-500 mt-1">
                  {
                    months[
                      statistics?.bookingsPerMonth?.indexOf(Math.max(...(statistics?.bookingsPerMonth || [0]))) || 0
                    ]
                  }
                </div>
              </div>

              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {statistics?.bookingsPerMonth
                    ? Math.round((statistics.bookingsPerMonth.reduce((a, b) => a + b, 0) / 12) * 10) / 10
                    : 0}
                </div>
                <div className="text-sm text-neutral-600">Average per Month</div>
                <div className="text-xs text-neutral-500 mt-1">{currentYear} average</div>
              </div>

              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {statistics?.bookingsPerMonth?.filter((count) => count > 0).length || 0}
                </div>
                <div className="text-sm text-neutral-600">Active Months</div>
                <div className="text-xs text-neutral-500 mt-1">With bookings</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  color: string
  bgColor: string
  subtitle?: string
}

function StatCard({ title, value, icon, color, bgColor, subtitle }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-600">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && <p className="text-xs text-neutral-500 mt-1">{subtitle}</p>}
          </div>
          <div className={`${bgColor} ${color} p-3 rounded-full`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}
