export function Hero() {
  return (
    <section className="relative py-24 overflow-hidden">
      <div className="container mx-auto px-4 text-center">
        <p className="text-sm mb-4 font-medium">20 DECEMBER 2025</p>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-12 text-balance">IT'S DISTRICT VIBEZ TIME!</h1>

        {/* Placeholder for hero illustration */}
        <div className="w-full h-64 md:h-96 bg-muted rounded-lg flex items-center justify-center">
          <img src="https://iesv8fw9sjemyab3.public.blob.vercel-storage.com/IMG_0615.PNG" alt="hero illustration"/>
        </div>
      </div>
    </section>
  )
}
