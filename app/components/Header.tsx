// app/components/Header.tsx
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
    <header className="flex items-center justify-between px-6 py-4 bg-white shadow-md mb-6">
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

        {open && (
          <div className="absolute right-0 mt-2 w-48 bg-white border rounded shadow z-50">
            <Link
              href="/stats"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              📊 Stats
            </Link>
            <Link
              href="/prestige"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              🧱 Prestige Roadmap
            </Link>
            {/* Add more links here as needed */}
          </div>
        )}
      </div>
    </header>
  );
}
