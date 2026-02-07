import type { Request, Response, NextFunction } from "express";
import type { RouterObject } from "../../types/router.js";
import { requireRole } from "../lib/requireRole.js";
import { StudyTopic } from "../models/StudyTopic.js";
import { NotFoundError, BadRequestError } from "../errors/httpErrors.js";
import { generateTeachingContent } from "../lib/pythonClient.js";

const studyRouter: RouterObject = {
  path: "/study",
  functions: [
    // GET /study/topics - Get all study topics for the student
    {
      method: "get",
      props: "/topics",
      authorization: "required",
      rateLimit: "read",
      keyType: "user",
      middlewares: [requireRole("student")],
      handler: async (req: Request, res: Response, _next: NextFunction) => {
        const studentId = req.user.id;
        const { status, subject } = req.query;

        const filter: Record<string, unknown> = { student: studentId };
        if (status) filter.status = status;
        if (subject) filter.subject = subject;

        const topics = await StudyTopic.find(filter)
          .populate("subject", "name code")
          .populate("sourceLecture", "title date")
          .sort({ deadline: 1 });

        const now = new Date();
        const overdue = topics.filter(
          (t) => t.status !== "completed" && t.deadline < now,
        );

        res.json({
          topics,
          summary: {
            total: topics.length,
            pending: topics.filter((t) => t.status === "pending").length,
            inProgress: topics.filter((t) => t.status === "in-progress").length,
            completed: topics.filter((t) => t.status === "completed").length,
            overdue: overdue.length,
          },
        });
      },
    },
    // PATCH /study/topics/:topicId - Update study topic status/progress
    {
      method: "patch",
      props: "/topics/:topicId",
      authorization: "required",
      rateLimit: "strict",
      keyType: "user",
      middlewares: [requireRole("student")],
      handler: async (req: Request, res: Response, _next: NextFunction) => {
        const { topicId } = req.params;
        const studentId = req.user.id;
        const { status, aiProgress } = req.body;

        const topic = await StudyTopic.findOne({ _id: topicId, student: studentId });
        if (!topic) throw new NotFoundError("Study topic not found");

        if (status) {
          if (!["pending", "in-progress", "completed"].includes(status)) {
            throw new BadRequestError("Invalid status");
          }
          topic.status = status;
          if (status === "completed") {
            topic.completedAt = new Date();
            topic.aiProgress = 100;
          }
        }

        if (aiProgress !== undefined) {
          topic.aiProgress = Math.min(100, Math.max(0, aiProgress));
        }

        await topic.save();
        res.json({ message: "Topic updated", topic });
      },
    },
    // POST /study/topics/:topicId/learn - Get AI teaching content for a topic
    {
      method: "post",
      props: "/topics/:topicId/learn",
      authorization: "required",
      rateLimit: "strict",
      keyType: "user",
      middlewares: [requireRole("student")],
      handler: async (req: Request, res: Response, _next: NextFunction) => {
        const { topicId } = req.params;
        const studentId = req.user.id;

        const topic = await StudyTopic.findOne({ _id: topicId, student: studentId });
        if (!topic) throw new NotFoundError("Study topic not found");

        if (!topic.pptUrl) {
          throw new BadRequestError("No PPT available for this topic");
        }

        // Mark as in-progress
        if (topic.status === "pending") {
          topic.status = "in-progress";
          await topic.save();
        }

        // Get AI teaching content from Python server
        const result = await generateTeachingContent(topic.topic, topic.pptUrl, "intermediate");

        if (!result.success) {
          res.status(503).json({
            message: "AI teaching service unavailable",
            error: result.error,
          });
          return;
        }

        res.json({
          topic: topic.topic,
          content: result.data,
        });
      },
    },
  ],
};

export default studyRouter;
