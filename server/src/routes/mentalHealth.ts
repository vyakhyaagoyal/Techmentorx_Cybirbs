import type { Request, Response, NextFunction } from "express";
import type { RouterObject } from "../../types/router.js";
import { requireRole } from "../lib/requireRole.js";
import { MentalHealthReport } from "../models/MentalHealthReport.js";
import { BadRequestError, NotFoundError } from "../errors/httpErrors.js";
import { analyzeMoodResponses, generateMonthlyReport } from "../lib/pythonClient.js";

const mentalHealthRouter: RouterObject = {
  path: "/mental-health",
  functions: [
    // POST /mental-health/mood - Log a daily mood entry
    {
      method: "post",
      props: "/mood",
      authorization: "required",
      rateLimit: "strict",
      keyType: "user",
      middlewares: [requireRole("student")],
      handler: async (req: Request, res: Response, _next: NextFunction) => {
        const studentId = req.user.id;
        const { mood, stressLevel, sleepHours, notes } = req.body;

        if (!mood || !stressLevel || sleepHours === undefined) {
          throw new BadRequestError("mood, stressLevel, and sleepHours are required");
        }

        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();

        // Find or create the current month's report
        let report = await MentalHealthReport.findOne({ student: studentId, month, year });

        if (!report) {
          report = new MentalHealthReport({
            student: studentId,
            month,
            year,
            moodEntries: [],
          });
        }

        report.moodEntries.push({
          date: now,
          mood,
          stressLevel,
          sleepHours,
          notes,
        });

        await report.save();
        res.status(201).json({ message: "Mood entry logged", entry: report.moodEntries.at(-1) });
      },
    },
    // POST /mental-health/chatbot - Submit chatbot responses for analysis
    {
      method: "post",
      props: "/chatbot",
      authorization: "required",
      rateLimit: "strict",
      keyType: "user",
      middlewares: [requireRole("student")],
      handler: async (req: Request, res: Response, _next: NextFunction) => {
        const studentId = req.user.id;
        const { responses } = req.body; // { question: answer } pairs

        if (!responses || typeof responses !== "object") {
          throw new BadRequestError("responses object is required");
        }

        // Send to Python server for AI analysis
        const analysis = await analyzeMoodResponses(studentId, responses);

        if (!analysis.success || !analysis.data) {
          res.status(503).json({
            message: "Mental health analysis service unavailable",
            error: analysis.error,
          });
          return;
        }

        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();

        let report = await MentalHealthReport.findOne({ student: studentId, month, year });
        if (!report) {
          report = new MentalHealthReport({
            student: studentId,
            month,
            year,
            moodEntries: [],
          });
        }

        // Log as a mood entry with chatbot data
        report.moodEntries.push({
          date: now,
          mood: analysis.data.mood,
          stressLevel: analysis.data.stressLevel,
          sleepHours: 0, // not tracked via chatbot
          chatbotResponses: responses,
        });

        await report.save();

        res.json({
          message: "Chatbot analysis complete",
          analysis: {
            mood: analysis.data.mood,
            stressLevel: analysis.data.stressLevel,
            insights: analysis.data.insights,
            recommendations: analysis.data.recommendations,
          },
        });
      },
    },
    // POST /mental-health/activity - Log a game/activity completion
    {
      method: "post",
      props: "/activity",
      authorization: "required",
      rateLimit: "strict",
      keyType: "user",
      middlewares: [requireRole("student")],
      handler: async (req: Request, res: Response, _next: NextFunction) => {
        const studentId = req.user.id;
        const { type } = req.body; // "game" or "activity"

        if (!type || !["game", "activity"].includes(type)) {
          throw new BadRequestError("type must be 'game' or 'activity'");
        }

        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();

        let report = await MentalHealthReport.findOne({ student: studentId, month, year });
        if (!report) {
          report = new MentalHealthReport({
            student: studentId,
            month,
            year,
            moodEntries: [],
          });
        }

        if (type === "game") report.gamesPlayed += 1;
        else report.activitiesCompleted += 1;

        await report.save();
        res.json({
          message: `${type} logged`,
          gamesPlayed: report.gamesPlayed,
          activitiesCompleted: report.activitiesCompleted,
        });
      },
    },
    // GET /mental-health/report - Get current month's mental health report
    {
      method: "get",
      props: "/report",
      authorization: "required",
      rateLimit: "read",
      keyType: "user",
      middlewares: [requireRole("student")],
      handler: async (req: Request, res: Response, _next: NextFunction) => {
        const studentId = req.user.id;
        const month = Number(req.query.month) || new Date().getMonth() + 1;
        const year = Number(req.query.year) || new Date().getFullYear();

        const report = await MentalHealthReport.findOne({ student: studentId, month, year });
        if (!report) throw new NotFoundError("No report found for this month");

        res.json({ report });
      },
    },
    // POST /mental-health/report/generate - Generate monthly report via AI
    {
      method: "post",
      props: "/report/generate",
      authorization: "required",
      rateLimit: "strict",
      keyType: "user",
      middlewares: [requireRole("student")],
      handler: async (req: Request, res: Response, _next: NextFunction) => {
        const studentId = req.user.id;
        const month = Number(req.body.month) || new Date().getMonth() + 1;
        const year = Number(req.body.year) || new Date().getFullYear();

        const report = await MentalHealthReport.findOne({ student: studentId, month, year });
        if (!report) throw new NotFoundError("No data found for this month");

        // Call Python server to generate insights
        const aiReport = await generateMonthlyReport(studentId, month, year);

        if (aiReport.success && aiReport.data) {
          report.averageMood = aiReport.data.averageMood;
          report.averageStress = aiReport.data.averageStress;
          report.averageSleep = aiReport.data.averageSleep;
          report.insights = aiReport.data.insights;
          report.recommendations = aiReport.data.recommendations;
          report.generatedAt = new Date();
          await report.save();
        }

        res.json({
          message: "Monthly report generated",
          report,
        });
      },
    },
  ],
};

export default mentalHealthRouter;
