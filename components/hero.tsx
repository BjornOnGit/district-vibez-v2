export function Hero() {
  return (
    <section className="relative py-24 overflow-hidden">
      <div className="container mx-auto px-4 text-center">
        <p className="text-sm mb-4 font-medium">31 DECEMBER 2025</p>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-12 text-balance">IT'S DISTRICT VIBEZ TIME!</h1>

        {/* Placeholder for hero illustration */}
        <div className="w-full h-64 md:h-96 bg-muted rounded-lg flex items-center justify-center">
          <p className="text-muted-foreground">Hero Image</p>
        </div>
      </div>
    </section>
  )
}
