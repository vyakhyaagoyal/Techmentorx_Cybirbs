"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Chart from "chart.js/auto";

export default function Home() {
  const router = useRouter();

  const [userName, setUserName] = useState("");
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<Chart | null>(null);

  /* ============================
     Dummy Weekly Data (Demo)
  ============================ */
  const weeklyData = [
    72, 76, 80, 84, 88
  ];

  /* ============================
     Auth + User Check
  ============================ */
  useEffect(() => {
  const user = localStorage.getItem("user");

  if (!user) {
    router.replace("/login");
    return;
  }

  const parsed = JSON.parse(user);

  // ✅ Student → stay here
  if (parsed.role === "student") {
    setUserName(parsed.name);
    setAuthorized(true);
    return;
  }

  // ✅ Teacher → go to teacher dashboard
  if (parsed.role === "teacher") {
    router.replace("/teacher-dashboard");
    return;
  }

  // ❌ Others → login
  router.replace("/login");

}, [router]);

  /* ============================
     Render Chart
  ============================ */
  useEffect(() => {
    if (!authorized || !chartRef.current) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    chartInstance.current = new Chart(chartRef.current, {
      type: "line",

      data: {
        labels: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"],

        datasets: [
          {
            label: "Weekly Performance",

            data: weeklyData,

            borderColor: "#6366f1",
            backgroundColor: "rgba(99,102,241,0.15)",

            borderWidth: 3,
            fill: true,
            tension: 0.4,

            pointRadius: 6,
            pointBackgroundColor: "#6366f1",
          },
        ],
      },

      options: {
        responsive: true,

        plugins: {
          legend: {
            display: true,
          },
        },

        scales: {
          y: {
            min: 50,
            max: 100,
          },
        },
      },
    });
  }, [authorized]);

  /* ============================
     Prevent UI Flash
  ============================ */
  if (authorized === null) return null;
  if (!authorized) return null;

  /* ============================
     UI
  ============================ */

  /* ============================
   UI
============================ */

return (
  <div className="min-h-screen w-full flex justify-center bg-gray-50">

    <main className="w-full max-w-7xl py-8 px-4 flex flex-col gap-12">

      {/* Welcome */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Welcome back, {userName}! 🌿
        </h1>

        <p className="mt-2 text-gray-600">
          Here's your learning dashboard
        </p>
      </div>

      {/* Weekly Chart */}
      <section className="bg-white p-6 rounded-xl shadow border">

        <h3 className="text-xl font-bold mb-4">
          📈 Weekly Progress Trend
        </h3>

        <canvas ref={chartRef}></canvas>

      </section>

      {/* Quick Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-5">

        <Stat title="Overall Position" value="Top 25%" color="emerald" />
        <Stat title="Pending Quizzes" value="2" color="amber" />
        <Stat title="Topics to Review" value="4" color="teal" />
        <Stat title="Attendance" value="87%" color="green" />

      </section>

      {/* Main Features */}
      <section className="grid md:grid-cols-2 gap-6">

        <Link href="/quiz">
          <Feature
            title="📝 Current Quiz"
            desc="Today's OS quiz"
            color="from-teal-500 to-emerald-600"
          />
        </Link>

        <Link href="/vent-out">
          <Feature
            title="💭 Wellness Corner"
            desc="Mental health support"
            color="from-green-500 to-lime-600"
          />
        </Link>

      </section>

      {/* Secondary Features */}
      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">

        <Link href="/analytics">
          <MiniCard
            title="📊 Analytics"
            desc="View your performance"
          />
        </Link>

        <Link href="/engagement">
          <MiniCard
            title="👀 Engagement Tracking"
            desc="Track participation"
          />
        </Link>

        <MiniCard
          title="🎯 Study Resources"
          desc="Access learning materials"
        />

      </section>

    </main>
  </div>
);
}

/* ============================
   Components
============================ */
function Stat({
  title,
  value,
  color,
}: {
  title: string;
  value: string;
  color: "emerald" | "amber" | "teal" | "green";
}) {
  const colors = {
    emerald: "text-emerald-600",
    amber: "text-amber-600",
    teal: "text-teal-600",
    green: "text-green-600",
  };

  return (
    <div className="bg-white p-5 rounded-xl shadow border">

      <div className="text-sm text-gray-500">
        {title}
      </div>

      <div
        className={`text-2xl font-bold mt-2 ${colors[color]}`}
      >
        {value}
      </div>

    </div>
  );
}


function Feature({
  title,
  desc,
  color,
}: {
  title: string;
  desc: string;
  color: string;
}) {
  return (
    <div
      className={`bg-linear-to-br ${color} rounded-xl shadow-lg p-6 text-white hover:scale-[1.02] transition cursor-pointer`}
    >
      <h3 className="text-xl font-bold mb-2">
        {title}
      </h3>

      <p className="opacity-90">
        {desc}
      </p>
    </div>
  );
}


function MiniCard({
  title,
  desc,
}: {
  title: string;
  desc: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border hover:shadow-md transition cursor-pointer h-full">

      <h3 className="font-semibold text-gray-900 mb-2">
        {title}
      </h3>

      <p className="text-sm text-gray-600">
        {desc}
      </p>

    </div>
  );
}