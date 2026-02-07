"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", path: "/" },
    { name: "Analytics", path: "/analytics" },
    { name: "Vent Out Corner", path: "/vent-out" },
    { name: "Quiz", path: "/quiz" },
    { name: "Engagement", path: "/engagement" },
  ];

  return (
    <nav className="bg-linear-to-r from-emerald-600 to-teal-600 text-white shadow-lg">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          <div className="flex items-center">
            <div className="shrink-0">
              <h1 className="text-lg sm:text-2xl font-bold">🌿 BodhaSetu</h1>
            </div>
          </div>
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
          <div className="flex items-center">
            <div className="text-xs sm:text-sm">
              <span className="font-semibold hidden sm:inline">Student: </span>
              <span>John Doe</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
