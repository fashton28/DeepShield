"use client"

import Link from "next/link"

export default function HeroContent() {
  return (
    <main className="absolute inset-0 z-20 flex items-center justify-center">
      <div className="text-center max-w-4xl px-6">
        <div
          className="inline-flex items-center px-3 py-1 rounded-full bg-white/5 backdrop-blur-sm mb-6 relative"
          style={{
            filter: "url(#glass-effect)",
          }}
        >
          <div className="absolute top-0 left-1 right-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full" />
          <span className="text-white/90 text-xs font-light relative z-10">🔍 Detect Synthetic Media</span>
        </div>

        <h1 className="text-5xl md:text-7xl lg:text-8xl tracking-tight font-light text-white mb-6">
          <span className="font-medium italic">Verify</span> Media
          <br />
          <span className="font-light tracking-tight text-white">Authenticity</span>
        </h1>

        <p className="text-sm md:text-base font-light text-white/70 mb-8 leading-relaxed max-w-2xl mx-auto">
          Protect yourself from deepfakes with our advanced detection technology. Verify if videos and images,
          are authentic or synthetically generated.
        </p>

        {/* Buttons */}
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <button className="px-8 py-3 rounded-full bg-transparent border border-white/30 text-white font-normal text-xs transition-all duration-200 hover:bg-white/10 hover:border-white/50 cursor-pointer">
            Learn More
          </button>
          <Link href="/dashboard">
            <button className="px-8 py-3 rounded-full bg-white text-black font-normal text-xs transition-all duration-200 hover:bg-blue-300 cursor-pointer">
              Get Started
            </button>
          </Link>
        </div>
      </div>
    </main>
  )
}
