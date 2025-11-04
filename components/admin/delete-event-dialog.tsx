"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Trash2 } from "lucide-react"

interface DeleteEventDialogProps {
  eventId: string
  eventName: string
  onDelete: (eventId: string) => Promise<void>
}

export function DeleteEventDialog({ eventId, eventName, onDelete }: DeleteEventDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    setIsDeleting(true)
    setError(null)

    try {
      await onDelete(eventId)
      setIsOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete event")
    } finally {
      setIsDeleting(false)
    }
  }

  if (!isOpen) {
    return (
      <Button variant="destructive" size="sm" onClick={() => setIsOpen(true)} className="gap-2">
        <Trash2 className="w-4 h-4" />
        Delete
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-background rounded-lg shadow-lg p-6 max-w-sm w-full">
        <h2 className="text-lg font-semibold mb-4">Delete Event</h2>

        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            Are you sure you want to delete "{eventName}"? This action cannot be undone.
          </AlertDescription>
        </Alert>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>
    </div>
  )
}
