"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HiMenu, HiX, HiPlusCircle, HiChartBar, HiStar, HiFlag, HiLogout, HiLogin, HiUserCircle } from "react-icons/hi";
import { useAuth } from "../context/AuthContext";

export default function Header() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthMenuOpen, setIsAuthMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const authMenuRef = useRef<HTMLDivElement>(null);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
      if (authMenuRef.current && !authMenuRef.current.contains(event.target as Node)) {
        setIsAuthMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
        setIsAuthMenuOpen(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  const handleSignOut = () => {
    signOut();
    setIsAuthMenuOpen(false);
  };

  const handleMenuItemClick = (path: string) => {
    setIsMenuOpen(false); // Close menu when clicking an item
    if (!user) {
      localStorage.setItem('redirectPath', path);
      router.push('/auth/login');
    } else {
      router.push(path);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-white shadow-md">
      <Link href="/" className="text-xl font-bold text-blue-600">
        Pushup Pal
      </Link>

      <div className="flex items-center gap-4">
        <div className="relative" ref={authMenuRef}>
          <button
            onClick={() => setIsAuthMenuOpen(!isAuthMenuOpen)}
            className="text-gray-700 hover:text-blue-600 text-2xl transition-colors duration-200"
            aria-label={user ? "Account" : "Login"}
          >
            <HiUserCircle className="w-6 h-6" />
          </button>

          {isAuthMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg z-50 transform transition-all duration-300 ease-out overflow-hidden border-t-2 border-gray-200">
              <div className="py-2">
                {user ? (
                  <>
                    <div className="px-4 py-3 text-sm text-gray-500 border-b border-gray-100">
                      Signed in as <span className="font-medium text-gray-700">{user.email}</span>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center w-full px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200"
                    >
                      <HiLogout className="w-5 h-5 mr-3 text-blue-600" />
                      <span className="font-medium">Sign out</span>
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/auth/login"
                      onClick={() => setIsAuthMenuOpen(false)}
                      className="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200"
                    >
                      <HiLogin className="w-5 h-5 mr-3 text-blue-600" />
                      <span className="font-medium">Sign in</span>
                    </Link>
                    <Link
                      href="/auth/signup"
                      onClick={() => setIsAuthMenuOpen(false)}
                      className="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200"
                    >
                      <HiUserCircle className="w-5 h-5 mr-3 text-blue-600" />
                      <span className="font-medium">Create account</span>
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-gray-700 hover:text-blue-600 text-2xl transition-colors duration-200"
            aria-label="Menu"
          >
            <div className="relative w-6 h-6">
              <HiMenu
                className={`absolute inset-0 w-6 h-6 transition-all duration-300 ${
                  isMenuOpen ? "opacity-0 rotate-90" : "opacity-100 rotate-0"
                }`}
              />
              <HiX
                className={`absolute inset-0 w-6 h-6 transition-all duration-300 ${
                  isMenuOpen ? "opacity-100 rotate-0" : "opacity-0 -rotate-90"
                }`}
              />
            </div>
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg z-50 transform transition-all duration-300 ease-out overflow-hidden border-t-2 border-gray-200">
              <div className="py-2">
                <button
                  onClick={() => handleMenuItemClick('/')}
                  className="flex items-center w-full px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200"
                >
                  <HiPlusCircle className="w-5 h-5 mr-3 text-blue-600" />
                  <span className="font-medium">Log Pushups</span>
                </button>
                <button
                  onClick={() => handleMenuItemClick('/stats')}
                  className="flex items-center w-full px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200"
                >
                  <HiChartBar className="w-5 h-5 mr-3 text-blue-600" />
                  <span className="font-medium">Stats</span>
                </button>
                <button
                  onClick={() => handleMenuItemClick('/prestige')}
                  className="flex items-center w-full px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200"
                >
                  <HiStar className="w-5 h-5 mr-3 text-blue-600" />
                  <span className="font-medium">Prestige Roadmap</span>
                </button>
                <button
                  onClick={() => handleMenuItemClick('/goals')}
                  className="flex items-center w-full px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200"
                >
                  <HiFlag className="w-5 h-5 mr-3 text-blue-600" />
                  <span className="font-medium">Set Goal</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
