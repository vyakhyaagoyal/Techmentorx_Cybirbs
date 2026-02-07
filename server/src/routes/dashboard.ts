import type { Request, Response, NextFunction } from "express";
import type { RouterObject } from "../../types/router.js";
import { requireRole } from "../lib/requireRole.js";
import { User } from "../models/User.js";
import { QuizResult } from "../models/QuizResult.js";
import { StudyTopic } from "../models/StudyTopic.js";
import { Subject } from "../models/Subject.js";

const dashboardRouter: RouterObject = {
  path: "/dashboard",
  functions: [
    // GET /dashboard - Student personal dashboard overview
    {
      method: "get",
      authorization: "required",
      rateLimit: "read",
      keyType: "user",
      middlewares: [requireRole("student")],
      handler: async (req: Request, res: Response, _next: NextFunction) => {
        const studentId = req.user.id;

        const student = await User.findById(studentId)
          .select("-password")
          .populate("subjects", "name code department semester");
        if (!student) throw new Error("Student not found");

        // Get quiz results for all subjects
        const quizResults = await QuizResult.find({ student: studentId })
          .populate("subject", "name code")
          .sort({ submittedAt: -1 });

        // Calculate overall score
        const overallAvg =
          quizResults.length > 0
            ? quizResults.reduce((sum, r) => sum + r.score, 0) / quizResults.length
            : 0;

        // Per-subject averages
        const subjectScores = new Map<string, { name: string; scores: number[] }>();
        for (const result of quizResults) {
          const subId = result.subject._id.toString();
          if (!subjectScores.has(subId)) {
            subjectScores.set(subId, {
              name: (result.subject as any).name,
              scores: [],
            });
          }
          subjectScores.get(subId)!.scores.push(result.score);
        }

        const subjectPerformance = Array.from(subjectScores.entries()).map(
          ([subjectId, data]) => ({
            subjectId,
            subjectName: data.name,
            averageScore: data.scores.reduce((a, b) => a + b, 0) / data.scores.length,
            quizzesTaken: data.scores.length,
          }),
        );

        // Pending study topics
        const pendingStudyTopics = await StudyTopic.find({
          student: studentId,
          status: { $ne: "completed" },
        })
          .populate("subject", "name code")
          .sort({ deadline: 1 });

        res.json({
          student: {
            name: student.name,
            email: student.email,
            department: student.department,
            semester: student.semester,
            enrollmentId: student.enrollmentId,
          },
          performance: {
            overallAverage: Math.round(overallAvg * 100) / 100,
            totalQuizzesTaken: quizResults.length,
            subjectPerformance,
          },
          pendingStudyTopics,
        });
      },
    },
    // GET /dashboard/standing - Where the student stands (percentile, not position)
    {
      method: "get",
      props: "/standing",
      authorization: "required",
      rateLimit: "read",
      keyType: "user",
      middlewares: [requireRole("student")],
      handler: async (req: Request, res: Response, _next: NextFunction) => {
        const studentId = req.user.id;

        const student = await User.findById(studentId);
        if (!student) throw new Error("Student not found");

        // Get all students in same department
        const departmentStudents = await User.find({
          role: "student",
          department: student.department,
        }).select("_id");
        const departmentStudentIds = departmentStudents.map((s) => s._id.toString());

        // Get all quiz results for department
        const allResults = await QuizResult.find({
          student: { $in: departmentStudentIds },
        });

        // Calculate each student's overall average
        const studentAvgs = new Map<string, number[]>();
        for (const r of allResults) {
          const sid = r.student.toString();
          if (!studentAvgs.has(sid)) studentAvgs.set(sid, []);
          studentAvgs.get(sid)!.push(r.score);
        }

        const avgScores = Array.from(studentAvgs.entries()).map(([sid, scores]) => ({
          studentId: sid,
          avg: scores.reduce((a, b) => a + b, 0) / scores.length,
        }));

        const myAvg = avgScores.find((s) => s.studentId === studentId)?.avg ?? 0;
        const studentsAhead = avgScores.filter((s) => s.avg > myAvg).length;
        const totalStudents = avgScores.length || 1;
        const overallPercentileBehind = Math.round((studentsAhead / totalStudents) * 100);

        // Per-subject standing
        const mySubjects = student.subjects ?? [];
        const subjectStanding = [];

        for (const subjectId of mySubjects) {
          const subjectResults = allResults.filter(
            (r) => r.subject.toString() === subjectId.toString(),
          );

          const subjectStudentAvgs = new Map<string, number[]>();
          for (const r of subjectResults) {
            const sid = r.student.toString();
            if (!subjectStudentAvgs.has(sid)) subjectStudentAvgs.set(sid, []);
            subjectStudentAvgs.get(sid)!.push(r.score);
          }

          const subAvgScores = Array.from(subjectStudentAvgs.entries()).map(([sid, scores]) => ({
            studentId: sid,
            avg: scores.reduce((a, b) => a + b, 0) / scores.length,
          }));

          const mySubAvg = subAvgScores.find((s) => s.studentId === studentId)?.avg ?? 0;
          const subAhead = subAvgScores.filter((s) => s.avg > mySubAvg).length;
          const subTotal = subAvgScores.length || 1;

          const subject = await Subject.findById(subjectId).select("name code");

          subjectStanding.push({
            subjectId: subjectId.toString(),
            subjectName: subject?.name ?? "Unknown",
            subjectCode: subject?.code ?? "",
            percentileBehind: Math.round((subAhead / subTotal) * 100),
          });
        }

        res.json({
          department: student.department,
          overall: {
            percentileBehind: overallPercentileBehind,
            message: `You are behind ${overallPercentileBehind}% of students overall`,
          },
          subjectWise: subjectStanding.map((s) => ({
            ...s,
            message: `You are behind ${s.percentileBehind}% of students in ${s.subjectName}`,
          })),
        });
      },
    },
    // GET /dashboard/graph - Performance graph data over time
    {
      method: "get",
      props: "/graph",
      authorization: "required",
      rateLimit: "read",
      keyType: "user",
      middlewares: [requireRole("student")],
      handler: async (req: Request, res: Response, _next: NextFunction) => {
        const studentId = req.user.id;

        const quizResults = await QuizResult.find({ student: studentId })
          .populate("subject", "name code")
          .populate("quiz", "title")
          .sort({ submittedAt: 1 });

        // Group by subject for charting
        const graphData = new Map<string, { name: string; dataPoints: { date: Date; score: number }[] }>();
        for (const r of quizResults) {
          const subId = r.subject._id.toString();
          if (!graphData.has(subId)) {
            graphData.set(subId, {
              name: (r.subject as any).name,
              dataPoints: [],
            });
          }
          graphData.get(subId)!.dataPoints.push({
            date: r.submittedAt,
            score: r.score,
          });
        }

        res.json({
          subjects: Array.from(graphData.entries()).map(([subjectId, data]) => ({
            subjectId,
            subjectName: data.name,
            dataPoints: data.dataPoints,
          })),
        });
      },
    },
  ],
};

export default dashboardRouter;
