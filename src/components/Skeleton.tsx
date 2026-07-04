'use client'

function ShimmerBase({ className }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden ${className || ''}`}>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/5 to-transparent" />
    </div>
  )
}

export function SkeletonLine({ className }: { className?: string }) {
  return <ShimmerBase className={`h-3 rounded-md bg-neutral-800/60 ${className || ''}`} />
}

export function SkeletonTitle({ className }: { className?: string }) {
  return <ShimmerBase className={`h-5 rounded-md bg-neutral-800/60 w-3/4 ${className || ''}`} />
}

export function SkeletonAvatar({ className }: { className?: string }) {
  return <ShimmerBase className={`w-10 h-10 rounded-xl bg-neutral-800/60 ${className || ''}`} />
}

export function SkeletonBookCard() {
  return (
    <div className="glass-card p-5">
      <ShimmerBase className="w-11 h-11 rounded-xl bg-neutral-800/60 mb-3" />
      <ShimmerBase className="h-4 rounded-md bg-neutral-800/60 w-4/5 mb-2" />
      <ShimmerBase className="h-3 rounded-md bg-neutral-800/60 w-full mb-1" />
      <ShimmerBase className="h-3 rounded-md bg-neutral-800/60 w-2/3 mb-3" />
      <div className="flex items-center gap-2 mt-3">
        <ShimmerBase className="h-2.5 rounded bg-neutral-800/60 w-14" />
        <ShimmerBase className="h-2.5 rounded bg-neutral-800/60 w-16" />
      </div>
      <ShimmerBase className="h-2.5 rounded bg-neutral-800/60 w-20 mt-1" />
    </div>
  )
}

export function SkeletonStatCard() {
  return (
    <div className="glass-card p-5">
      <ShimmerBase className="h-3 rounded bg-neutral-800/60 w-20 mb-3" />
      <ShimmerBase className="h-8 rounded-md bg-neutral-800/60 w-16" />
    </div>
  )
}

export function SkeletonSearchBookCard() {
  return (
    <div className="glass-card p-4">
      <ShimmerBase className="h-4 rounded bg-neutral-800/60 w-4/5 mb-2" />
      <ShimmerBase className="h-3 rounded bg-neutral-800/60 w-full mb-1" />
      <ShimmerBase className="h-3 rounded bg-neutral-800/60 w-3/5 mb-2" />
      <div className="flex items-center gap-2 mt-2">
        <ShimmerBase className="h-2.5 rounded bg-neutral-800/60 w-14" />
        <ShimmerBase className="h-2.5 rounded bg-neutral-800/60 w-12" />
      </div>
    </div>
  )
}

export function SkeletonCategoryChip() {
  return <ShimmerBase className="h-9 rounded-xl bg-neutral-800/60 w-28" />
}

export function SkeletonAnnouncementItem() {
  return (
    <div className="glass-card !rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <ShimmerBase className="h-3 w-12 rounded bg-neutral-800/60" />
      </div>
      <ShimmerBase className="h-4 rounded bg-neutral-800/60 w-3/5 mb-1.5" />
      <ShimmerBase className="h-3 rounded bg-neutral-800/60 w-full mb-1" />
      <ShimmerBase className="h-3 rounded bg-neutral-800/60 w-4/5 mb-2" />
      <ShimmerBase className="h-2.5 rounded bg-neutral-800/60 w-32" />
    </div>
  )
}

export function SkeletonLogItem() {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-white/5">
      <ShimmerBase className="h-4 w-14 rounded bg-neutral-800/60 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0 space-y-1.5">
        <ShimmerBase className="h-3 rounded bg-neutral-800/60 w-full" />
        <ShimmerBase className="h-2.5 rounded bg-neutral-800/60 w-36" />
      </div>
    </div>
  )
}

export function SkeletonBooksGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonBookCard key={i} />
      ))}
    </div>
  )
}

export function SkeletonStatsGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
      {Array.from({ length: 8 }).map((_, i) => (
        <SkeletonStatCard key={i} />
      ))}
    </div>
  )
}

export function ImageWithSkeleton({ src, alt, className }: { src: string | null; alt: string; className?: string }) {
  return null
}
