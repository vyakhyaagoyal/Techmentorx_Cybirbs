"use client";

import Link from "next/link";
import { useState } from "react";

export default function Home() {
  const [todos] = useState([
    {
      id: 1,
      subject: "Data Structures",
      topic: "Binary Search Trees",
      deadline: "2 days",
      priority: "high",
      completed: false,
    },
    {
      id: 2,
      subject: "Operating Systems",
      topic: "Process Synchronization",
      deadline: "4 days",
      priority: "medium",
      completed: false,
    },
    {
      id: 3,
      subject: "DBMS",
      topic: "Normalization Techniques",
      deadline: "6 days",
      priority: "high",
      completed: false,
    },
    {
      id: 4,
      subject: "Computer Networks",
      topic: "TCP/IP Protocol",
      deadline: "5 days",
      priority: "low",
      completed: false,
    },
  ]);

  return (
    <div className="min-h-full w-full flex justify-center">
      <main className="w-[calc(_100%_-_5em_)] mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 flex flex-col gap-14">
        {/* Welcome Section */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Welcome back, John! 🌿
          </h1>
          <p className="mt-2 text-sm sm:text-base text-gray-600">
            Here's your learning dashboard for today
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-emerald-100">
            <div className="text-xs sm:text-sm text-gray-500">
              Overall Position
            </div>
            <div className="text-xl sm:text-2xl font-bold text-emerald-600 mt-1 sm:mt-2">
              Top 25%
            </div>
          </div>
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-emerald-100">
            <div className="text-xs sm:text-sm text-gray-500">
              Pending Quizzes
            </div>
            <div className="text-xl sm:text-2xl font-bold text-amber-600 mt-1 sm:mt-2">
              2
            </div>
          </div>
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-emerald-100">
            <div className="text-xs sm:text-sm text-gray-500">
              Topics to Review
            </div>
            <div className="text-xl sm:text-2xl font-bold text-teal-600 mt-1 sm:mt-2">
              4
            </div>
          </div>
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="text-xs sm:text-sm text-gray-500">Attendance</div>
            <div className="text-xl sm:text-2xl font-bold text-green-600 mt-1 sm:mt-2">
              87%
            </div>
          </div>
        </div>

        {/* To-Do Tasks Section - Primary Feature */}
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              📚 Topics to Study
            </h2>
            <span className="text-xs sm:text-sm text-emerald-600 font-medium">
              🌱 Personalized learning path
            </span>
          </div>
          <div className="space-y-3 sm:space-y-4">
            {todos.map((todo) => (
              <div
                key={todo.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 border border-gray-200 rounded-xl hover:shadow-md transition-shadow"
              >
                <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                  <input
                    type="checkbox"
                    className="h-5 w-5 text-indigo-600 rounded mt-1 sm:mt-0 shrink-0"
                    checked={todo.completed}
                    readOnly
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                      {todo.subject}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 truncate">
                      {todo.topic}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 pl-8 sm:pl-0">
                  <span
                    className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium shrink-0 ${
                      todo.priority === "high"
                        ? "bg-red-100 text-red-800"
                        : todo.priority === "medium"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                    }`}
                  >
                    {todo.priority.toUpperCase()}
                  </span>
                  <span className="text-xs sm:text-sm text-gray-500 whitespace-nowrap">
                    Due in {todo.deadline}
                  </span>
                  <button className="px-3 sm:px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-xs sm:text-sm font-medium whitespace-nowrap">
                    Start Learning
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Primary Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Current Quiz */}
          <Link href="/quiz" className="block">
            <div className="bg-linear-to-br from-teal-500 to-emerald-600 rounded-xl shadow-lg p-4 sm:p-6 text-white hover:shadow-xl transition-shadow cursor-pointer h-full">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-lg sm:text-2xl font-bold">
                  📝 Current Quiz
                </h3>
                <span className="bg-white text-emerald-600 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold">
                  Active
                </span>
              </div>
              <p className="mb-3 sm:mb-4 text-sm sm:text-base opacity-95">
                Complete today's post-lecture quiz for Operating Systems
              </p>
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="opacity-90">Time remaining: 1h 45m</span>
                <span className="font-semibold">20 mins quiz →</span>
              </div>
            </div>
          </Link>

          {/* Vent Out Corner */}
          <Link href="/vent-out" className="block">
            <div className="bg-linear-to-br from-green-500 to-lime-600 rounded-xl shadow-lg p-4 sm:p-6 text-white hover:shadow-xl transition-shadow cursor-pointer h-full">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-lg sm:text-2xl font-bold">
                  💭 Wellness Corner
                </h3>
                <span className="bg-white text-green-600 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold">
                  New
                </span>
              </div>
              <p className="mb-3 sm:mb-4 text-sm sm:text-base opacity-95">
                Mental health support, games, and behavioral analysis
              </p>
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="opacity-90">Your wellness matters</span>
                <span className="font-semibold">Explore →</span>
              </div>
            </div>
          </Link>
        </div>

        {/* Secondary Features */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          <Link href="/analytics" className="block">
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200 hover:shadow-md transition-shadow h-full">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                📊 Analytics
              </h3>
              <p className="text-xs sm:text-sm text-gray-600">
                View your performance and attendance
              </p>
            </div>
          </Link>

          <Link href="/engagement" className="block">
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-emerald-100 hover:shadow-md transition-shadow h-full">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                👀 Engagement Tracking
              </h3>
              <p className="text-xs sm:text-sm text-gray-600">
                Track your lecture participation
              </p>
            </div>
          </Link>

          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer sm:col-span-2 md:col-span-1">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
              🎯 Study Resources
            </h3>
            <p className="text-xs sm:text-sm text-gray-600">
              Access PPTs and learning materials
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
