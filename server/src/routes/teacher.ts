import type { Request, Response, NextFunction } from "express";
import type { RouterObject } from "../../types/router.js";
import { requireRole } from "../lib/requireRole.js";
import { User } from "../models/User.js";
import { Subject } from "../models/Subject.js";
import { Lecture } from "../models/Lecture.js";
import { Quiz } from "../models/Quiz.js";
import { EngagementData } from "../models/EngagementData.js";
import { BadRequestError, NotFoundError } from "../errors/httpErrors.js";
import { generateQuizFromPPT } from "../lib/pythonClient.js";

const teacherRouter: RouterObject = {
  path: "/teacher",
  functions: [
    // GET /teacher/dashboard - Teacher overview
    {
      method: "get",
      props: "/dashboard",
      authorization: "required",
      rateLimit: "read",
      keyType: "user",
      middlewares: [requireRole("teacher")],
      handler: async (req: Request, res: Response, _next: NextFunction) => {
        const teacherId = req.user.id;

        const [subjects, recentLectures] = await Promise.all([
          Subject.find({ teacher: teacherId }).populate("students", "name email"),
          Lecture.find({ teacher: teacherId })
            .sort({ date: -1 })
            .limit(10)
            .populate("subject", "name code"),
        ]);

        res.json({
          subjects,
          recentLectures,
          totalSubjects: subjects.length,
          totalStudents: new Set(subjects.flatMap((s) => s.students.map(String))).size,
        });
      },
    },
    // POST /teacher/subjects - Create a subject
    {
      method: "post",
      props: "/subjects",
      authorization: "required",
      rateLimit: "strict",
      keyType: "user",
      middlewares: [requireRole("teacher")],
      handler: async (req: Request, res: Response, _next: NextFunction) => {
        const { name, code, department, semester } = req.body;

        if (!name || !code || !department || !semester) {
          throw new BadRequestError("name, code, department, and semester are required");
        }

        const subject = new Subject({
          name,
          code,
          department,
          semester,
          teacher: req.user.id,
        });

        await subject.save();

        // Add to teacher's teaching subjects
        await User.findByIdAndUpdate(req.user.id, {
          $addToSet: { teachingSubjects: subject._id },
        });

        res.status(201).json({ message: "Subject created", subject });
      },
    },
    // POST /teacher/subjects/:subjectId/students - Enroll students in subject
    {
      method: "post",
      props: "/subjects/:subjectId/students",
      authorization: "required",
      rateLimit: "strict",
      keyType: "user",
      middlewares: [requireRole("teacher")],
      handler: async (req: Request, res: Response, _next: NextFunction) => {
        const { subjectId } = req.params;
        const { studentIds } = req.body;

        if (!studentIds || !Array.isArray(studentIds)) {
          throw new BadRequestError("studentIds array is required");
        }

        const subject = await Subject.findOne({ _id: subjectId, teacher: req.user.id });
        if (!subject) throw new NotFoundError("Subject not found");

        // Add students to subject
        await Subject.findByIdAndUpdate(subjectId, {
          $addToSet: { students: { $each: studentIds } },
        });

        // Add subject to each student
        await User.updateMany(
          { _id: { $in: studentIds }, role: "student" },
          { $addToSet: { subjects: subjectId } },
        );

        res.json({ message: "Students enrolled successfully" });
      },
    },
    // POST /teacher/lectures - Create a lecture & optionally generate quiz from PPT
    {
      method: "post",
      props: "/lectures",
      authorization: "required",
      rateLimit: "strict",
      keyType: "user",
      middlewares: [requireRole("teacher")],
      handler: async (req: Request, res: Response, _next: NextFunction) => {
        const { subjectId, title, description, pptUrl, topicsCovered, date, duration } = req.body;

        if (!subjectId || !title || !topicsCovered?.length) {
          throw new BadRequestError("subjectId, title, and topicsCovered are required");
        }

        const subject = await Subject.findOne({ _id: subjectId, teacher: req.user.id });
        if (!subject) throw new NotFoundError("Subject not found or unauthorized");

        const lecture = new Lecture({
          subject: subjectId,
          teacher: req.user.id,
          title,
          description,
          pptUrl,
          topicsCovered,
          date: date || new Date(),
          duration: duration || 60,
        });

        await lecture.save();

        // If PPT is provided, trigger quiz generation from Python server
        let quiz = null;
        if (pptUrl) {
          const quizResult = await generateQuizFromPPT(pptUrl, topicsCovered);
          if (quizResult.success && quizResult.data) {
            const now = new Date();
            quiz = new Quiz({
              lecture: lecture._id,
              subject: subjectId,
              teacher: req.user.id,
              title: `Quiz: ${title}`,
              questions: quizResult.data.questions,
              duration: 20,
              isActive: true,
              startsAt: now,
              endsAt: new Date(now.getTime() + 20 * 60 * 1000),
            });
            await quiz.save();
          }
        }

        res.status(201).json({
          message: "Lecture created" + (quiz ? " with quiz" : ""),
          lecture,
          quiz,
        });
      },
    },
    // GET /teacher/subjects/:subjectId/engagement - View engagement data for a subject
    {
      method: "get",
      props: "/subjects/:subjectId/engagement",
      authorization: "required",
      rateLimit: "read",
      keyType: "user",
      middlewares: [requireRole("teacher")],
      handler: async (req: Request, res: Response, _next: NextFunction) => {
        const { subjectId } = req.params;

        const subject = await Subject.findOne({ _id: subjectId, teacher: req.user.id });
        if (!subject) throw new NotFoundError("Subject not found");

        const engagementRecords = await EngagementData.find({ subject: subjectId })
          .populate("lecture", "title date topicsCovered")
          .sort({ createdAt: -1 });

        // Aggregate low-engagement topics across lectures
        const topicEngagementMap = new Map<string, number[]>();
        for (const record of engagementRecords) {
          for (const seg of record.topicSegments) {
            if (!topicEngagementMap.has(seg.topic)) {
              topicEngagementMap.set(seg.topic, []);
            }
            topicEngagementMap.get(seg.topic)!.push(seg.avgEngagement);
          }
        }

        const topicSummary = Array.from(topicEngagementMap.entries()).map(([topic, scores]) => ({
          topic,
          avgEngagement: scores.reduce((a, b) => a + b, 0) / scores.length,
          needsRepeat: scores.reduce((a, b) => a + b, 0) / scores.length < 50,
        }));

        res.json({
          subject: { name: subject.name, code: subject.code },
          engagementRecords,
          topicSummary,
          topicsNeedingRepeat: topicSummary.filter((t) => t.needsRepeat),
        });
      },
    },
    // GET /teacher/subjects/:subjectId/students - List enrolled students
    {
      method: "get",
      props: "/subjects/:subjectId/students",
      authorization: "required",
      rateLimit: "read",
      keyType: "user",
      middlewares: [requireRole("teacher")],
      handler: async (req: Request, res: Response, _next: NextFunction) => {
        const { subjectId } = req.params;

        const subject = await Subject.findOne({ _id: subjectId, teacher: req.user.id })
          .populate("students", "name email enrollmentId semester department");
        if (!subject) throw new NotFoundError("Subject not found");

        res.json({ students: subject.students });
      },
    },
  ],
};

export default teacherRouter;
