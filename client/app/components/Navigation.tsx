"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<{ name: string; role: string } | null>(null);

  const navItems = [
  { name: "Dashboard", path: "/" },
  { name: "Analytics", path: "/analytics" },
  { name: "Vent Out Corner", path: "/vent-out" },
  { name: "Quiz", path: "/quiz" },

  // Show Engagement if NOT student
  ...(user?.role !== "student"
    ? [{ name: "Engagement", path: "/engagement" }]
    : []),
];

  // Load user on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");

    router.push("/login");
  };

  return (
    <nav className="bg-linear-to-r from-emerald-600 to-teal-600 text-white shadow-lg">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">

          {/* Logo */}
          <div className="flex items-center">
            <h1 className="text-lg sm:text-2xl font-bold">🌿 Bodha Setu</h1>
          </div>

          {/* Nav Links */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-2 lg:space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pathname === item.path
                      ? "bg-white text-emerald-600 shadow-sm"
                      : "hover:bg-emerald-500/80"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          {/* User Section */}
          <div className="flex items-center gap-3 text-xs sm:text-sm">

            {user ? (
              <>
                <span>
                  <span className="font-semibold hidden sm:inline">
                    User:
                  </span>{" "}
                  {user.name}
                </span>

                <button
                  onClick={handleLogout}
                  className="bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-md text-xs font-medium transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="bg-white/20 px-3 py-1.5 rounded-md"
              >
                Login
              </Link>
            )}

          </div>

        </div>
      </div>
    </nav>
  );
}
