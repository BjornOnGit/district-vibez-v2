"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { CheckCircle2, AlertCircle, XCircle } from "lucide-react"

interface TicketInfo {
  id: string
  code: string
  event_title: string
  ticket_type: string
  user_name: string
  user_email: string
  status: "reserved" | "paid" | "cancelled" | "refunded" | "used"
  created_at: string
}

interface ValidationResponse {
  success: boolean
  message: string
  ticket?: TicketInfo
  error?: string
}

export default function AdminValidatePage() {
  const [qrInput, setQrInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ValidationResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch("/api/validate-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrData: qrInput }),
      })

      const data: ValidationResponse = await response.json()
      setResult(data)

      if (!response.ok) {
        setError(data.error || "Validation failed")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setQrInput("")
    setResult(null)
    setError(null)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "used":
        return "text-green-600"
      case "paid":
        return "text-blue-600"
      case "reserved":
        return "text-yellow-600"
      case "cancelled":
      case "refunded":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "used":
        return <CheckCircle2 className="w-5 h-5 text-green-600" />
      case "paid":
        return <CheckCircle2 className="w-5 h-5 text-blue-600" />
      case "reserved":
        return <AlertCircle className="w-5 h-5 text-yellow-600" />
      case "cancelled":
      case "refunded":
        return <XCircle className="w-5 h-5 text-red-600" />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Ticket Validation</h1>
          <p className="text-muted-foreground">Scan or enter QR code to validate tickets</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Scan Ticket</CardTitle>
            <CardDescription>Enter the QR code data or ticket ID</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleValidate} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="qr-input" className="text-sm font-medium">
                  QR Code / Ticket ID
                </label>
                <Input
                  id="qr-input"
                  placeholder="Paste QR code data or ticket ID here..."
                  value={qrInput}
                  onChange={(e) => setQrInput(e.target.value)}
                  disabled={loading}
                  autoFocus
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={!qrInput || loading} className="flex-1">
                  {loading ? (
                    <>
                      <Spinner className="w-4 h-4 mr-2" />
                      Validating...
                    </>
                  ) : (
                    "Validate Ticket"
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={handleClear} disabled={loading}>
                  Clear
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Validation Result</CardTitle>
                {result.ticket && getStatusIcon(result.ticket.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {result.success && result.ticket ? (
                <>
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">{result.message}</AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Ticket ID</p>
                      <p className="font-mono font-semibold">{result.ticket.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Ticket Code</p>
                      <p className="font-mono font-semibold">{result.ticket.code}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Event</p>
                      <p className="font-semibold">{result.ticket.event_title}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Ticket Type</p>
                      <p className="font-semibold">{result.ticket.ticket_type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Attendee</p>
                      <p className="font-semibold">{result.ticket.user_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="text-sm">{result.ticket.user_email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <p className={`font-semibold capitalize ${getStatusColor(result.ticket.status)}`}>
                        {result.ticket.status}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Created</p>
                      <p className="text-sm">{new Date(result.ticket.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                </>
              ) : (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{result.message || "Ticket validation failed"}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
