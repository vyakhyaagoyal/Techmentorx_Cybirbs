"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API = "http://localhost:5000";

interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
  topic: string;
}

interface QuizMeta {
  _id: string;
  title: string;
  subject: { _id: string; name: string; code: string } | string;
  questions: Question[];
  duration: number;
  isActive: boolean;
  startsAt: string;
  endsAt: string;
}

export default function QuizPage() {
  const router = useRouter();

  // ── auth ──────────────────────────────────────────
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const r = localStorage.getItem("role");
    if (!r) {
      router.replace("/login");
      return;
    }
    setRole(r);
  }, [router]);

  // ── quiz list state (students) ────────────────────
  const [pendingQuizzes, setPendingQuizzes] = useState<QuizMeta[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState("");

  // ── active-quiz state ─────────────────────────────
  const [activeQuiz, setActiveQuiz] = useState<QuizMeta | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // ── fetch pending quizzes (student) ───────────────
  useEffect(() => {
    if (role !== "student") return;

    const token = localStorage.getItem("token");
    if (!token) return;

    fetch(`${API}/quiz/pending`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.quizzes) {
          setPendingQuizzes(data.quizzes);
        }
      })
      .catch((e) => setListError(e.message))
      .finally(() => setListLoading(false));
  }, [role]);

  // ── countdown timer ───────────────────────────────
  useEffect(() => {
    if (!activeQuiz || quizCompleted) return;
    if (timeLeft <= 0) {
      finishQuiz();
      return;
    }
    const t = setInterval(() => setTimeLeft((p) => p - 1), 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, activeQuiz, quizCompleted]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec < 10 ? "0" : ""}${sec}`;
  };

  // ── start a quiz ──────────────────────────────────
  function startQuiz(quiz: QuizMeta) {
    setActiveQuiz(quiz);
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setAnswers(new Array(quiz.questions.length).fill(null));
    setQuizCompleted(false);
    setTimeLeft(quiz.duration * 60);
    setSubmitError("");
  }

  // ── select answer ─────────────────────────────────
  function handleSelect(idx: number) {
    setSelectedAnswer(idx);
  }

  // ── next / previous ───────────────────────────────
  function handleNext() {
    if (!activeQuiz) return;

    const updated = [...answers];
    updated[currentQuestion] = selectedAnswer;
    setAnswers(updated);

    if (currentQuestion < activeQuiz.questions.length - 1) {
      setCurrentQuestion((c) => c + 1);
      setSelectedAnswer(answers[currentQuestion + 1] ?? null);
    } else {
      finishQuiz(updated);
    }
  }

  function handlePrev() {
    if (currentQuestion > 0) {
      const updated = [...answers];
      updated[currentQuestion] = selectedAnswer;
      setAnswers(updated);
      setCurrentQuestion((c) => c - 1);
      setSelectedAnswer(answers[currentQuestion - 1] ?? null);
    }
  }

  // ── submit quiz ───────────────────────────────────
  async function finishQuiz(finalAnswers?: (number | null)[]) {
    if (!activeQuiz) return;

    const ans =
      finalAnswers ??
      (() => {
        const a = [...answers];
        a[currentQuestion] = selectedAnswer;
        return a;
      })();

    setAnswers(ans);
    setQuizCompleted(true);
    setSubmitting(true);

    try {
      const token = localStorage.getItem("token");

      const payload = activeQuiz.questions.map((_, i) => ({
        questionIndex: i,
        selectedAnswer: ans[i] ?? -1,
      }));

      const res = await fetch(`${API}/quiz/${activeQuiz._id}/submit`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ answers: payload }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || "Submission failed");
      }
    } catch (err: any) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  // ── scoring (local fallback) ──────────────────────
  function calcScore() {
    if (!activeQuiz) return 0;
    let correct = 0;
    answers.forEach((a, i) => {
      if (a === activeQuiz.questions[i].correctAnswer) correct++;
    });
    return Math.round((correct / activeQuiz.questions.length) * 100);
  }

  function wrongTopics() {
    if (!activeQuiz) return [];
    const topics: string[] = [];
    answers.forEach((a, i) => {
      if (a !== activeQuiz.questions[i].correctAnswer) {
        const t = activeQuiz.questions[i].topic;
        if (!topics.includes(t)) topics.push(t);
      }
    });
    return topics;
  }

  // ── guards ────────────────────────────────────────
  if (role === null) return null;

  // ── teachers see a redirect card ──────────────────
  if (role === "teacher") {
    return (
      <div className="min-h-screen">
        <main className="max-w-3xl mx-auto py-10 px-4">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="text-5xl mb-4">📝</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Quiz Management
            </h1>
            <p className="text-gray-600 mb-6">
              As a teacher, you can generate AI-powered quizzes from your
              lecture files.
            </p>
            <button
              onClick={() => router.push("/generate-quiz")}
              className="px-8 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition"
            >
              Generate a New Quiz →
            </button>
          </div>
        </main>
      </div>
    );
  }

  /* ===========================================
     QUIZ COMPLETED SCREEN
  =========================================== */
  if (activeQuiz && quizCompleted) {
    const score = calcScore();
    const weak = wrongTopics();
    const total = activeQuiz.questions.length;
    const correct = answers.filter(
      (a, i) => a === activeQuiz.questions[i].correctAnswer,
    ).length;

    return (
      <div className="min-h-screen">
        <main className="max-w-4xl mx-auto py-6 px-4">
          <div className="bg-white rounded-xl shadow-lg p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">
                {score >= 80 ? "🎉" : score >= 60 ? "👍" : "📚"}
              </div>
              <h1 className="text-3xl font-bold mb-2">Quiz Completed!</h1>
              <p className="text-gray-600">
                {submitting
                  ? "Submitting your answers…"
                  : submitError
                    ? `⚠️ ${submitError}`
                    : "Your answers have been submitted."}
              </p>
            </div>

            {/* Score */}
            <div className="bg-linear-to-br from-emerald-600 to-teal-600 rounded-xl p-6 text-white mb-8 text-center">
              <div className="text-5xl font-bold mb-2">{score}%</div>
              <div>Your Score</div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-green-50 p-4 rounded-xl text-center">
                <div className="text-2xl font-bold text-green-600">
                  {correct}
                </div>
                <div className="text-sm">Correct</div>
              </div>
              <div className="bg-red-50 p-4 rounded-xl text-center">
                <div className="text-2xl font-bold text-red-600">
                  {total - correct}
                </div>
                <div className="text-sm">Incorrect</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-xl text-center">
                <div className="text-2xl font-bold text-blue-600">{total}</div>
                <div className="text-sm">Total</div>
              </div>
            </div>

            {/* Weak Topics */}
            {weak.length > 0 && (
              <div className="bg-yellow-50 p-6 rounded-xl mb-6">
                <h2 className="font-bold mb-3">🎯 Topics To Revise</h2>
                <ul className="space-y-2">
                  {weak.map((t, i) => (
                    <li key={i}>• {t}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setActiveQuiz(null);
                  setQuizCompleted(false);
                }}
                className="flex-1 py-3 bg-gray-200 rounded-lg font-semibold"
              >
                Back to Quizzes
              </button>
              <button
                onClick={() => router.push("/")}
                className="flex-1 py-3 bg-emerald-600 text-white rounded-lg font-semibold"
              >
                Dashboard
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  /* ===========================================
     ACTIVE QUIZ SCREEN
  =========================================== */
  if (activeQuiz) {
    const q = activeQuiz.questions[currentQuestion];
    const subjectName =
      typeof activeQuiz.subject === "object" ? activeQuiz.subject.name : "Quiz";

    return (
      <div className="min-h-screen">
        <main className="max-w-4xl mx-auto py-6 px-4">
          {/* Info banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6">
            <h2 className="font-bold text-blue-900 mb-2">
              📘 Today&apos;s Learning Recap
            </h2>
            <p className="text-sm text-blue-800">
              Your teacher uploaded a lecture file and AI generated this quiz
              based on it. Let&apos;s check your understanding!
            </p>
          </div>

          {/* Header */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <div className="flex justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold">{subjectName}</h1>
                <p className="text-gray-600">{activeQuiz.title}</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-emerald-600">
                  {formatTime(timeLeft)}
                </div>
                <div className="text-sm">Time Remaining</div>
              </div>
            </div>
            <div className="text-sm text-gray-600 flex justify-between">
              <span>
                Question {currentQuestion + 1} / {activeQuiz.questions.length}
              </span>
              <span>{activeQuiz.duration} minutes</span>
            </div>
          </div>

          {/* Question Card */}
          <div className="bg-white shadow-lg rounded-xl p-8">
            <h2 className="text-xl font-semibold mb-6">{q.question}</h2>

            <div className="space-y-4">
              {q.options.map((opt, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelect(idx)}
                  className={`border-2 p-4 rounded-xl cursor-pointer transition ${
                    selectedAnswer === idx
                      ? "border-emerald-600 bg-emerald-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span className="font-medium text-gray-500 mr-3">
                    {String.fromCharCode(65 + idx)}.
                  </span>
                  {opt}
                </div>
              ))}
            </div>

            <div className="mt-8 flex justify-between">
              <button
                disabled={currentQuestion === 0}
                onClick={handlePrev}
                className="px-6 py-3 border rounded-lg disabled:opacity-50 transition"
              >
                Previous
              </button>
              <button
                disabled={selectedAnswer === null}
                onClick={handleNext}
                className="px-6 py-3 bg-emerald-600 text-white rounded-lg disabled:opacity-50 transition"
              >
                {currentQuestion === activeQuiz.questions.length - 1
                  ? "Submit"
                  : "Next"}
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  /* ===========================================
     QUIZ LIST (student landing)
  =========================================== */
  return (
    <div className="min-h-screen">
      <main className="max-w-4xl mx-auto py-6 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">📝 Your Quizzes</h1>
          <p className="mt-2 text-gray-600">
            Pending quizzes assigned by your teachers
          </p>
        </div>

        {listLoading && (
          <div className="text-center py-12 text-gray-500">
            Loading quizzes…
          </div>
        )}

        {listError && (
          <div className="p-4 bg-red-100 text-red-700 rounded-xl mb-6">
            {listError}
          </div>
        )}

        {!listLoading && pendingQuizzes.length === 0 && (
          <div className="bg-white rounded-xl shadow p-8 text-center">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              All caught up!
            </h2>
            <p className="text-gray-600">
              You have no pending quizzes right now. Check back later!
            </p>
          </div>
        )}

        <div className="space-y-4">
          {pendingQuizzes.map((quiz) => {
            const subjectName =
              typeof quiz.subject === "object"
                ? quiz.subject.name
                : "Unknown Subject";
            const subjectCode =
              typeof quiz.subject === "object" ? quiz.subject.code : "";

            return (
              <div
                key={quiz._id}
                className="bg-white rounded-xl shadow-md p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {quiz.title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {subjectName}
                    {subjectCode && ` (${subjectCode})`}
                  </p>
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                    <span>📊 {quiz.questions.length} questions</span>
                    <span>⏱️ {quiz.duration} min</span>
                    <span>
                      🕐 Due {new Date(quiz.endsAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => startQuiz(quiz)}
                  className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition whitespace-nowrap"
                >
                  Start Quiz →
                </button>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
