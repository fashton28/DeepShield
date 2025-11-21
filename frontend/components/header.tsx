"use client"

import Link from "next/link"

export default function Header() {
  return (
    <header className="relative z-20 flex items-center justify-between p-6">
      {/* Logo / Product Name */}
      <div className="flex items-center">
        <h2 className="text-white text-xl font-semibold tracking-tight">Deep Shield</h2>
      </div>

      {/* Navigation */}
      <nav className="flex items-center space-x-2">
        <a
          href="#"
          className="text-white/80 hover:text-white text-xs font-light px-3 py-2 rounded-full hover:bg-white/10 transition-all duration-200"
        >
          Features
        </a>
        <a
          href="#"
          className="text-white/80 hover:text-white text-xs font-light px-3 py-2 rounded-full hover:bg-white/10 transition-all duration-200"
        >
          Pricing
        </a>
        <a
          href="#"
          className="text-white/80 hover:text-white text-xs font-light px-3 py-2 rounded-full hover:bg-white/10 transition-all duration-200"
        >
          Docs
        </a>
      </nav>

      <Link href="/dashboard">
        <button className="px-6 py-2 rounded-full bg-white text-black font-normal text-xs transition-all duration-300 hover:bg-blue-300 cursor-pointer h-8 flex items-center">
          Get Started
        </button>
      </Link>
    </header>
  )
}
