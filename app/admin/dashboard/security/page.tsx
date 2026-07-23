"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Shield, Smartphone, Key, AlertTriangle, CheckCircle, Copy, QrCode } from "lucide-react"
import { checkAuth, type AdminSession } from "@/lib/auth-client"
import AdminLayout from "@/components/admin/admin-layout"
import { QRCodeSVG } from "qrcode.react"

export default function SecuritySettings() {
  const [session, setSession] = useState<AdminSession>({ isAuthenticated: false })
  const [totpToken, setTotpToken] = useState("")
  const [qrCodeUrl, setQrCodeUrl] = useState("")
  const [manualEntryKey, setManualEntryKey] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [showSetup, setShowSetup] = useState(false)

  useEffect(() => {
    const loadSession = async () => {
      const authSession = await checkAuth()
      setSession(authSession)
    }
    loadSession()
  }, [])

  return (
    <AdminLayout title="Security Settings">
      <div className="space-y-6">
        {/* Current Security Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Security Overview</span>
            </CardTitle>
            <CardDescription>Current security settings for your admin account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Key className="h-4 w-4" />
                <span>JWT Authentication</span>
              </div>
              <Badge variant="default" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Active
              </Badge>
            </div>

            <div className="text-sm text-neutral-600 bg-neutral-50 p-3 rounded">
              <p>
                <strong>Username:</strong> {session.user?.username}
              </p>
              <p>
                <strong>Last Login:</strong>{" "}
                {session.user?.lastLogin ? new Date(session.user.lastLogin).toLocaleString() : "N/A"}
              </p>
              <p>
                <strong>Session Expires:</strong> Every 5 minutes (auto-refresh)
              </p>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Security Best Practices */}
        <Card>
          <CardHeader>
            <CardTitle>Security Best Practices</CardTitle>
            <CardDescription>Follow these recommendations to keep your account secure</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>JWT tokens expire every 5 minutes for security</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Passwords are hashed with bcrypt (industry standard)</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Rate limiting prevents brute force attacks</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Secure HTTP-only cookies protect tokens</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
