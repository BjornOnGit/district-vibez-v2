"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

export default function FreeOfferBanner() {
  const [timeLeft, setTimeLeft] = useState(0)

  useEffect(() => {
    // Simple 7-day countdown from first render; replace with server-driven expiry if needed
    const target = Date.now() + 7 * 24 * 60 * 60 * 1000
    const tick = () => {
      const diff = Math.max(0, target - Date.now())
      setTimeLeft(diff)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const format = (ms: number) => {
    const s = Math.floor(ms / 1000)
    const days = Math.floor(s / (24 * 3600))
    const hours = Math.floor((s % (24 * 3600)) / 3600)
    const minutes = Math.floor((s % 3600) / 60)
    const seconds = s % 60
    return `${days}d ${hours}h ${minutes}m ${seconds}s`
  }

  return (
    <div className="bg-yellow-50 border-b border-yellow-200 text-yellow-900 py-2">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <div className="text-sm">Limited time: Free ticket giveaway ends in <strong>{format(timeLeft)}</strong></div>
        <div className="flex items-center gap-4">
          <Link className="text-sm font-semibold underline" href="/reservation">
          Register now to get your free ticket
          </Link>
          {/* <Link className="px-3 py-1 bg-primary text-white rounded text-sm" href="/reservation">
              Get Free Ticket
          </Link> */}
        </div>
      </div>
    </div>
  )
}
