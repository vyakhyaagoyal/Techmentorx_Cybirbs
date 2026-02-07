"use client";

import { useEffect, useState } from "react";

const API = "http://localhost:5000";

/* ─── Shared Types ─── */
interface SubjectPerf {
  subjectId: string;
  subjectName: string;
  averageScore: number;
  quizzesTaken: number;
}

interface StudentDashboard {
  student: { name: string; department: string; semester: number };
  performance: {
    overallAverage: number;
    totalQuizzesTaken: number;
    subjectPerformance: SubjectPerf[];
  };
  pendingStudyTopics: {
    _id: string;
    topic: string;
    subject: { name: string };
    status: string;
  }[];
}

interface StandingData {
  department: string;
  overall: { percentileBehind: number; message: string };
  subjectWise: {
    subjectName: string;
    subjectCode: string;
    percentileBehind: number;
    message: string;
  }[];
}

interface GraphSubject {
  subjectId: string;
  subjectName: string;
  dataPoints: { date: string; score: number }[];
}

/* ── Teacher types ── */
interface TeacherOverview {
  overview: {
    totalSubjects: number;
    totalStudents: number;
    totalQuizSubmissions: number;
    overallAverageScore: number;
  };
  subjectStats: {
    subjectId: string;
    subjectName: string;
    subjectCode: string;
    totalStudents: number;
    totalQuizResults: number;
    averageScore: number;
    highestScore: number;
    lowestScore: number;
    weakTopics: { topic: string; failCount: number }[];
  }[];
  recentResults: {
    student: { name: string; enrollmentId: string };
    quiz: string;
    subject: string;
    score: number;
    weakTopics: string[];
    submittedAt: string;
  }[];
}

interface SubjectDetail {
  subject: { _id: string; name: string; code: string; totalEnrolled: number };
  classAverage: number;
  studentPerformance: {
    studentId: string;
    name: string;
    enrollmentId: string;
    quizzesTaken: number;
    averageScore: number;
    highestScore: number;
    lowestScore: number;
    trend: string;
    weakTopics: { topic: string; count: number }[];
  }[];
  quizzes: {
    _id: string;
    title: string;
    submissions: number;
    averageScore: number;
  }[];
  classWeakTopics: {
    topic: string;
    studentsStruggling: number;
    percentageStruggling: number;
  }[];
}

/* ────────────────────────────────── helpers ── */
function headers() {
  const t = localStorage.getItem("token");
  return {
    Authorization: `Bearer ${t}`,
    "Content-Type": "application/json",
  };
}

const COLORS = [
  "bg-blue-500",
  "bg-green-500",
  "bg-yellow-500",
  "bg-purple-500",
  "bg-indigo-500",
  "bg-pink-500",
  "bg-cyan-500",
];

