"use client";

import { useState } from "react";

export default function VentOut() {
  const [messages, setMessages] = useState<
    Array<{ role: string; content: string }>
  >([
    {
      role: "assistant",
      content:
        "Hello! I'm here to listen and support you. How are you feeling today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [moodScore] = useState(7);

  const handleSendMessage = () => {
    if (input.trim()) {
      setMessages([...messages, { role: "user", content: input }]);
      // Simulate AI response
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "I understand. It's completely normal to feel this way. Would you like to talk more about what's on your mind?",
          },
        ]);
      }, 1000);
      setInput("");
    }
  };

  return (
    <div className="min-h-screen w-full">
      <main className="w-full max-w-7xl mx-auto py-6 sm:py-8 lg:py-10 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8 lg:mb-10">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
            🌿 Wellness Corner
          </h1>
          <p className="mt-2 sm:mt-3 text-sm sm:text-base text-gray-600">
            Your personal space for mental health and wellness
          </p>
        </div>

        {/* Mental Health Status */}
        <div className="bg-linear-to-br from-emerald-600 to-teal-600 rounded-xl shadow-lg p-6 sm:p-8 lg:p-10 mb-6 sm:mb-8 lg:mb-10 text-white">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-6 sm:mb-8">
            🌱 Your Wellness Dashboard
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            <div className="p-4 sm:p-5 bg-white/10 rounded-lg">
              <div className="text-xs sm:text-sm opacity-90 mb-2">
                Current Mood Score
              </div>
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold">
                {moodScore}/10
              </div>
              <div className="text-xs sm:text-sm mt-2 sm:mt-3 opacity-90">
                Based on this week's interactions
              </div>
            </div>
            <div className="p-4 sm:p-5 bg-white/10 rounded-lg">
              <div className="text-xs sm:text-sm opacity-90 mb-2">
                Stress Level
              </div>
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold">
                Moderate
              </div>
              <div className="text-xs sm:text-sm mt-2 sm:mt-3 opacity-90 flex items-center flex-wrap">
                <span className="text-green-300">↓ Decreased</span>
                <span className="ml-2">from last week</span>
              </div>
            </div>
            <div className="p-4 sm:p-5 bg-white/10 rounded-lg sm:col-span-2 lg:col-span-1">
              <div className="text-xs sm:text-sm opacity-90 mb-2">
                Activities Completed
              </div>
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold">
                12
              </div>
              <div className="text-xs sm:text-sm mt-2 sm:mt-3 opacity-90">
                This month
              </div>
            </div>
          </div>
        </div>

        {/* Main Features Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-10 mb-6 sm:mb-8 lg:mb-10">
          {/* AI Therapist Chatbot */}
          <div className="bg-white rounded-xl shadow-md p-5 sm:p-6 lg:p-8">
            <div className="flex items-center justify-between mb-5 sm:mb-6">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                💬 Wellness Chatbot
              </h2>
              <span className="text-xs sm:text-sm bg-green-100 text-green-800 px-3 py-1.5 rounded-full font-medium">
                Active
              </span>
            </div>
            <div className="border border-gray-200 rounded-xl p-4 sm:p-5 h-72 sm:h-80 lg:h-96 overflow-y-auto mb-5 sm:mb-6 bg-gray-50">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`mb-4 ${msg.role === "user" ? "text-right" : "text-left"}`}
                >
                  <div
                    className={`inline-block px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl max-w-[85%] sm:max-w-[80%] text-sm sm:text-base ${
                      msg.role === "user"
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "bg-gray-200 text-gray-900 shadow-sm"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 sm:gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Share what's on your mind..."
                className="flex-1 px-4 sm:px-5 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              <button
                onClick={handleSendMessage}
                className="px-5 sm:px-7 py-2.5 sm:py-3 text-sm sm:text-base bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium shadow-sm"
              >
                Send
              </button>
            </div>
          </div>

          {/* Behavioral Analysis */}
          <div className="bg-white rounded-xl shadow-md p-5 sm:p-6 lg:p-8">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-5 sm:mb-6">
              📊 Behavioral Analysis
            </h2>
            <div className="space-y-5 sm:space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2.5">
                  <span className="text-sm sm:text-base font-medium text-gray-700">
                    Anxiety Level
                  </span>
                  <span className="text-sm sm:text-base font-semibold text-gray-900">
                    Low
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 sm:h-3">
                  <div
                    className="bg-green-500 h-2.5 sm:h-3 rounded-full transition-all duration-500"
                    style={{ width: "30%" }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2.5">
                  <span className="text-sm sm:text-base font-medium text-gray-700">
                    Motivation
                  </span>
                  <span className="text-sm sm:text-base font-semibold text-gray-900">
                    High
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 sm:h-3">
                  <div
                    className="bg-blue-500 h-2.5 sm:h-3 rounded-full transition-all duration-500"
                    style={{ width: "75%" }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2.5">
                  <span className="text-sm sm:text-base font-medium text-gray-700">
                    Social Engagement
                  </span>
                  <span className="text-sm sm:text-base font-semibold text-gray-900">
                    Moderate
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 sm:h-3">
                  <div
                    className="bg-yellow-500 h-2.5 sm:h-3 rounded-full transition-all duration-500"
                    style={{ width: "50%" }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2.5">
                  <span className="text-sm sm:text-base font-medium text-gray-700">
                    Sleep Quality
                  </span>
                  <span className="text-sm sm:text-base font-semibold text-gray-900">
                    Good
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 sm:h-3">
                  <div
                    className="bg-purple-500 h-2.5 sm:h-3 rounded-full transition-all duration-500"
                    style={{ width: "65%" }}
                  ></div>
                </div>
              </div>
            </div>
            <div className="mt-6 sm:mt-8 p-4 sm:p-5 bg-green-50 border border-green-200 rounded-xl">
              <h3 className="text-sm sm:text-base font-semibold text-green-900 mb-2.5">
                🌿 Insights
              </h3>
              <p className="text-xs sm:text-sm text-green-800 leading-relaxed">
                Your mood has improved over the past week. Continue engaging
                with wellness activities and consider taking breaks between
                study sessions.
              </p>
            </div>
          </div>
        </div>

        {/* Brain Games & Activities */}
        <div className="bg-white rounded-xl shadow-md p-5 sm:p-6 lg:p-8 mb-6 sm:mb-8 lg:mb-10">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">
            🎮 Brain Games & Activities
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
            <div className="border-2 border-gray-200 rounded-xl p-5 sm:p-6 hover:shadow-lg hover:border-emerald-300 transition-all cursor-pointer">
              <div className="text-4xl sm:text-5xl mb-3">🧩</div>
              <h3 className="font-semibold text-gray-900 mb-2 text-base sm:text-lg">
                Memory Match
              </h3>
              <p className="text-xs sm:text-sm text-gray-600">
                Improve cognitive function
              </p>
            </div>
            <div className="border-2 border-gray-200 rounded-xl p-5 sm:p-6 hover:shadow-lg hover:border-emerald-300 transition-all cursor-pointer">
              <div className="text-4xl sm:text-5xl mb-3">🎯</div>
              <h3 className="font-semibold text-gray-900 mb-2 text-base sm:text-lg">
                Focus Challenge
              </h3>
              <p className="text-xs sm:text-sm text-gray-600">
                Enhance concentration
              </p>
            </div>
            <div className="border-2 border-gray-200 rounded-xl p-5 sm:p-6 hover:shadow-lg hover:border-emerald-300 transition-all cursor-pointer">
              <div className="text-4xl sm:text-5xl mb-3">🧘</div>
              <h3 className="font-semibold text-gray-900 mb-2 text-base sm:text-lg">
                Mindfulness
              </h3>
              <p className="text-xs sm:text-sm text-gray-600">Reduce stress</p>
            </div>
            <div className="border-2 border-gray-200 rounded-xl p-5 sm:p-6 hover:shadow-lg hover:border-emerald-300 transition-all cursor-pointer">
              <div className="text-4xl sm:text-5xl mb-3">🎨</div>
              <h3 className="font-semibold text-gray-900 mb-2 text-base sm:text-lg">
                Creative Mode
              </h3>
              <p className="text-xs sm:text-sm text-gray-600">
                Express yourself
              </p>
            </div>
          </div>
        </div>

        {/* Monthly Report Preview */}
        <div className="bg-white rounded-xl shadow-md p-5 sm:p-6 lg:p-8">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">
            📈 Monthly Wellness Report
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 lg:gap-10">
            <div className="border-l-4 border-green-500 pl-4 sm:pl-6">
              <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-base sm:text-lg">
                Positive Highlights
              </h3>
              <ul className="space-y-2.5 sm:space-y-3 text-sm sm:text-base text-gray-600">
                <li>✓ Consistent mood improvement over 3 weeks</li>
                <li>✓ Decreased anxiety levels</li>
                <li>✓ Regular engagement with wellness activities</li>
                <li>✓ Good sleep pattern maintained</li>
              </ul>
            </div>
            <div className="border-l-4 border-yellow-500 pl-4 sm:pl-6">
              <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-base sm:text-lg">
                Areas to Focus On
              </h3>
              <ul className="space-y-2.5 sm:space-y-3 text-sm sm:text-base text-gray-600">
                <li>• Consider more social interactions</li>
                <li>• Try relaxation exercises before exams</li>
                <li>• Maintain regular exercise routine</li>
                <li>• Set aside time for hobbies</li>
              </ul>
            </div>
          </div>
          <button className="mt-6 sm:mt-8 w-full py-3.5 sm:py-4 bg-linear-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-semibold hover:shadow-xl transition-all text-sm sm:text-base">
            Download Full Monthly Report
          </button>
        </div>
      </main>
    </div>
  );
}
