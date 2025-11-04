export function EventDetails() {
  const activities = [
    "Live DJ Performance",
    "Dance Competition",
    "Themed Photo Booth",
    "Exclusive DJ Set",
    "Premium Bar Service",
    "VIP Lounge Access",
  ]

  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 uppercase">Join us</h2>
        <p className="text-center mb-4 font-semibold uppercase">→ THIS YEAR'S DISTRICT VIBEZ PARTY! ←</p>

        <p className="text-center text-sm md:text-base mb-12 max-w-2xl mx-auto">
          Our district vibez event this year will be an unforgettable experience, filled with electric energy, amazing
          music, thrilling games, and costume contests. Join us for a night of magic and excitement!
        </p>

        <div className="bg-background border rounded-lg p-8 mb-12 max-w-md mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <span>📅</span>
            <span className="text-sm font-medium">Tue, 31 December 2025, 19:00</span>
          </div>
          <div className="flex items-center gap-2 mb-8">
            <span>📍</span>
            <span className="text-sm font-medium">Main District Club</span>
          </div>

          <div className="space-y-3">
            {activities.map((activity, index) => (
              <div key={index} className="flex items-center gap-3">
                <input type="checkbox" disabled className="w-4 h-4" />
                <span className="text-sm">{activity}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
