"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API = "http://localhost:5000";

interface Subject {
  _id: string;
  name: string;
  code: string;
}

interface GeneratedQuiz {
  _id: string;
  title: string;
  questionsCount: number;
  duration: number;
  startsAt: string;
  endsAt: string;
  subjectId: string;
}

export default function GenerateQuizPage() {
  const router = useRouter();

  // ── auth guard ────────────────────────────────────
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (!role) {
      router.replace("/login");
      return;
    }
    if (role === "teacher") {
      setAuthorized(true);
    } else {
      router.replace("/");
    }
  }, [router]);

  // ── state ─────────────────────────────────────────
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectId, setSubjectId] = useState("");
  const [title, setTitle] = useState("");
  const [topicsInput, setTopicsInput] = useState("");
  const [numQuestions, setNumQuestions] = useState(10);
  const [duration, setDuration] = useState(20);
  const [file, setFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    quiz: GeneratedQuiz;
    lecture: { _id: string; title: string };
  } | null>(null);

  // ── fetch teacher's subjects ──────────────────────
  useEffect(() => {
    if (!authorized) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    fetch(`${API}/teacher/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.subjects) {
          setSubjects(data.subjects);
          if (data.subjects.length > 0) {
            setSubjectId(data.subjects[0]._id);
          }
        }
      })
      .catch(() => {});
  }, [authorized]);

  // ── submit ────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setResult(null);

    if (!file) {
      setError("Please select a lecture file");
      return;
    }

    const topics = topicsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    if (topics.length === 0) {
      setError("Enter at least one topic (comma-separated)");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("subjectId", subjectId);
      formData.append("title", title);
      formData.append("topicsCovered", JSON.stringify(topics));
      formData.append("numQuestions", String(numQuestions));
      formData.append("duration", String(duration));

      const res = await fetch(`${API}/generate-quiz`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to generate quiz");
      }

      setResult({ quiz: data.quiz, lecture: data.lecture });
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  // ── guards ────────────────────────────────────────
  if (authorized === null) return null;
  if (!authorized) return null;

  // ── success screen ────────────────────────────────
  if (result) {
    return (
      <div className="min-h-screen">
        <main className="max-w-3xl mx-auto py-10 px-4">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">🎉</div>

            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Quiz Generated!
            </h1>
            <p className="text-gray-600 mb-8">
              The quiz has been created and assigned to all students enrolled in
              this subject.
            </p>

            {/* quiz details */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 mb-8 text-left">
              <h2 className="font-bold text-emerald-800 mb-4 text-lg">
                Quiz Details
              </h2>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Title</span>
                  <p className="font-semibold">{result.quiz.title}</p>
                </div>
                <div>
                  <span className="text-gray-500">Questions</span>
                  <p className="font-semibold">{result.quiz.questionsCount}</p>
                </div>
                <div>
                  <span className="text-gray-500">Duration</span>
                  <p className="font-semibold">
                    {result.quiz.duration} minutes
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Available Until</span>
                  <p className="font-semibold">
                    {new Date(result.quiz.endsAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setResult(null);
                  setFile(null);
                  setTitle("");
                  setTopicsInput("");
                }}
                className="flex-1 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition"
              >
                Create Another Quiz
              </button>
              <button
                onClick={() => router.push("/engagement")}
                className="flex-1 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── form ──────────────────────────────────────────
  return (
    <div className="min-h-screen">
      <main className="max-w-3xl mx-auto py-10 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            📝 Generate Quiz with AI
          </h1>
          <p className="mt-2 text-gray-600">
            Upload a lecture file (PPT, PDF, DOCX) and Gemini AI will generate a
            quiz for your students automatically.
          </p>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-8">
          <h2 className="font-bold text-blue-900 mb-2">✨ How it works</h2>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>
              1. Upload your lecture file — it is <strong>not stored</strong>,
              only analyzed by AI.
            </li>
            <li>2. Enter the topics covered in the lecture.</li>
            <li>3. AI generates MCQ questions based on the file content.</li>
            <li>
              4. The quiz is pushed to <strong>all students</strong> enrolled in
              the selected subject.
            </li>
          </ul>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-lg p-6 sm:p-8 space-y-6"
        >
          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject
            </label>
            {subjects.length > 0 ? (
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
              >
                {subjects.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-gray-500 italic">
                No subjects found.{" "}
                <span className="text-emerald-600">
                  Create a subject first in the teacher dashboard.
                </span>
              </p>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lecture / Quiz Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Binary Search Trees – Insertion & Deletion"
              className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lecture File
            </label>
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition cursor-pointer ${
                file
                  ? "border-emerald-400 bg-emerald-50"
                  : "border-gray-300 hover:border-emerald-400 hover:bg-emerald-50/50"
              }`}
              onClick={() => document.getElementById("fileInput")?.click()}
            >
              <input
                id="fileInput"
                type="file"
                accept=".ppt,.pptx,.pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />

              {file ? (
                <div>
                  <div className="text-4xl mb-2">📄</div>
                  <p className="font-semibold text-emerald-700">{file.name}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <p className="text-xs text-emerald-600 mt-2">
                    Click to change file
                  </p>
                </div>
              ) : (
                <div>
                  <div className="text-4xl mb-2">📁</div>
                  <p className="font-semibold text-gray-700">
                    Click to upload a lecture file
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    PPT, PPTX, PDF, DOC, DOCX, TXT, PNG, JPG — max 50 MB
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Topics */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Topics Covered{" "}
              <span className="text-gray-400 font-normal">
                (comma-separated)
              </span>
            </label>
            <input
              type="text"
              required
              value={topicsInput}
              onChange={(e) => setTopicsInput(e.target.value)}
              placeholder="e.g. Binary Search, Divide and Conquer, Time Complexity"
              className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          {/* Number of Questions + Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of Questions
              </label>
              <input
                type="number"
                min={3}
                max={30}
                value={numQuestions}
                onChange={(e) =>
                  setNumQuestions(parseInt(e.target.value) || 10)
                }
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quiz Duration (minutes)
              </label>
              <input
                type="number"
                min={5}
                max={120}
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 20)}
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || subjects.length === 0}
            className="w-full py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Generating Quiz with AI…
              </>
            ) : (
              "Generate Quiz & Push to Students"
            )}
          </button>
        </form>
      </main>
    </div>
  );
}
