/**
 * POST /generate-quiz
 *
 * Teacher uploads a lecture file (PPT, PDF, DOCX …) →
 * Gemini reads it and generates MCQ questions →
 * A Quiz (+ Lecture) record is created and automatically available
 * to every student enrolled in that subject via GET /quiz/pending.
 *
 * The file is kept in memory only and never persisted.
 */

import type { Request, Response, NextFunction } from "express";
import type { RouterObject } from "../../types/router.js";
import multer from "multer";
import { requireRole } from "../lib/requireRole.js";
import { generateQuizFromFile } from "../lib/geminiClient.js";
import { Subject } from "../models/Subject.js";
import { Lecture } from "../models/Lecture.js";
import { Quiz } from "../models/Quiz.js";
import { BadRequestError, NotFoundError } from "../errors/httpErrors.js";

// ── multer: memory-only storage ──────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "application/pdf",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "image/png",
      "image/jpeg",
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Unsupported file type. Allowed: PDF, PPT, PPTX, DOC, DOCX, TXT, PNG, JPG",
        ),
      );
    }
  },
});

const generateQuizRouter: RouterObject = {
  path: "/generate-quiz",
  functions: [
    {
      method: "post",
      authorization: "required",
      rateLimit: "strict",
      keyType: "user",
      middlewares: [requireRole("teacher"), upload.single("file")],
      handler: async (req: Request, res: Response, _next: NextFunction) => {
        // ── validate inputs ─────────────────────────────────
        const file = req.file;
        if (!file) {
          throw new BadRequestError(
            "A file is required in the 'file' field (PPT, PDF, DOCX, TXT, PNG, JPG)",
          );
        }

        const { subjectId, title, numQuestions, duration } = req.body;
        let { topicsCovered } = req.body;

        if (!subjectId || !title) {
          throw new BadRequestError("subjectId and title are required");
        }

        // topicsCovered arrives as a JSON string from multipart/form-data
        try {
          topicsCovered =
            typeof topicsCovered === "string"
              ? JSON.parse(topicsCovered)
              : topicsCovered;
        } catch {
          throw new BadRequestError(
            'topicsCovered must be a JSON array of strings, e.g. ["Recursion","Trees"]',
          );
        }

        if (!Array.isArray(topicsCovered) || topicsCovered.length === 0) {
          throw new BadRequestError("topicsCovered must be a non-empty array");
        }

        // ── verify subject ownership ────────────────────────
        const subject = await Subject.findOne({
          _id: subjectId,
          teacher: req.user.id,
        });
        if (!subject) {
          throw new NotFoundError(
            "Subject not found or you are not its teacher",
          );
        }

        // ── call Gemini ─────────────────────────────────────
        const count = numQuestions ? parseInt(numQuestions as string, 10) : 10;
        const questions = await generateQuizFromFile(
          file.buffer,
          file.originalname,
          topicsCovered as string[],
          count,
        );

        // ── create Lecture record ───────────────────────────
        const lecture = new Lecture({
          subject: subjectId,
          teacher: req.user.id,
          title,
          topicsCovered,
          date: new Date(),
          duration: duration ? parseInt(duration as string, 10) : 60,
        });
        await lecture.save();

        // ── create Quiz – active for 24 h ───────────────────
        const now = new Date();
        const quizDuration = duration ? parseInt(duration as string, 10) : 20;
        const endsAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        const quiz = new Quiz({
          lecture: lecture._id,
          subject: subjectId,
          teacher: req.user.id,
          title: `Quiz: ${title}`,
          questions,
          duration: quizDuration,
          isActive: true,
          startsAt: now,
          endsAt,
        });
        await quiz.save();

        // ── respond ─────────────────────────────────────────
        res.status(201).json({
          message:
            "Quiz generated and assigned to all students of this subject",
          quiz: {
            _id: quiz._id,
            title: quiz.title,
            questionsCount: questions.length,
            duration: quiz.duration,
            startsAt: quiz.startsAt,
            endsAt: quiz.endsAt,
            subjectId,
          },
          lecture: {
            _id: lecture._id,
            title: lecture.title,
          },
        });
      },
    },
  ],
};

export default generateQuizRouter;
