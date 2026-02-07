/**
 * Teacher Analytics Routes
 *
 * GET /teacher/analytics/overview           — high-level stats across all subjects
 * GET /teacher/analytics/subjects/:subjectId — per-subject student breakdown
 * GET /teacher/analytics/quiz/:quizId        — per-quiz results for every student
 */

import type { Request, Response, NextFunction } from "express";
import type { RouterObject } from "../../types/router.js";
import { requireRole } from "../lib/requireRole.js";
import { Subject } from "../models/Subject.js";
import { Quiz } from "../models/Quiz.js";
import { QuizResult } from "../models/QuizResult.js";
import { NotFoundError } from "../errors/httpErrors.js";

const teacherAnalyticsRouter: RouterObject = {
  path: "/teacher/analytics",
  functions: [
    // ── GET /teacher/analytics/overview ──────────────
    {
      method: "get",
      props: "/overview",
      authorization: "required",
      rateLimit: "read",
      keyType: "user",
      middlewares: [requireRole("teacher")],
      handler: async (req: Request, res: Response, _next: NextFunction) => {
        const teacherId = req.user.id;

        const subjects = await Subject.find({ teacher: teacherId })
          .populate("students", "name email enrollmentId")
          .lean();

        const subjectIds = subjects.map((s) => s._id);

        // All quiz results across teacher's subjects
        const allResults = await QuizResult.find({
          subject: { $in: subjectIds },
        })
          .populate("student", "name email enrollmentId")
          .populate("quiz", "title")
          .populate("subject", "name code")
          .lean();

        // Aggregate per subject
        const subjectStats = subjects.map((subject) => {
          const results = allResults.filter(
            (r) => r.subject._id.toString() === subject._id.toString(),
          );

          const scores = results.map((r) => r.score);
          const avgScore =
            scores.length > 0
              ? Math.round(
                  (scores.reduce((a, b) => a + b, 0) / scores.length) * 100,
                ) / 100
              : 0;

          // Weak topics across all students in this subject
          const topicFailMap = new Map<string, number>();
          for (const r of results) {
            for (const t of r.weakTopics) {
              topicFailMap.set(t, (topicFailMap.get(t) || 0) + 1);
            }
          }

          const weakTopics = Array.from(topicFailMap.entries())
            .map(([topic, count]) => ({ topic, failCount: count }))
            .sort((a, b) => b.failCount - a.failCount);

          return {
            subjectId: subject._id,
            subjectName: subject.name,
            subjectCode: (subject as any).code,
            totalStudents: subject.students.length,
            totalQuizResults: results.length,
            averageScore: avgScore,
            highestScore: scores.length > 0 ? Math.max(...scores) : 0,
            lowestScore: scores.length > 0 ? Math.min(...scores) : 0,
            weakTopics: weakTopics.slice(0, 5),
          };
        });

        // Global aggregates
        const allScores = allResults.map((r) => r.score);
        const overallAvg =
          allScores.length > 0
            ? Math.round(
                (allScores.reduce((a, b) => a + b, 0) / allScores.length) *
                  100,
              ) / 100
            : 0;

        const uniqueStudentIds = new Set(
          allResults.map((r) => r.student._id.toString()),
        );

        // Recent results (last 20)
        const recentResults = allResults
          .sort(
            (a, b) =>
              new Date(b.submittedAt).getTime() -
              new Date(a.submittedAt).getTime(),
          )
          .slice(0, 20)
          .map((r) => ({
            student: {
              name: (r.student as any).name,
              enrollmentId: (r.student as any).enrollmentId,
            },
            quiz: (r.quiz as any)?.title ?? "Unknown",
            subject: (r.subject as any).name,
            score: r.score,
            weakTopics: r.weakTopics,
            submittedAt: r.submittedAt,
          }));

        res.json({
          overview: {
            totalSubjects: subjects.length,
            totalStudents: uniqueStudentIds.size,
            totalQuizSubmissions: allResults.length,
            overallAverageScore: overallAvg,
          },
          subjectStats,
          recentResults,
        });
      },
    },

    // ── GET /teacher/analytics/subjects/:subjectId ──
    {
      method: "get",
      props: "/subjects/:subjectId",
      authorization: "required",
      rateLimit: "read",
      keyType: "user",
      middlewares: [requireRole("teacher")],
      handler: async (req: Request, res: Response, _next: NextFunction) => {
        const teacherId = req.user.id;
        const { subjectId } = req.params;

        const subject = await Subject.findOne({
          _id: subjectId,
          teacher: teacherId,
        })
          .populate("students", "name email enrollmentId semester")
          .lean();

        if (!subject) throw new NotFoundError("Subject not found");

        // All results for this subject
        const results = await QuizResult.find({ subject: subjectId })
          .populate("student", "name email enrollmentId")
          .populate("quiz", "title duration createdAt")
          .lean();

        // Per-student breakdown
        const studentMap = new Map<
          string,
          {
            name: string;
            email: string;
            enrollmentId: string;
            scores: number[];
            weakTopics: string[];
          }
        >();

        for (const r of results) {
          const sid = r.student._id.toString();
          if (!studentMap.has(sid)) {
            studentMap.set(sid, {
              name: (r.student as any).name,
              email: (r.student as any).email,
              enrollmentId: (r.student as any).enrollmentId || "",
              scores: [],
              weakTopics: [],
            });
          }
          const entry = studentMap.get(sid)!;
          entry.scores.push(r.score);
          entry.weakTopics.push(...r.weakTopics);
        }

        const studentPerformance = Array.from(studentMap.entries())
          .map(([studentId, data]) => {
            const avg =
              data.scores.reduce((a, b) => a + b, 0) / data.scores.length;

            // Deduplicate weak topics and count frequency
            const topicCount = new Map<string, number>();
            for (const t of data.weakTopics) {
              topicCount.set(t, (topicCount.get(t) || 0) + 1);
            }

            return {
              studentId,
              name: data.name,
              email: data.email,
              enrollmentId: data.enrollmentId,
              quizzesTaken: data.scores.length,
              averageScore: Math.round(avg * 100) / 100,
              highestScore: Math.max(...data.scores),
              lowestScore: Math.min(...data.scores),
              trend:
                data.scores.length >= 2
                  ? data.scores[data.scores.length - 1]! >
                    data.scores[data.scores.length - 2]!
                    ? "up"
                    : data.scores[data.scores.length - 1]! <
                        data.scores[data.scores.length - 2]!
                      ? "down"
                      : "stable"
                  : "stable",
              weakTopics: Array.from(topicCount.entries())
                .map(([topic, count]) => ({ topic, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5),
            };
          })
          .sort((a, b) => b.averageScore - a.averageScore);

        // Quizzes created for this subject
        const quizzes = await Quiz.find({ subject: subjectId, teacher: teacherId })
          .select("title duration isActive startsAt endsAt createdAt")
          .sort({ createdAt: -1 })
          .lean();

        // Attach submission count to each quiz
        const quizzesWithStats = quizzes.map((q) => {
          const quizResults = results.filter(
            (r) => r.quiz._id.toString() === q._id.toString(),
          );
          const scores = quizResults.map((r) => r.score);
          return {
            ...q,
            submissions: quizResults.length,
            averageScore:
              scores.length > 0
                ? Math.round(
                    (scores.reduce((a, b) => a + b, 0) / scores.length) * 100,
                  ) / 100
                : 0,
          };
        });

        // Class-wide weak topics
        const classTopics = new Map<string, number>();
        for (const r of results) {
          for (const t of r.weakTopics) {
            classTopics.set(t, (classTopics.get(t) || 0) + 1);
          }
        }

        const classWeakTopics = Array.from(classTopics.entries())
          .map(([topic, count]) => ({
            topic,
            studentsStruggling: count,
            percentageStruggling:
              studentMap.size > 0
                ? Math.round((count / studentMap.size) * 100)
                : 0,
          }))
          .sort((a, b) => b.studentsStruggling - a.studentsStruggling);

        res.json({
          subject: {
            _id: subject._id,
            name: subject.name,
            code: (subject as any).code,
            totalEnrolled: subject.students.length,
          },
          classAverage:
            results.length > 0
              ? Math.round(
                  (results.reduce((s, r) => s + r.score, 0) / results.length) *
                    100,
                ) / 100
              : 0,
          studentPerformance,
          quizzes: quizzesWithStats,
          classWeakTopics,
        });
      },
    },

    // ── GET /teacher/analytics/quiz/:quizId ─────────
    {
      method: "get",
      props: "/quiz/:quizId",
      authorization: "required",
      rateLimit: "read",
      keyType: "user",
      middlewares: [requireRole("teacher")],
      handler: async (req: Request, res: Response, _next: NextFunction) => {
        const teacherId = req.user.id;
        const { quizId } = req.params;

        const quiz = await Quiz.findOne({ _id: quizId, teacher: teacherId })
          .populate("subject", "name code")
          .lean();

        if (!quiz) throw new NotFoundError("Quiz not found");

        const results = await QuizResult.find({ quiz: quizId })
          .populate("student", "name email enrollmentId")
          .lean();

        const scores = results.map((r) => r.score);
        const avgScore =
          scores.length > 0
            ? Math.round(
                (scores.reduce((a, b) => a + b, 0) / scores.length) * 100,
              ) / 100
            : 0;

        // Per-question analysis
        const questionStats = quiz.questions.map((q, idx) => {
          const questionResults = results.map((r) => {
            const a = r.answers.find((a) => a.questionIndex === idx);
            return a;
          }).filter(Boolean);

          const correctCount = questionResults.filter((a) => a!.isCorrect).length;
          const total = questionResults.length;

          // Distribution of selected options
          const optionDist = [0, 0, 0, 0];
          for (const a of questionResults) {
            const selected = a!.selectedAnswer;
            if (selected >= 0 && selected <= 3) {
              optionDist[selected] = (optionDist[selected] ?? 0) + 1;
            }
          }

          return {
            questionIndex: idx,
            question: q.question,
            topic: q.topic,
            correctAnswer: q.correctAnswer,
            totalAttempts: total,
            correctCount,
            accuracy:
              total > 0 ? Math.round((correctCount / total) * 100) : 0,
            optionDistribution: q.options.map((opt, i) => ({
              option: opt,
              count: optionDist[i],
              isCorrect: i === q.correctAnswer,
            })),
          };
        });

        // Student results list
        const studentResults = results
          .map((r) => ({
            studentId: r.student._id,
            name: (r.student as any).name,
            email: (r.student as any).email,
            enrollmentId: (r.student as any).enrollmentId || "",
            score: r.score,
            totalCorrect: r.totalCorrect,
            totalQuestions: r.totalQuestions,
            weakTopics: r.weakTopics,
            submittedAt: r.submittedAt,
          }))
          .sort((a, b) => b.score - a.score);

        res.json({
          quiz: {
            _id: quiz._id,
            title: quiz.title,
            subject: quiz.subject,
            duration: quiz.duration,
            totalQuestions: quiz.questions.length,
            isActive: quiz.isActive,
            startsAt: quiz.startsAt,
            endsAt: quiz.endsAt,
          },
          stats: {
            totalSubmissions: results.length,
            averageScore: avgScore,
            highestScore: scores.length > 0 ? Math.max(...scores) : 0,
            lowestScore: scores.length > 0 ? Math.min(...scores) : 0,
            passRate:
              scores.length > 0
                ? Math.round(
                    (scores.filter((s) => s >= 60).length / scores.length) * 100,
                  )
                : 0,
          },
          questionStats,
          studentResults,
        });
      },
    },
  ],
};

export default teacherAnalyticsRouter;
