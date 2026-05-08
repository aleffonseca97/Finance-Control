function VideoSlot({
  id,
  title,
  src,
  className,
}: {
  id: string
  title: string
  src: string
  className?: string
}) {
  return (
    <div
      id={id}
      className={`overflow-hidden ${className ?? ''}`}
    >
      <video
        className="h-full w-full object-contain"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={title}
      >
        <source src={src} type="video/webm" />
      </video>
    </div>
  )
}

export default function ScreenshotsSection() {
  return (
    <section className="py-24 bg-zinc-50 dark:bg-zinc-900/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header — centered for visual balance in this section */}
        <div className="max-w-xl mx-auto text-center mb-14">
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-4">
            Veja em ação
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tighter text-zinc-900 dark:text-zinc-50 [font-family:var(--font-outfit)] leading-tight">
            Interface construída para clareza.
          </h2>
        </div>

        <div className="max-w-5xl mx-auto">
          <VideoSlot
            id="screenshot-dashboard"
            title="Demonstracao do dashboard principal"
            src="/landingpage_dashboard.webm"
            className="aspect-[16/10]"
          />
        </div>
      </div>
    </section>
  )
}
