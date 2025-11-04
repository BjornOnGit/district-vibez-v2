"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b bg-background">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="font-bold text-xl">
          District Vibez
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <Link href="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <Link href="/gallery" className="hover:text-primary transition-colors">
            Gallery
          </Link>
          <Link href="/about" className="hover:text-primary transition-colors">
            About Party
          </Link>
          <Link href="/reservation" className="hover:text-primary transition-colors">
            Reservation
          </Link>
          <Link href="/contacts" className="hover:text-primary transition-colors">
            Contacts
          </Link>
        </div>

        <Button asChild>
          <Link href="/reservation">Reservation</Link>
        </Button>
      </div>
    </nav>
  )
}
