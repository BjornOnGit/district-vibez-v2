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
import { AlertCircle, ArrowLeft, Plus, X } from "lucide-react"

type TicketType = {
  type: string
  price: number
  currency?: string
}

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
    ticketPricing: [] as TicketType[],
    imageUrl: "",
    status: "active" as "active" | "sold_out" | "cancelled",
  })

  useEffect(() => {
    if (isEditing && eventId) {
      const fetchEvent = async () => {
        try {
          setLoading(true)
          const event = await convex.query("events:getById" as any, { eventId })
          if (event) {
            setFormData({
              name: event.name || "",
              description: event.description || "",
              date: event.date ? new Date(event.date).toISOString().split("T")[0] : "",
              venue: event.venue || "",
              ticketPrice: event.ticketPrice || 0,
              totalTickets: event.totalTickets || 0,
              availableTickets: event.availableTickets || event.totalTickets || 0,
              ticketPricing: event.ticketPricing || [],
              imageUrl: event.imageUrl || "",
              status: event.status || "active",
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
      [name]: name === "totalTickets" || name === "availableTickets" || name === "ticketPrice" ? Number(value) : value,
    }))
  }

  const handleTicketPricingChange = (index: number, field: keyof TicketType, value: any) => {
    const updated = [...formData.ticketPricing]
    const current = { ...(updated[index] || { type: "", price: 0 }) }
    if (field === "price") {
      current.price = Number(value)
    } else {
      // @ts-ignore
      current[field] = value
    }
    updated[index] = current
    setFormData((prev) => ({ ...prev, ticketPricing: updated }))
  }

  const addTicketType = () => {
    setFormData((prev) => ({ ...prev, ticketPricing: [...prev.ticketPricing, { type: "", price: 0 }] }))
  }

  const removeTicketType = (index: number) => {
    setFormData((prev) => ({ ...prev, ticketPricing: prev.ticketPricing.filter((_, i) => i !== index) }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.name || !formData.description || !formData.venue || !formData.date) {
      setError("Please fill in all required fields (Name, Description, Venue, Date)")
      return
    }

    try {
      setSaving(true)

      if (isEditing && eventId) {
        await convex.mutation("events:update" as any, {
          id: eventId,
          name: formData.name,
          description: formData.description,
          date: formData.date,
          venue: formData.venue,
          ticketPrice: formData.ticketPrice,
          totalTickets: formData.totalTickets,
          availableTickets: formData.availableTickets,
          status: formData.status,
          ticketPricing: formData.ticketPricing,
          imageUrl: formData.imageUrl || undefined,
        })
      } else {
        await convex.mutation("events:create" as any, {
          name: formData.name,
          description: formData.description,
          date: formData.date,
          venue: formData.venue,
          ticketPrice: formData.ticketPrice,
          totalTickets: formData.totalTickets,
          availableTickets: formData.availableTickets || formData.totalTickets,
          status: formData.status,
          ticketPricing: formData.ticketPricing,
          imageUrl: formData.imageUrl || undefined,
        })
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
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Event Details */}
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
            <label className="block text-sm font-medium text-foreground mb-1">Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Event description"
              rows={4}
              required
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Date *</label>
              <Input type="date" name="date" value={formData.date} onChange={handleInputChange} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Image URL</label>
              <Input type="text" name="imageUrl" value={formData.imageUrl} onChange={handleInputChange} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
              aria-label="status"
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="active">Active</option>
              <option value="sold_out">Sold out</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Ticket Types */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4 text-foreground">Ticket Types</h2>
        <div className="space-y-4">
          {formData.ticketPricing.map((tp, idx) => (
            <div key={idx} className="grid grid-cols-3 gap-2 items-center">
              <Input
                type="text"
                value={tp.type}
                onChange={(e) => handleTicketPricingChange(idx, "type", e.target.value)}
                placeholder="Type (e.g. regular)"
              />
              <Input
                type="number"
                value={tp.price}
                onChange={(e) => handleTicketPricingChange(idx, "price", Number(e.target.value))}
                placeholder="Price (NGN)"
              />
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => removeTicketType(idx)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}

          <Button type="button" variant="outline" size="sm" onClick={addTicketType} className="gap-2 w-full">
            <Plus className="w-4 h-4" />
            Add Ticket Type
          </Button>
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
