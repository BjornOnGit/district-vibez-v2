"use client"

import type React from "react"

import { useConvex } from "convex/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { AlertCircle, ArrowLeft } from "lucide-react"

type EventFormProps = {
  eventId?: string
  isEditing?: boolean
}

export default function EventForm({ eventId, isEditing }: EventFormProps) {
  const convex = useConvex()
  const router = useRouter()
  const [loading, setLoading] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    date: "",
    venue: "",
    ticketPrice: 0,
    totalTickets: 0,
    availableTickets: 0,
    status: "active" as const,
    imageUrl: "",
  })

  useEffect(() => {
    if (isEditing && eventId) {
      const fetchEvent = async () => {
        try {
          setLoading(true)
          const event = await convex.query("events:getEvent" as any, { id: eventId })
          if (event) {
            setFormData({
              name: event.name,
              description: event.description,
              date: event.date,
              venue: event.venue,
              ticketPrice: event.ticketPrice,
              totalTickets: event.totalTickets,
              availableTickets: event.availableTickets,
              status: event.status,
              imageUrl: event.imageUrl || "",
            })
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to load event")
        } finally {
          setLoading(false)
        }
      }

      fetchEvent()
    }
  }, [convex, isEditing, eventId])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name.includes("Price") || name.includes("Tickets") ? Number(value) : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.name || !formData.venue || !formData.date) {
      setError("Please fill in all required fields")
      return
    }

    try {
      setSaving(true)

      if (isEditing && eventId) {
        await convex.mutation("events:update" as any, { id: eventId, ...formData })
      } else {
        await convex.mutation("events:create" as any, formData)
      }

      router.push("/admin/events")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save event")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Basic Info */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4 text-foreground">Event Details</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Name *</label>
            <Input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Event name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Event description"
              rows={4}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Venue *</label>
            <Input
              type="text"
              name="venue"
              value={formData.venue}
              onChange={handleInputChange}
              placeholder="Event venue"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Date *</label>
            <Input type="date" name="date" value={formData.date} onChange={handleInputChange} required />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Ticket Price</label>
              <Input
                type="number"
                name="ticketPrice"
                value={formData.ticketPrice}
                onChange={handleInputChange}
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Total Tickets</label>
              <Input
                type="number"
                name="totalTickets"
                value={formData.totalTickets}
                onChange={handleInputChange}
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Available Tickets</label>
              <Input
                type="number"
                name="availableTickets"
                value={formData.availableTickets}
                onChange={handleInputChange}
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="active">Active</option>
              <option value="sold_out">Sold Out</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Image URL</label>
            <Input
              type="text"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleInputChange}
              placeholder="https://..."
            />
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex gap-2 justify-between">
        <Button type="button" variant="outline" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <Button type="submit" disabled={saving} className="gap-2">
          {saving ? <Spinner size="sm" /> : null}
          {isEditing ? "Update Event" : "Create Event"}
        </Button>
      </div>
    </form>
  )
}
