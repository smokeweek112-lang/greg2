"use client"

import { useState, useEffect } from "react"
import { Check, Copy, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import AdminLayout from "@/components/admin/admin-layout"
import { getTelegramUpdates, sendBookingsList } from "@/lib/telegram-client"

// Bot username comes from the env (public value — it's the visible t.me link).
const TELEGRAM_BOT_ID = process.env.NEXT_PUBLIC_TELEGRAM_BOT_ID || ""

interface TelegramAdmin {
  id: string
  chatId: string
  name: string
}

export default function TelegramPage() {
  const [admins, setAdmins] = useState<TelegramAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newAdminName, setNewAdminName] = useState("")
  const [newAdminChatId, setNewAdminChatId] = useState("")
  const [copied, setCopied] = useState(false)
  const [updatesLoading, setUpdatesLoading] = useState(false)
  const [updates, setUpdates] = useState<any>(null)

  // Fetch admins
  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const response = await fetch("/api/admin/telegram-admins")
        const data = await response.json()

        if (data.success) {
          setAdmins(data.admins || [])
        } else {
          setError(data.error || "Failed to load admin list")
        }
      } catch (error) {
        console.error("Error fetching admins:", error)
        setError("An error occurred while loading admin list")
      } finally {
        setLoading(false)
      }
    }

    fetchAdmins()
  }, [])

  const handleCopyBotLink = () => {
    navigator.clipboard.writeText(`https://t.me/${TELEGRAM_BOT_ID}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleGetUpdates = async () => {
    setUpdatesLoading(true)
    setError("")

    try {
      const result = await getTelegramUpdates()
      setUpdates(result)
    } catch (error) {
      console.error("Error getting updates:", error)
      setError("An error occurred while getting updates")
    } finally {
      setUpdatesLoading(false)
    }
  }

  const handleAddAdmin = async () => {
    if (!newAdminName || !newAdminChatId) return

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/admin/telegram-admins", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newAdminName,
          chatId: newAdminChatId,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setAdmins([...admins, { id: data.id, name: newAdminName, chatId: newAdminChatId }])
        setSuccess("Administrator successfully added")
        setShowAddDialog(false)
        setNewAdminName("")
        setNewAdminChatId("")
      } else {
        setError(data.error || "Failed to add administrator")
      }
    } catch (error) {
      console.error("Error adding admin:", error)
      setError("An error occurred while adding administrator")
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveAdmin = async (id: string) => {
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch(`/api/admin/telegram-admins?id=${id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        setAdmins(admins.filter((admin) => admin.id !== id))
        setSuccess("Administrator successfully removed")
      } else {
        setError(data.error || "Failed to remove administrator")
      }
    } catch (error) {
      console.error("Error removing admin:", error)
      setError("An error occurred while removing administrator")
    } finally {
      setLoading(false)
    }
  }

  const handleSendBookingsList = async (status: "pending" | "confirmed" | "all") => {
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const result = await sendBookingsList(status)

      if (result) {
        setSuccess("Booking list successfully sent")
      } else {
        setError("Failed to send booking list")
      }
    } catch (error) {
      console.error("Error sending bookings list:", error)
      setError("An error occurred while sending booking list")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminLayout title="Telegram Setup">
      <div className="space-y-8">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-50 text-green-800 border-green-200">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Bot Setup</CardTitle>
            <CardDescription>Configure Telegram bot to receive notifications about new bookings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="bot-link">Bot Link</Label>
              <div className="flex mt-1.5">
                <Input id="bot-link" value={`https://t.me/${TELEGRAM_BOT_ID}`} readOnly className="flex-1" />
                <Button variant="outline" className="ml-2 bg-transparent" onClick={handleCopyBotLink}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-sm text-neutral-500 mt-1.5">Send /start command to the bot to get your Chat ID</p>
            </div>

            <div>
              <Button
                variant="outline"
                onClick={handleGetUpdates}
                disabled={updatesLoading}
                className="w-full bg-transparent"
              >
                {updatesLoading ? "Loading..." : "Get Bot Updates"}
              </Button>

              {updates && (
                <div className="mt-4 p-4 bg-neutral-50 rounded-md overflow-auto max-h-60">
                  <pre className="text-xs">{JSON.stringify(updates, null, 2)}</pre>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Administrators</CardTitle>
            <CardDescription>Manage the list of administrators receiving booking notifications</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">Loading...</div>
            ) : admins.length === 0 ? (
              <div className="text-center py-4 text-neutral-500">No administrators added</div>
            ) : (
              <div className="space-y-3">
                {admins.map((admin) => (
                  <div key={admin.id} className="flex justify-between items-center p-3 bg-neutral-50 rounded-md">
                    <div>
                      <p className="font-medium">{admin.name}</p>
                      <p className="text-sm text-neutral-500">Chat ID: {admin.chatId}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-700 hover:bg-red-100"
                      onClick={() => handleRemoveAdmin(admin.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setShowAddDialog(true)} className="flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              Add Administrator
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Send Booking Lists</CardTitle>
            <CardDescription>Send booking list to all administrators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Button variant="outline" onClick={() => handleSendBookingsList("pending")} disabled={loading}>
                Pending Confirmation
              </Button>
              <Button variant="outline" onClick={() => handleSendBookingsList("confirmed")} disabled={loading}>
                Confirmed
              </Button>
              <Button variant="outline" onClick={() => handleSendBookingsList("all")} disabled={loading}>
                All Bookings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Admin Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Administrator</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="admin-name">Administrator Name</Label>
              <Input
                id="admin-name"
                value={newAdminName}
                onChange={(e) => setNewAdminName(e.target.value)}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="admin-chat-id">Chat ID</Label>
              <Input
                id="admin-chat-id"
                value={newAdminChatId}
                onChange={(e) => setNewAdminChatId(e.target.value)}
                className="mt-1.5"
              />
              <p className="text-sm text-neutral-500 mt-1.5">Send /start command to the bot to get Chat ID</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddAdmin}
              disabled={!newAdminName || !newAdminChatId || loading}
              className="bg-black text-white hover:bg-neutral-800"
            >
              {loading ? "Saving..." : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
