import type { Request, Response, NextFunction } from "express";
import type { RouterObject } from "../../types/router.js";
import { requireRole } from "../lib/requireRole.js";
import { ChatConversation } from "../models/ChatConversation.js";
import { BadRequestError, NotFoundError } from "../errors/httpErrors.js";

const chatRouter: RouterObject = {
  path: "/chat",
  functions: [
    // POST /chat/conversations - Create a new conversation
    {
      method: "post",
      props: "/conversations",
      authorization: "required",
      rateLimit: "strict",
      keyType: "user",
      middlewares: [requireRole("student")],
      handler: async (req: Request, res: Response, _next: NextFunction) => {
        const conversation = new ChatConversation({
          userId: req.user.id,
          messages: [],
        });
        await conversation.save();
        res.status(201).json({ message: "Conversation created", conversation });
      },
    },
    // GET /chat/conversations - List all conversations for the student
    {
      method: "get",
      props: "/conversations",
      authorization: "required",
      rateLimit: "read",
      keyType: "user",
      middlewares: [requireRole("student")],
      handler: async (req: Request, res: Response, _next: NextFunction) => {
        const limit = Math.min(Number(req.query.limit) || 20, 100);
        const page = Math.max(Number(req.query.page) || 1, 1);

        const conversations = await ChatConversation.find({ userId: req.user.id })
          .select("-messages")
          .sort({ updatedAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit);

        const total = await ChatConversation.countDocuments({ userId: req.user.id });

        res.json({ conversations, total, page, limit });
      },
    },
    // GET /chat/conversations/:conversationId - Get a single conversation with messages
    {
      method: "get",
      props: "/conversations/:conversationId",
      authorization: "required",
      rateLimit: "read",
      keyType: "user",
      middlewares: [requireRole("student")],
      handler: async (req: Request, res: Response, _next: NextFunction) => {
        const conversation = await ChatConversation.findOne({
          _id: req.params.conversationId,
          userId: req.user.id,
        });
        if (!conversation) throw new NotFoundError("Conversation not found");
        res.json({ conversation });
      },
    },
    // POST /chat/conversations/:conversationId/messages - Append a message
    {
      method: "post",
      props: "/conversations/:conversationId/messages",
      authorization: "required",
      rateLimit: "gameplay",
      keyType: "user",
      middlewares: [requireRole("student")],
      handler: async (req: Request, res: Response, _next: NextFunction) => {
        const { role, content } = req.body;

        if (!role || !content) {
          throw new BadRequestError("role and content are required");
        }
        if (!["user", "assistant"].includes(role)) {
          throw new BadRequestError("role must be 'user' or 'assistant'");
        }

        const conversation = await ChatConversation.findOne({
          _id: req.params.conversationId,
          userId: req.user.id,
        });
        if (!conversation) throw new NotFoundError("Conversation not found");

        conversation.messages.push({
          role,
          content,
          timestamp: new Date(),
        });
        await conversation.save();

        res.status(201).json({
          message: "Message added",
          entry: conversation.messages.at(-1),
        });
      },
    },
    // PATCH /chat/conversations/:conversationId/metrics - Update extracted metrics
    {
      method: "patch",
      props: "/conversations/:conversationId/metrics",
      authorization: "required",
      rateLimit: "gameplay",
      keyType: "user",
      middlewares: [requireRole("student")],
      handler: async (req: Request, res: Response, _next: NextFunction) => {
        const {
          anxietyLevel,
          moodScore,
          stressLevel,
          sleepQuality,
          motivationLevel,
          socialEngagement,
          mainConcerns,
        } = req.body;

        const conversation = await ChatConversation.findOne({
          _id: req.params.conversationId,
          userId: req.user.id,
        });
        if (!conversation) throw new NotFoundError("Conversation not found");

        const m = conversation.extractedMetrics;
        if (anxietyLevel !== undefined) m.anxietyLevel = anxietyLevel;
        if (moodScore !== undefined) m.moodScore = moodScore;
        if (stressLevel !== undefined) m.stressLevel = stressLevel;
        if (sleepQuality !== undefined) m.sleepQuality = sleepQuality;
        if (motivationLevel !== undefined) m.motivationLevel = motivationLevel;
        if (socialEngagement !== undefined) m.socialEngagement = socialEngagement;
        if (mainConcerns !== undefined) m.mainConcerns = mainConcerns;

        await conversation.save();
        res.json({ message: "Metrics updated", extractedMetrics: m });
      },
    },
    // PATCH /chat/conversations/:conversationId/crisis - Update crisis flag
    {
      method: "patch",
      props: "/conversations/:conversationId/crisis",
      authorization: "required",
      rateLimit: "strict",
      keyType: "user",
      middlewares: [requireRole("student")],
      handler: async (req: Request, res: Response, _next: NextFunction) => {
        const { isCrisisFlag, crisisKeywords } = req.body;

        const conversation = await ChatConversation.findOne({
          _id: req.params.conversationId,
          userId: req.user.id,
        });
        if (!conversation) throw new NotFoundError("Conversation not found");

        if (isCrisisFlag !== undefined) conversation.isCrisisFlag = isCrisisFlag;
        if (crisisKeywords !== undefined) conversation.crisisKeywords = crisisKeywords;

        await conversation.save();
        res.json({
          message: "Crisis flag updated",
          isCrisisFlag: conversation.isCrisisFlag,
          crisisKeywords: conversation.crisisKeywords,
        });
      },
    },
    // DELETE /chat/conversations/:conversationId - Delete a conversation
    {
      method: "delete",
      props: "/conversations/:conversationId",
      authorization: "required",
      rateLimit: "strict",
      keyType: "user",
      middlewares: [requireRole("student")],
      handler: async (req: Request, res: Response, _next: NextFunction) => {
        const result = await ChatConversation.findOneAndDelete({
          _id: req.params.conversationId,
          userId: req.user.id,
        });
        if (!result) throw new NotFoundError("Conversation not found");
        res.json({ message: "Conversation deleted" });
      },
    },
    // GET /chat/conversations/metrics/summary - Aggregated metrics across conversations
    {
      method: "get",
      props: "/conversations/metrics/summary",
      authorization: "required",
      rateLimit: "read",
      keyType: "user",
      middlewares: [requireRole("student")],
      handler: async (req: Request, res: Response, _next: NextFunction) => {
        const conversations = await ChatConversation.find({ userId: req.user.id })
          .select("extractedMetrics isCrisisFlag crisisKeywords updatedAt")
          .sort({ updatedAt: -1 });

        if (conversations.length === 0) {
          res.json({ summary: null, message: "No conversations found" });
          return;
        }

        const count = conversations.length;
        const avg = (arr: number[]) =>
          Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 100) / 100;

        const allConcerns = new Set<string>();
        const crisisCount = conversations.filter((c) => c.isCrisisFlag).length;

        for (const c of conversations) {
          for (const concern of c.extractedMetrics.mainConcerns) {
            allConcerns.add(concern);
          }
        }

        res.json({
          summary: {
            totalConversations: count,
            avgAnxiety: avg(conversations.map((c) => c.extractedMetrics.anxietyLevel)),
            avgMood: avg(conversations.map((c) => c.extractedMetrics.moodScore)),
            avgStress: avg(conversations.map((c) => c.extractedMetrics.stressLevel)),
            avgMotivation: avg(conversations.map((c) => c.extractedMetrics.motivationLevel)),
            avgSocialEngagement: avg(conversations.map((c) => c.extractedMetrics.socialEngagement)),
            allConcerns: [...allConcerns],
            crisisCount,
            latestMetrics: conversations[0]?.extractedMetrics,
          },
        });
      },
    },
  ],
};

export default chatRouter;
