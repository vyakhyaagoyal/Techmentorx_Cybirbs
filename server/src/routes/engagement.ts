import type { Request, Response, NextFunction } from "express";
import type { RouterObject } from "../../types/router.js";
import { requireRole } from "../lib/requireRole.js";
import { EngagementData } from "../models/EngagementData.js";
import { Lecture } from "../models/Lecture.js";
import { Subject } from "../models/Subject.js";
import { NotFoundError, BadRequestError } from "../errors/httpErrors.js";
import { processEngagement } from "../lib/pythonClient.js";

const engagementRouter: RouterObject = {
  path: "/engagement",
  functions: [
    // POST /engagement/process - Process engagement data for a lecture (called by Python server or teacher)
    {
      method: "post",
      props: "/process",
      authorization: "required",
      rateLimit: "strict",
      keyType: "user",
      middlewares: [requireRole("teacher")],
      handler: async (req: Request, res: Response, _next: NextFunction) => {
        const { lectureId, videoUrl } = req.body;

        if (!lectureId) {
          throw new BadRequestError("lectureId is required");
        }

        const lecture = await Lecture.findOne({ _id: lectureId, teacher: req.user.id });
        if (!lecture) throw new NotFoundError("Lecture not found");

        // Send to Python server for OpenCV processing
        const result = await processEngagement(lectureId, videoUrl);

        if (!result.success || !result.data) {
          res.status(503).json({
            message: "Engagement processing service unavailable",
            error: result.error,
          });
          return;
        }

        const engagementData = new EngagementData({
          lecture: lectureId,
          subject: lecture.subject,
          topicSegments: result.data.topicSegments,
          studentEngagements: result.data.studentEngagements,
          overallAvgEngagement: result.data.overallAvgEngagement,
          lowEngagementTopics: result.data.lowEngagementTopics,
        });

        await engagementData.save();

        // Mark lecture as processed
        lecture.engagementProcessed = true;
        await lecture.save();

        res.status(201).json({
          message: "Engagement data processed",
          data: engagementData,
        });
      },
    },
    // POST /engagement/webhook - Receive engagement data from Python server
    {
      method: "post",
      props: "/webhook",
      authorization: "none",
      rateLimit: "strict",
      keyType: "ip",
      handler: async (req: Request, res: Response, _next: NextFunction) => {
        const {
          lectureId,
          topicSegments,
          studentEngagements,
          overallAvgEngagement,
          lowEngagementTopics,
        } = req.body;

        if (!lectureId) throw new BadRequestError("lectureId is required");

        const lecture = await Lecture.findById(lectureId);
        if (!lecture) throw new NotFoundError("Lecture not found");

        const engagementData = new EngagementData({
          lecture: lectureId,
          subject: lecture.subject,
          topicSegments: topicSegments || [],
          studentEngagements: studentEngagements || [],
          overallAvgEngagement: overallAvgEngagement || 0,
          lowEngagementTopics: lowEngagementTopics || [],
        });

        await engagementData.save();

        lecture.engagementProcessed = true;
        await lecture.save();

        res.status(201).json({ message: "Engagement data received" });
      },
    },
    // GET /engagement/lecture/:lectureId - Get engagement data for a specific lecture
    {
      method: "get",
      props: "/lecture/:lectureId",
      authorization: "required",
      rateLimit: "read",
      keyType: "user",
      middlewares: [requireRole("teacher")],
      handler: async (req: Request, res: Response, _next: NextFunction) => {
        const { lectureId } = req.params;

        const engagementData = await EngagementData.findOne({ lecture: lectureId })
          .populate("lecture", "title date topicsCovered")
          .populate("subject", "name code");

        if (!engagementData) throw new NotFoundError("No engagement data found for this lecture");

        res.json({ data: engagementData });
      },
    },
    // GET /engagement/subject/:subjectId/low-topics - Get topics with low engagement
    {
      method: "get",
      props: "/subject/:subjectId/low-topics",
      authorization: "required",
      rateLimit: "read",
      keyType: "user",
      middlewares: [requireRole("teacher")],
      handler: async (req: Request, res: Response, _next: NextFunction) => {
        const { subjectId } = req.params;

        const subject = await Subject.findById(subjectId);
        if (!subject) throw new NotFoundError("Subject not found");

        const engagementRecords = await EngagementData.find({ subject: subjectId });

        // Aggregate topics with low engagement - these need repetition
        const topicMap = new Map<string, { scores: number[]; lectures: string[] }>();

        for (const record of engagementRecords) {
          for (const seg of record.topicSegments) {
            if (!topicMap.has(seg.topic)) {
              topicMap.set(seg.topic, { scores: [], lectures: [] });
            }
            topicMap.get(seg.topic)!.scores.push(seg.avgEngagement);
            topicMap.get(seg.topic)!.lectures.push(record.lecture.toString());
          }
        }

        const lowTopics = Array.from(topicMap.entries())
          .map(([topic, data]) => ({
            topic,
            avgEngagement: Math.round(
              (data.scores.reduce((a, b) => a + b, 0) / data.scores.length) * 100,
            ) / 100,
            lectureCount: data.lectures.length,
          }))
          .filter((t) => t.avgEngagement < 50)
          .sort((a, b) => a.avgEngagement - b.avgEngagement);

        res.json({
          subject: { name: subject.name, code: subject.code },
          lowEngagementTopics: lowTopics,
          recommendation: lowTopics.length > 0
            ? "Consider repeating these topics in upcoming lectures"
            : "All topics have good engagement levels",
        });
      },
    },
  ],
};

export default engagementRouter;