/* ────────────────────────────── STUDENT VIEW ── */
function StudentAnalytics() {
  const [dashboard, setDashboard] = useState<StudentDashboard | null>(null);
  const [standing, setStanding] = useState<StandingData | null>(null);
  const [graphData, setGraphData] = useState<GraphSubject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [dRes, sRes, gRes] = await Promise.all([
          fetch(`${API}/dashboard`, { headers: headers() }),
          fetch(`${API}/dashboard/standing`, { headers: headers() }),
          fetch(`${API}/dashboard/graph`, { headers: headers() }),
        ]);
        if (dRes.ok) setDashboard(await dRes.json());
        if (sRes.ok) setStanding(await sRes.json());
        if (gRes.ok) {
          const g = await gRes.json();
          setGraphData(g.subjects);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <Loader />;

  const perf = dashboard?.performance;

  return (
    <>
      {/* Overall Performance Card */}
      <div className="bg-linear-to-br from-emerald-600 to-teal-600 rounded-xl shadow-lg p-6 sm:p-8 mb-8 text-white">
        <h2 className="text-xl sm:text-2xl font-bold mb-6">
          Overall Performance Summary
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <div className="p-4 bg-white/10 rounded-lg">
            <div className="text-sm opacity-90 mb-2">Your Position</div>
            <div className="text-3xl sm:text-4xl font-bold">
              {standing
                ? `Top ${100 - standing.overall.percentileBehind}%`
                : "—"}
            </div>
            <div className="text-xs sm:text-sm mt-2 opacity-90">
              {standing?.overall.message ?? "No data available yet"}
            </div>
          </div>
          <div className="p-4 bg-white/10 rounded-lg">
            <div className="text-sm opacity-90 mb-2">Average Score</div>
            <div className="text-3xl sm:text-4xl font-bold">
              {perf ? `${perf.overallAverage}%` : "—"}
            </div>
            <div className="text-xs sm:text-sm mt-2 opacity-90">
              {perf
                ? `Across ${perf.totalQuizzesTaken} quizzes`
                : "Take quizzes to see data"}
            </div>
          </div>
          <div className="p-4 bg-white/10 rounded-lg sm:col-span-2 md:col-span-1">
            <div className="text-sm opacity-90 mb-2">Subjects Enrolled</div>
            <div className="text-3xl sm:text-4xl font-bold">
              {perf?.subjectPerformance.length ?? 0}
            </div>
            <div className="text-xs sm:text-sm mt-2 opacity-90">
              {dashboard?.student.department ?? ""} — Sem{" "}
              {dashboard?.student.semester ?? ""}
            </div>
          </div>
        </div>
      </div>

      {/* Insights & Study Topics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6">
        {standing && standing.subjectWise.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-bold text-blue-900 mb-4">
              Key Insights
            </h3>
            <ul className="space-y-3 text-xs sm:text-sm text-blue-800">
              {standing.subjectWise
                .sort((a, b) => b.percentileBehind - a.percentileBehind)
                .slice(0, 4)
                .map((s, i) => (
                  <li key={i} className="flex items-start">
                    <span className="mr-2 shrink-0">•</span>
                    <span>{s.message}</span>
                  </li>
                ))}
            </ul>
          </div>
        )}

        {dashboard && dashboard.pendingStudyTopics.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-bold text-green-900 mb-4">
              Pending Study Topics
            </h3>
            <ul className="space-y-3 text-xs sm:text-sm text-green-800">
              {dashboard.pendingStudyTopics.slice(0, 5).map((t) => (
                <li key={t._id} className="flex items-start">
                  <span className="mr-2 shrink-0">•</span>
                  <span>
                    <strong>{t.topic}</strong> — {t.subject.name} ({t.status})
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Subject-wise Performance */}
      {perf && perf.subjectPerformance.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">
            Subject-wise Performance
          </h2>
          <div className="space-y-4 sm:space-y-6">
            {perf.subjectPerformance.map((sub, idx) => {
              const subStanding = standing?.subjectWise.find(
                (s) =>
                  s.subjectName === sub.subjectName ||
                  s.subjectCode === sub.subjectName,
              );
              return (
                <div
                  key={sub.subjectId}
                  className="border-b border-gray-200 pb-4 sm:pb-6 last:border-b-0 last:pb-0"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                        {sub.subjectName}
                      </h3>
                      {subStanding && (
                        <p className="text-xs sm:text-sm text-gray-600 mt-1">
                          You are behind{" "}
                          <span className="font-semibold text-red-600">
                            {subStanding.percentileBehind}%
                          </span>{" "}
                          of students
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-xl sm:text-2xl font-bold text-gray-900">
                          {Math.round(sub.averageScore)}%
                        </div>
                        <div className="text-xs sm:text-sm text-gray-500">
                          {sub.quizzesTaken} quiz
                          {sub.quizzesTaken !== 1 ? "zes" : ""}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="overflow-hidden h-2 sm:h-3 rounded-full bg-gray-200">
                    <div
                      style={{ width: `${Math.min(sub.averageScore, 100)}%` }}
                      className={`h-full rounded-full transition-all duration-500 ${COLORS[idx % COLORS.length]}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Score Over Time */}
      {graphData.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">
            Score Progression
          </h2>
          {graphData.map((subj) => (
            <div key={subj.subjectId} className="mb-6 last:mb-0">
              <h3 className="font-semibold text-gray-700 mb-3">
                {subj.subjectName}
              </h3>
              <div className="flex items-end gap-2 h-32">
                {subj.dataPoints.map((dp, i) => (
                  <div
                    key={i}
                    className="flex-1 flex flex-col items-center justify-end"
                  >
                    <span className="text-xs font-semibold text-gray-700 mb-1">
                      {Math.round(dp.score)}%
                    </span>
                    <div
                      className="w-full bg-linear-to-t from-emerald-500 to-emerald-400 rounded-t"
                      style={{ height: `${dp.score}%` }}
                    />
                    <span className="text-[10px] text-gray-500 mt-1">
                      {new Date(dp.date).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No data fallback */}
      {perf && perf.totalQuizzesTaken === 0 && (
        <div className="bg-white rounded-xl shadow-md p-8 text-center text-gray-500">
          <div className="text-4xl mb-3">📝</div>
          <p className="text-lg font-medium">No quiz data yet</p>
          <p className="text-sm mt-1">
            Take quizzes to see your analytics here.
          </p>
        </div>
      )}
    </>
  );
}

/* ────────────────────────────── TEACHER VIEW ── */
function TeacherAnalytics() {
  const [overview, setOverview] = useState<TeacherOverview | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(
    null,
  );
  const [subjectDetail, setSubjectDetail] = useState<SubjectDetail | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetch(`${API}/teacher/analytics/overview`, { headers: headers() })
      .then((r) => (r.ok ? r.json() : null))
      .then(setOverview)
      .finally(() => setLoading(false));
  }, []);

  const loadSubject = async (id: string) => {
    setSelectedSubjectId(id);
    setDetailLoading(true);
    try {
      const r = await fetch(`${API}/teacher/analytics/subjects/${id}`, {
        headers: headers(),
      });
      if (r.ok) setSubjectDetail(await r.json());
    } finally {
      setDetailLoading(false);
    }
  };

  if (loading) return <Loader />;

  const o = overview?.overview;

  return (
    <>
      {/* Overview cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Subjects", value: o?.totalSubjects ?? 0 },
          { label: "Students", value: o?.totalStudents ?? 0 },
          { label: "Submissions", value: o?.totalQuizSubmissions ?? 0 },
          {
            label: "Avg Score",
            value: o ? `${o.overallAverageScore}%` : "—",
          },
        ].map((c) => (
          <div
            key={c.label}
            className="bg-white rounded-xl shadow-md p-5 text-center"
          >
            <div className="text-sm text-gray-500">{c.label}</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              {c.value}
            </div>
          </div>
        ))}
      </div>

      {/* Subject selector cards */}
      {overview && overview.subjectStats.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Subject Analytics
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {overview.subjectStats.map((s) => (
              <button
                key={s.subjectId}
                onClick={() => loadSubject(s.subjectId)}
                className={`text-left border rounded-xl p-4 transition-all hover:shadow-md ${
                  selectedSubjectId === s.subjectId
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-gray-200"
                }`}
              >
                <div className="font-semibold text-gray-900">
                  {s.subjectName}
                </div>
                <div className="text-xs text-gray-500 mb-2">
                  {s.subjectCode}
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {s.totalStudents} students
                  </span>
                  <span className="font-semibold text-emerald-700">
                    Avg {s.averageScore}%
                  </span>
                </div>
                {s.weakTopics.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {s.weakTopics.slice(0, 3).map((t) => (
                      <span
                        key={t.topic}
                        className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full"
                      >
                        {t.topic}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Subject detail panel */}
      {detailLoading && <Loader />}
      {subjectDetail && !detailLoading && (
        <SubjectDetailPanel data={subjectDetail} />
      )}

      {/* Recent results */}
      {overview && overview.recentResults.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Recent Submissions
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2">Student</th>
                  <th className="pb-2">Quiz</th>
                  <th className="pb-2">Subject</th>
                  <th className="pb-2">Score</th>
                  <th className="pb-2">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {overview.recentResults.map((r, i) => (
                  <tr key={i} className="border-b last:border-b-0">
                    <td className="py-2 font-medium text-gray-900">
                      {r.student.name}
                    </td>
                    <td className="py-2 text-gray-700">{r.quiz}</td>
                    <td className="py-2 text-gray-600">{r.subject}</td>
                    <td className="py-2">
                      <span
                        className={`font-semibold ${
                          r.score >= 60 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {r.score}%
                      </span>
                    </td>
                    <td className="py-2 text-gray-500 text-xs">
                      {new Date(r.submittedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state */}
      {overview && overview.subjectStats.length === 0 && (
        <div className="bg-white rounded-xl shadow-md p-8 text-center text-gray-500">
          <div className="text-4xl mb-3">📊</div>
          <p className="text-lg font-medium">No analytics yet</p>
          <p className="text-sm mt-1">
            Create subjects and quizzes to see student analytics.
          </p>
        </div>
      )}
    </>
  );
}

/* ────── Subject Detail Sub-panel ────── */
function SubjectDetailPanel({ data }: { data: SubjectDetail }) {
  return (
    <div className="space-y-6 mb-8">
      {/* Header */}
      <div className="bg-linear-to-br from-emerald-600 to-teal-600 rounded-xl shadow-lg p-6 text-white">
        <h2 className="text-xl font-bold">{data.subject.name}</h2>
        <p className="text-emerald-100 text-sm">{data.subject.code}</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-sm opacity-90">Enrolled</div>
            <div className="text-2xl font-bold">
              {data.subject.totalEnrolled}
            </div>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-sm opacity-90">Class Average</div>
            <div className="text-2xl font-bold">{data.classAverage}%</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-sm opacity-90">Quizzes</div>
            <div className="text-2xl font-bold">{data.quizzes.length}</div>
          </div>
        </div>
      </div>

      {/* Class weak topics */}
      {data.classWeakTopics.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 sm:p-6">
          <h3 className="text-base font-bold text-red-900 mb-3">
            Topics Students Struggle With
          </h3>
          <div className="space-y-2">
            {data.classWeakTopics.slice(0, 8).map((t) => (
              <div key={t.topic} className="flex items-center justify-between">
                <span className="text-sm text-red-800">{t.topic}</span>
                <span className="text-xs bg-red-200 text-red-800 px-2 py-0.5 rounded-full">
                  {t.studentsStruggling} student
                  {t.studentsStruggling !== 1 ? "s" : ""} (
                  {t.percentageStruggling}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quiz breakdown */}
      {data.quizzes.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Quiz Performance
          </h3>
          <div className="space-y-3">
            {data.quizzes.map((q) => (
              <div
                key={q._id}
                className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-b-0"
              >
                <div>
                  <div className="font-medium text-gray-900 text-sm">
                    {q.title}
                  </div>
                  <div className="text-xs text-gray-500">
                    {q.submissions} submission
                    {q.submissions !== 1 ? "s" : ""}
                  </div>
                </div>
                <span
                  className={`text-sm font-semibold ${
                    q.averageScore >= 60 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  Avg {q.averageScore}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Student leaderboard */}
      {data.studentPerformance.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Student Performance
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2">#</th>
                  <th className="pb-2">Name</th>
                  <th className="pb-2">Enrollment</th>
                  <th className="pb-2">Quizzes</th>
                  <th className="pb-2">Avg</th>
                  <th className="pb-2">High</th>
                  <th className="pb-2">Low</th>
                  <th className="pb-2">Trend</th>
                  <th className="pb-2">Weak Topics</th>
                </tr>
              </thead>
              <tbody>
                {data.studentPerformance.map((s, i) => (
                  <tr key={s.studentId} className="border-b last:border-b-0">
                    <td className="py-2 text-gray-500">{i + 1}</td>
                    <td className="py-2 font-medium text-gray-900">{s.name}</td>
                    <td className="py-2 text-gray-600">
                      {s.enrollmentId || "—"}
                    </td>
                    <td className="py-2 text-gray-700">{s.quizzesTaken}</td>
                    <td className="py-2">
                      <span
                        className={`font-semibold ${
                          s.averageScore >= 60
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {s.averageScore}%
                      </span>
                    </td>
                    <td className="py-2 text-gray-700">{s.highestScore}%</td>
                    <td className="py-2 text-gray-700">{s.lowestScore}%</td>
                    <td className="py-2 text-lg">
                      {s.trend === "up" ? "↑" : s.trend === "down" ? "↓" : "→"}
                    </td>
                    <td className="py-2">
                      <div className="flex flex-wrap gap-1">
                        {s.weakTopics.slice(0, 2).map((t) => (
                          <span
                            key={t.topic}
                            className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full"
                          >
                            {t.topic}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ────── Loader ────── */
function Loader() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-200 border-t-emerald-600" />
    </div>
  );
}

/* ────────────────────────────── MAIN PAGE ── */
export default function Analytics() {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    setRole(localStorage.getItem("role"));
  }, []);

  return (
    <div className="min-h-screen w-full">
      <main className="w-full max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Performance Analytics
          </h1>
          <p className="mt-2 text-sm sm:text-base text-gray-600">
            {role === "teacher"
              ? "View student performance across your subjects and quizzes"
              : "Track your academic progress and identify areas for improvement"}
          </p>
        </div>

        {role === "teacher" ? <TeacherAnalytics /> : <StudentAnalytics />}
      </main>
    </div>
  );
}
