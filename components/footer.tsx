import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t bg-muted/30 py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="text-center md:text-left mb-6 md:mb-0">
            <h3 className="font-bold mb-2">Reserve Your Spot</h3>
            <p className="text-lg font-semibold">+1 234 567 8900</p>
          </div>

          <div className="flex items-center gap-6">
            <Link href="#" className="hover:text-primary transition-colors text-2xl">
              <span className="sr-only">Instagram</span>📷
            </Link>
            <Link href="#" className="hover:text-primary transition-colors text-2xl">
              <span className="sr-only">TikTok</span>🎵
            </Link>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 District Vibez. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
