"use client";

import { useEffect, useRef, useState } from "react";
import Chart from "chart.js/auto";

/* ================= TYPES ================= */

type RecordType = {
  student: string;
  week: number;
  topic: string;
  score: number;
};

type Category = "strong" | "average" | "weak";

/* ================= COMPONENT ================= */

export default function TeacherDashboard() {
    /* ================= DUMMY DATA ================= */

const dummyRecords: RecordType[] = [
  { student: "Aarav", week: 1, topic: "OOP", score: 78 },
  { student: "Aarav", week: 2, topic: "Inheritance", score: 82 },
  { student: "Aarav", week: 3, topic: "Polymorphism", score: 85 },

  { student: "Diya", week: 1, topic: "OOP", score: 65 },
  { student: "Diya", week: 2, topic: "Inheritance", score: 70 },
  { student: "Diya", week: 3, topic: "Polymorphism", score: 68 },

  { student: "Kabir", week: 1, topic: "OOP", score: 45 },
  { student: "Kabir", week: 2, topic: "Inheritance", score: 52 },
  { student: "Kabir", week: 3, topic: "Polymorphism", score: 48 },

  { student: "Riya", week: 1, topic: "OOP", score: 88 },
  { student: "Riya", week: 2, topic: "Inheritance", score: 90 },
  { student: "Riya", week: 3, topic: "Polymorphism", score: 92 },

  { student: "Mohit", week: 1, topic: "OOP", score: 72 },
  { student: "Mohit", week: 2, topic: "Inheritance", score: 75 },
  { student: "Mohit", week: 3, topic: "Polymorphism", score: 78 },
];
/* ================= LOAD DUMMY DATA ================= */

useEffect(() => {
  if (records.length === 0) {
    setRecords(dummyRecords);
  }
}, []);

  /* ---------------- State ---------------- */

  const [records, setRecords] = useState<RecordType[]>([]);
  const [categories, setCategories] = useState<Record<string, Category>>({});

  const topicChartRef = useRef<HTMLCanvasElement | null>(null);
  const trendChartRef = useRef<HTMLCanvasElement | null>(null);
  const distChartRef = useRef<HTMLCanvasElement | null>(null);

  const topicChart = useRef<Chart | null>(null);
  const trendChart = useRef<Chart | null>(null);
  const distChart = useRef<Chart | null>(null);
  /* ================= STUDENT GROUPING ================= */

function getStudentsByCategory() {
  const result: Record<Category, string[]> = {
    strong: [],
    average: [],
    weak: [],
  };

  Object.entries(categories).forEach(([name, cat]) => {
    result[cat].push(name);
  });

  return result;
}

const grouped = getStudentsByCategory();


  /* ================= CSV ================= */

  function handleCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      parseCSV(reader.result as string);
    };

    reader.readAsText(file);
  }

  function parseCSV(csv: string) {
    const lines = csv.trim().split("\n");

    const headers = lines[0]
      .toLowerCase()
      .split(",")
      .map((h) => h.trim());

    const s = headers.indexOf("student");
    const w = headers.indexOf("week");
    const t = headers.indexOf("topic");
    const sc = headers.indexOf("score");

    if (s === -1 || w === -1 || t === -1 || sc === -1) {
      alert("CSV Format Error");
      return;
    }

    const data: RecordType[] = [];

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i]) continue;

      const p = lines[i].split(",");

      data.push({
        student: p[s],
        week: Number(p[w]),
        topic: p[t],
        score: Number(p[sc]),
      });
    }

    setRecords(data);
  }

  /* ================= ANALYTICS ================= */

  useEffect(() => {
    if (!records.length) return;

    categorizeStudents();
    renderCharts();
  }, [records]);

  function categorizeStudents() {
    const map: any = {};

    records.forEach((r) => {
      if (!map[r.student]) map[r.student] = [];
      map[r.student].push(r.score);
    });

    const result: any = {};

    Object.keys(map).forEach((s) => {
      const avg =
        map[s].reduce((a: number, b: number) => a + b, 0) /
        map[s].length;

      if (avg >= 75) result[s] = "strong";
      else if (avg >= 50) result[s] = "average";
      else result[s] = "weak";
    });

    setCategories(result);
  }

  function getTopicAvg() {
    const map: any = {};

    records.forEach((r) => {
      if (!map[r.topic]) map[r.topic] = [];
      map[r.topic].push(r.score);
    });

    return Object.keys(map).map((t) => ({
      topic: t,
      avg:
        map[t].reduce((a: number, b: number) => a + b, 0) /
        map[t].length,
    }));
  }

  function getWeeklyAvg() {
    const map: any = {};

    records.forEach((r) => {
      if (!map[r.week]) map[r.week] = [];
      map[r.week].push(r.score);
    });

    return Object.keys(map)
      .sort()
      .map((w) => ({
        week: w,
        avg:
          map[w].reduce((a: number, b: number) => a + b, 0) /
          map[w].length,
      }));
  }

  /* ================= CHARTS ================= */

  function renderCharts() {
    renderTopic();
    renderTrend();
    renderDistribution();
  }

  function destroy(chart: any) {
    if (chart) chart.destroy();
  }

  function renderTopic() {
    const data = getTopicAvg();

    if (!topicChartRef.current) return;

    destroy(topicChart.current);

    topicChart.current = new Chart(topicChartRef.current, {
      type: "bar",
      data: {
        labels: data.map((d) => d.topic),
        datasets: [
          {
            label: "Avg Score",
            data: data.map((d) => d.avg),
            backgroundColor: "rgba(16,185,129,0.8)",
            borderRadius: 8,
          },
        ],
      },
      options: { responsive: true, scales: { y: { max: 100 } } },
    });
  }

  function renderTrend() {
    const data = getWeeklyAvg();

    if (!trendChartRef.current) return;

    destroy(trendChart.current);

    trendChart.current = new Chart(trendChartRef.current, {
      type: "line",
      data: {
        labels: data.map((d) => `Week ${d.week}`),
        datasets: [
          {
            label: "Weekly Avg",
            data: data.map((d) => d.avg),
            borderColor: "#10b981",
            backgroundColor: "rgba(16,185,129,.15)",
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: { responsive: true, scales: { y: { max: 100 } } },
    });
  }

  function renderDistribution() {
    if (!distChartRef.current) return;

    destroy(distChart.current);

    let strong = 0,
      avg = 0,
      weak = 0;

    Object.values(categories).forEach((c) => {
      if (c === "strong") strong++;
      if (c === "average") avg++;
      if (c === "weak") weak++;
    });

    distChart.current = new Chart(distChartRef.current, {
      type: "doughnut",
      data: {
        labels: ["Strong", "Average", "Weak"],
        datasets: [
          {
            data: [strong, avg, weak],
            backgroundColor: ["#10b981", "#f59e0b", "#ef4444"],
          },
        ],
      },
    });
  }

  /* ================= METRICS ================= */

  const students = new Set(records.map((r) => r.student)).size;
  const topics = new Set(records.map((r) => r.topic)).size;

  const avgScore = records.length
    ? Math.round(
        records.reduce((a, b) => a + b.score, 0) / records.length
      )
    : 0;
    const [teacherName, setTeacherName] = useState("Teacher");

    useEffect(() => {
  const name = localStorage.getItem("teacherName");

  if (name) {
    setTeacherName(name);
  }
}, []);


  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-gray-50">

      <main className="max-w-7xl mx-auto p-6 space-y-10">

        {/* HEADER */}

        <section className="bg-gradient-to-r from-emerald-500 to-green-600 text-white p-10 rounded-2xl shadow-xl">

          <h1 className="text-3xl font-bold">
  Welcome, {teacherName} 👩‍🏫
</h1>

          <p className="mt-2 opacity-90">
            Java Performance Analytics
          </p>

          <label className="inline-block mt-6 bg-white text-emerald-600 px-6 py-2 rounded-xl font-semibold cursor-pointer hover:scale-105 transition">

            Upload CSV

            <input
              hidden
              type="file"
              accept=".csv"
              onChange={handleCSV}
            />

          </label>

        </section>

        {/* METRICS */}

        <section className="grid grid-cols-2 md:grid-cols-4 gap-6">

          <Metric title="Students" value={students} />
          <Metric title="Topics" value={topics} />
          <Metric title="Average" value={`${avgScore}%`} />
          <Metric title="Records" value={records.length} />

        </section>

        {/* CHARTS */}

        <section className="grid md:grid-cols-2 gap-6">

          <ChartCard title="Topic Performance">
            <canvas ref={topicChartRef} />
          </ChartCard>

          <ChartCard title="Weekly Trend">
            <canvas ref={trendChartRef} />
          </ChartCard>

          <ChartCard title="Student Distribution">

  <canvas ref={distChartRef} />

  {/* Student Lists */}
  <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">

    {/* Strong */}
    <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
      <h4 className="font-semibold text-emerald-600 mb-2">
        Strong 💪
      </h4>

      {grouped.strong.length ? (
        grouped.strong.map((s) => (
          <p key={s}>• {s}</p>
        ))
      ) : (
        <p className="text-gray-400">None</p>
      )}
    </div>

    {/* Average */}
    <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
      <h4 className="font-semibold text-yellow-600 mb-2">
        Average 🙂
      </h4>

      {grouped.average.length ? (
        grouped.average.map((s) => (
          <p key={s}>• {s}</p>
        ))
      ) : (
        <p className="text-gray-400">None</p>
      )}
    </div>

    {/* Weak */}
    <div className="bg-red-50 p-3 rounded-lg border border-red-200">
      <h4 className="font-semibold text-red-600 mb-2">
        Weak ⚠️
      </h4>

      {grouped.weak.length ? (
        grouped.weak.map((s) => (
          <p key={s}>• {s}</p>
        ))
      ) : (
        <p className="text-gray-400">None</p>
      )}
    </div>

  </div>

</ChartCard>


        </section>

        {!records.length && (

          <div className="text-center text-gray-400 py-20">

            Upload CSV to begin 📊

          </div>

        )}

      </main>
    </div>
  );
}

/* ================= UI COMPONENTS ================= */

function Metric({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) {
  return (
    <div className="bg-white p-5 rounded-xl shadow border text-center">

      <p className="text-sm text-gray-500">
        {title}
      </p>

      <p className="text-2xl font-bold text-emerald-600 mt-1">
        {value}
      </p>

    </div>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white p-6 rounded-xl shadow border">

      <h3 className="font-bold mb-4">
        {title}
      </h3>

      {children}

    </div>
  );
}
