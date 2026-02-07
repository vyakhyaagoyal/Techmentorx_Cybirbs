"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Engagement() {
  const [selectedSubject, setSelectedSubject] = useState("All Subjects");

  const subjects = [
    "All Subjects",
    "Data Structures",
    "Operating Systems",
    "DBMS",
    "Computer Networks",
    "Web Development",
  ];

  const lectureData = [
    {
      date: "Feb 6, 2026",
      subject: "Data Structures",
      topic: "Binary Search Trees - Insertion & Deletion",
      duration: "50 mins",
      avgEngagement: 45,
      yourEngagement: 35,
      attentionSpans: [60, 55, 40, 35, 30, 45],
      status: "needs-review",
    },
    {
      date: "Feb 6, 2026",
      subject: "Operating Systems",
      topic: "Process Synchronization",
      duration: "50 mins",
      avgEngagement: 72,
      yourEngagement: 85,
      attentionSpans: [85, 80, 75, 70, 65, 80],
      status: "good",
    },
    {
      date: "Feb 5, 2026",
      subject: "DBMS",
      topic: "Normalization - 3NF and BCNF",
      duration: "50 mins",
      avgEngagement: 58,
      yourEngagement: 50,
      attentionSpans: [65, 60, 50, 45, 40, 55],
      status: "average",
    },
    {
      date: "Feb 5, 2026",
      subject: "Computer Networks",
      topic: "TCP/IP Protocol Suite",
      duration: "50 mins",
      avgEngagement: 88,
      yourEngagement: 92,
      attentionSpans: [90, 92, 88, 90, 85, 95],
      status: "excellent",
    },
  ];

  const lowEngagementTopics = [
    {
      subject: "Data Structures",
      topic: "Binary Search Trees - Deletion",
      engagement: 35,
      teacherNotified: true,
    },
    {
      subject: "DBMS",
      topic: "BCNF Decomposition",
      engagement: 42,
      teacherNotified: true,
    },
    {
      subject: "Data Structures",
      topic: "AVL Tree Rotations",
      engagement: 38,
      teacherNotified: false,
    },
  ];

  const getEngagementColor = (engagement: number) => {
    if (engagement >= 80) return "text-green-600 bg-green-100";
    if (engagement >= 60) return "text-blue-600 bg-blue-100";
    if (engagement >= 40) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  const getEngagementStatus = (engagement: number) => {
    if (engagement >= 80) return "Excellent";
    if (engagement >= 60) return "Good";
    if (engagement >= 40) return "Average";
    return "Needs Attention";
  };

 const router = useRouter();
const [authorized, setAuthorized] = useState<null | boolean>(null);

useEffect(() => {
  const role = localStorage.getItem("role");

  if (!role) {
    router.replace("/login");
    return;
  }

  if (role === "teacher" || role === "admin") {
    setAuthorized(true);
  } else {
    router.replace("/dashboard");
  }
}, [router]);


 if (authorized === null) {
  return null; // prevents UI flash
}

if (!authorized) {
  return null;
}


return (
  <div className="min-h-screen">

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            👀 Student Engagement Tracking
          </h1>
          <p className="mt-2 text-gray-600">
            AI-powered analysis using OpenCV to track attention and interaction
          </p>
        </div>

        {/* Feature Highlight */}
        <div className="bg-linear-to-br from-emerald-600 to-teal-600 rounded-lg shadow-lg p-8 mb-8 text-white">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-4">
                🎯 Special Feature: Real-time Engagement Analysis
              </h2>
              <p className="mb-4 opacity-90">
                Our system uses advanced computer vision technology to analyze
                student facial expressions, eye movements, and body language
                during lectures. This provides valuable insights into which
                topics students find engaging or challenging.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 text-black">
                <div className="bg-white bg-opacity-20 rounded-lg p-4">
                  <div className="text-3xl font-bold">92%</div>
                  <div className="text-sm opacity-90">Accuracy Rate</div>
                </div>
                <div className="bg-white bg-opacity-20 rounded-lg p-4">
                  <div className="text-3xl font-bold">Real-time</div>
                  <div className="text-sm opacity-90">Analysis</div>
                </div>
                <div className="bg-white bg-opacity-20 rounded-lg p-4">
                  <div className="text-3xl font-bold">Privacy-First</div>
                  <div className="text-sm opacity-90">Data Processing</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">
              Filter by Subject:
            </span>
            <div className="flex space-x-2">
              {subjects.map((subject) => (
                <button
                  key={subject}
                  onClick={() => setSelectedSubject(subject)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedSubject === subject
                      ? "bg-emerald-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {subject}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Lecture Engagement Cards */}
        <div className="space-y-6 mb-8">
          {lectureData.map((lecture, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {lecture.subject}
                  </h3>
                  <p className="text-gray-600 mt-1">{lecture.topic}</p>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                    <span>📅 {lecture.date}</span>
                    <span>⏱️ {lecture.duration}</span>
                  </div>
                </div>
                <span
                  className={`px-4 py-2 rounded-full text-sm font-semibold ${getEngagementColor(lecture.yourEngagement)}`}
                >
                  {getEngagementStatus(lecture.yourEngagement)}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                {/* Your Engagement */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Your Engagement
                    </span>
                    <span className="text-2xl font-bold text-gray-900">
                      {lecture.yourEngagement}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${
                        lecture.yourEngagement >= 80
                          ? "bg-green-500"
                          : lecture.yourEngagement >= 60
                            ? "bg-blue-500"
                            : lecture.yourEngagement >= 40
                              ? "bg-yellow-500"
                              : "bg-red-500"
                      }`}
                      style={{ width: `${lecture.yourEngagement}%` }}
                    ></div>
                  </div>
                </div>

                {/* Class Average */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Class Average
                    </span>
                    <span className="text-2xl font-bold text-gray-900">
                      {lecture.avgEngagement}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-emerald-500 h-3 rounded-full"
                      style={{ width: `${lecture.avgEngagement}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Attention Throughout Lecture */}
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                  Attention Throughout Lecture
                </h4>
                <div className="flex items-end space-x-2 h-32">
                  {lecture.attentionSpans.map((span, idx) => (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col items-center"
                    >
                      <div
                        className="w-full bg-linear-to-t from-emerald-500 to-teal-300 rounded-t"
                        style={{ height: `${span}%` }}
                      ></div>
                      <span className="text-xs text-gray-500 mt-2">
                        {(idx + 1) * 10}m
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Insights */}
              {lecture.yourEngagement < 50 && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="text-sm font-semibold text-yellow-900 mb-2">
                    📊 Analysis
                  </h4>
                  <p className="text-sm text-yellow-800">
                    Your engagement was below average during this lecture. The
                    topic has been added to your "To Study" list for review.
                    Consider using guided learning to strengthen your
                    understanding.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Low Engagement Topics - Teacher Alert */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            🔔 Topics with Low Class Engagement
          </h2>
          <p className="text-gray-600 mb-6">
            These topics showed low engagement across the class. Teachers have
            been notified to consider revisiting these concepts.
          </p>
          <div className="space-y-4">
            {lowEngagementTopics.map((topic, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">
                    {topic.subject}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">{topic.topic}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {topic.engagement}%
                    </div>
                    <div className="text-xs text-gray-500">Avg. Engagement</div>
                  </div>
                  {topic.teacherNotified ? (
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                      ✓ Teacher Notified
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold">
                      Pending
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Impact Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-linear-to-br from-emerald-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
            <div className="text-4xl mb-2">📈</div>
            <div className="text-3xl font-bold mb-2">+15%</div>
            <div className="text-sm opacity-90">
              Average improvement in re-taught topics
            </div>
          </div>
          <div className="bg-linear-to-br from-teal-500 to-cyan-600 rounded-lg shadow-lg p-6 text-white">
            <div className="text-4xl mb-2">🎯</div>
            <div className="text-3xl font-bold mb-2">87%</div>
            <div className="text-sm opacity-90">
              Student satisfaction with personalized learning
            </div>
          </div>
          <div className="bg-linear-to-br from-lime-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
            <div className="text-4xl mb-2">⚡</div>
            <div className="text-3xl font-bold mb-2">Real-time</div>
            <div className="text-sm opacity-90">
              Feedback enables immediate intervention
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
