"use client";

import { useState } from "react";

export default function Analytics() {
  const [selectedSemester] = useState("Current Semester");

  const subjectPerformance = [
    {
      subject: "Data Structures & Algorithms",
      score: 78,
      percentile: 45,
      trend: "up",
      color: "bg-blue-500",
    },
    {
      subject: "Operating Systems",
      score: 85,
      percentile: 25,
      trend: "up",
      color: "bg-green-500",
    },
    {
      subject: "Database Management",
      score: 72,
      percentile: 60,
      trend: "down",
      color: "bg-yellow-500",
    },
    {
      subject: "Computer Networks",
      score: 88,
      percentile: 15,
      trend: "up",
      color: "bg-purple-500",
    },
    {
      subject: "Web Development",
      score: 91,
      percentile: 10,
      trend: "up",
      color: "bg-indigo-500",
    },
  ];

  const attendanceData = [
    { month: "Aug", percentage: 82 },
    { month: "Sep", percentage: 85 },
    { month: "Oct", percentage: 88 },
    { month: "Nov", percentage: 87 },
    { month: "Dec", percentage: 89 },
    { month: "Jan", percentage: 87 },
  ];

  return (
    <div className="min-h-screen w-full">
      <main className="w-full max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            📊 Performance Analytics
          </h1>
          <p className="mt-2 text-sm sm:text-base text-gray-600">
            Track your academic progress and identify areas for improvement
          </p>
        </div>

        {/* Overall Performance Card */}
        <div className="bg-linear-to-br from-emerald-600 to-teal-600 rounded-xl shadow-lg p-6 sm:p-8 mb-8 text-white">
          <h2 className="text-xl sm:text-2xl font-bold mb-6">
            🌱 Overall Performance Summary
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            <div className="p-4 bg-white/10 rounded-lg">
              <div className="text-sm opacity-90 mb-2">Your Position</div>
              <div className="text-3xl sm:text-4xl font-bold">Top 25%</div>
              <div className="text-xs sm:text-sm mt-2 opacity-90">
                You are ahead of 75% of students in your department
              </div>
            </div>
            <div className="p-4 bg-white/10 rounded-lg">
              <div className="text-sm opacity-90 mb-2">Average Score</div>
              <div className="text-3xl sm:text-4xl font-bold">82.8%</div>
              <div className="text-xs sm:text-sm mt-2 opacity-90 flex items-center flex-wrap">
                <span className="text-green-300">↑ 3.5%</span>
                <span className="ml-2">from last month</span>
              </div>
            </div>
            <div className="p-4 bg-white/10 rounded-lg sm:col-span-2 md:col-span-1">
              <div className="text-sm opacity-90 mb-2">Attendance Rate</div>
              <div className="text-3xl sm:text-4xl font-bold">87%</div>
              <div className="text-xs sm:text-sm mt-2 opacity-90">
                Current semester average
              </div>
            </div>
          </div>
        </div>

        {/* Insights & Recommendations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-bold text-blue-900 mb-4">
              🎯 Key Insights
            </h3>
            <ul className="space-y-3 text-xs sm:text-sm text-blue-800">
              <li className="flex items-start">
                <span className="mr-2 shrink-0">•</span>
                <span>
                  Your DSA performance needs attention - you're behind 45% of
                  students
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 shrink-0">•</span>
                <span>
                  Strong performance in Web Development and Computer Networks
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 shrink-0">•</span>
                <span>
                  Your attendance has been consistently good this semester
                </span>
              </li>
            </ul>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-xl p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-bold text-green-900 mb-4">
              💡 AI Recommendations
            </h3>
            <ul className="space-y-3 text-xs sm:text-sm text-green-800">
              <li className="flex items-start">
                <span className="mr-2 shrink-0">•</span>
                <span>
                  Focus on Binary Search Trees and Dynamic Programming in DSA
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 shrink-0">•</span>
                <span>Complete 4 pending topics in the "To Study" section</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 shrink-0">•</span>
                <span>
                  Take advantage of your strong subjects to help peers
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Subject-wise Performance */}
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">
            Subject-wise Performance
          </h2>
          <div className="space-y-4 sm:space-y-6">
            {subjectPerformance.map((subject, index) => (
              <div
                key={index}
                className="border-b border-gray-200 pb-4 sm:pb-6 last:border-b-0 last:pb-0"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                      {subject.subject}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                      You are behind{" "}
                      <span className="font-semibold text-red-600">
                        {subject.percentile}%
                      </span>{" "}
                      of students
                    </p>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                    <div className="text-left sm:text-right">
                      <div className="text-xl sm:text-2xl font-bold text-gray-900">
                        {subject.score}%
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500">
                        Current Score
                      </div>
                    </div>
                    {subject.trend === "up" ? (
                      <div className="text-green-500 text-xl sm:text-2xl">
                        ↑
                      </div>
                    ) : (
                      <div className="text-red-500 text-xl sm:text-2xl">↓</div>
                    )}
                  </div>
                </div>
                <div className="relative pt-1">
                  <div className="flex mb-2 items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold inline-block text-gray-600">
                        Progress
                      </span>
                    </div>
                  </div>
                  <div className="overflow-hidden h-2 sm:h-3 text-xs flex rounded-full bg-gray-200">
                    <div
                      style={{ width: `${subject.score}%` }}
                      className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center rounded-full transition-all duration-500 ${subject.color}`}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Attendance Tracking */}
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">
            Attendance Tracking - {selectedSemester}
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 sm:gap-4">
            {attendanceData.map((data, index) => (
              <div key={index} className="text-center">
                <div className="mb-2 text-xs sm:text-sm font-medium text-gray-600">
                  {data.month}
                </div>
                <div className="relative h-24 sm:h-32 bg-gray-100 rounded-lg overflow-hidden">
                  <div
                    className="absolute bottom-0 w-full bg-linear-to-t from-emerald-500 to-emerald-400 transition-all duration-500"
                    style={{ height: `${data.percentage}%` }}
                  ></div>
                </div>
                <div className="mt-2 text-sm sm:text-lg font-bold text-gray-900">
                  {data.percentage}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
