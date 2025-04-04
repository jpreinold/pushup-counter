"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { FiSettings } from "react-icons/fi";

export default function Header() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-white shadow-md">
      <Link href="/" className="text-xl font-bold text-blue-600">
        Pushup Counter
      </Link>

      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setOpen(!open)}
          className="text-gray-700 hover:text-blue-600 text-xl"
        >
          <FiSettings />
        </button>

        <div
          className={`absolute right-0 mt-2 w-48 bg-white border rounded shadow z-50 transform transition-all duration-300 ease-out ${
            open ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
          }`}
        >
          <Link
            href="/stats"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            📊 Stats
          </Link>
          <Link
            href="/prestige"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            🧱 Prestige Roadmap
          </Link>
          <Link
            href="/goals"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            🎯 Set Goal
          </Link>
        </div>
      </div>
    </header>
  );
}
