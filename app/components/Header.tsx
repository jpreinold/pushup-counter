"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { HiMenu, HiX, HiPlusCircle, HiChartBar, HiStar, HiFlag } from "react-icons/hi";

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
        Pushup Pal
      </Link>

      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setOpen(!open)}
          className="text-gray-700 hover:text-blue-600 text-2xl transition-colors duration-200"
          aria-label="Menu"
        >
          <div className="relative w-6 h-6">
            <HiMenu
              className={`absolute inset-0 w-6 h-6 transition-all duration-300 ${
                open ? "opacity-0 rotate-90" : "opacity-100 rotate-0"
              }`}
            />
            <HiX
              className={`absolute inset-0 w-6 h-6 transition-all duration-300 ${
                open ? "opacity-100 rotate-0" : "opacity-0 -rotate-90"
              }`}
            />
          </div>
        </button>

        <div
          className={`absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg z-50 transform transition-all duration-300 ease-out overflow-hidden border-t-2 border-gray-200 ${
            open ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
          }`}
        >
          <div className="py-2">
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200"
            >
              <HiPlusCircle className="w-5 h-5 mr-3 text-blue-600" />
              <span className="font-medium">Log Pushups</span>
            </Link>
            <Link
              href="/stats"
              onClick={() => setOpen(false)}
              className="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200"
            >
              <HiChartBar className="w-5 h-5 mr-3 text-blue-600" />
              <span className="font-medium">Stats</span>
            </Link>
            <Link
              href="/prestige"
              onClick={() => setOpen(false)}
              className="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200"
            >
              <HiStar className="w-5 h-5 mr-3 text-blue-600" />
              <span className="font-medium">Prestige Roadmap</span>
            </Link>
            <Link
              href="/goals"
              onClick={() => setOpen(false)}
              className="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200"
            >
              <HiFlag className="w-5 h-5 mr-3 text-blue-600" />
              <span className="font-medium">Set Goal</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
