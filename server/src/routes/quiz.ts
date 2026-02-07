import type { Request, Response, NextFunction } from "express";
import type { RouterObject } from "../../types/router.js";
import { requireRole } from "../lib/requireRole.js";
import { Quiz } from "../models/Quiz.js";
import { QuizResult } from "../models/QuizResult.js";
import { StudyTopic } from "../models/StudyTopic.js";
import { Lecture } from "../models/Lecture.js";
import { BadRequestError, NotFoundError } from "../errors/httpErrors.js";

const quizRouter: RouterObject = {
  path: "/quiz",
  functions: [
    // GET /quiz/pending - Get active quizzes for the student
    {
      method: "get",
      props: "/pending",
      authorization: "required",
      rateLimit: "read",
      keyType: "user",
      middlewares: [requireRole("student")],
      handler: async (req: Request, res: Response, _next: NextFunction) => {
        const studentId = req.user.id;

        // Get quizzes the student hasn't taken yet
        const completedQuizIds = (
          await QuizResult.find({ student: studentId }).select("quiz")
        ).map((r) => r.quiz);

        const now = new Date();
        const pendingQuizzes = await Quiz.find({
          isActive: true,
          endsAt: { $gte: now },
          _id: { $nin: completedQuizIds },
        })
          .populate("subject", "name code")
          .populate("lecture", "title date")
          .sort({ startsAt: -1 });

        res.json({ quizzes: pendingQuizzes });
      },
    },
    // GET /quiz/:quizId - Get quiz questions (without answers) for taking
    {
      method: "get",
      props: "/:quizId",
      authorization: "required",
      rateLimit: "read",
      keyType: "user",
      middlewares: [requireRole("student")],
      handler: async (req: Request, res: Response, _next: NextFunction) => {
        const { quizId } = req.params;
        const studentId = req.user.id;

        const quiz = await Quiz.findById(quizId)
          .populate("subject", "name code")
          .populate("lecture", "title");
        if (!quiz) throw new NotFoundError("Quiz not found");

        // Check if already attempted
        const existing = await QuizResult.findOne({ quiz: quizId, student: studentId });
        if (existing) {
          throw new BadRequestError("You have already submitted this quiz");
        }

        // Strip correct answers before sending
        const questions = quiz.questions.map((q, i) => ({
          index: i,
          question: q.question,
          options: q.options,
          topic: q.topic,
        }));

        res.json({
          quizId: quiz._id,
          title: quiz.title,
          subject: quiz.subject,
          lecture: quiz.lecture,
          duration: quiz.duration,
          endsAt: quiz.endsAt,
          totalQuestions: questions.length,
          questions,
        });
      },
    },
    // POST /quiz/:quizId/submit - Submit quiz answers
    {
      method: "post",
      props: "/:quizId/submit",
      authorization: "required",
      rateLimit: "strict",
      keyType: "user",
      middlewares: [requireRole("student")],
      handler: async (req: Request, res: Response, _next: NextFunction) => {
        const { quizId } = req.params;
        const studentId = req.user.id;
        const { answers } = req.body; // [{ questionIndex, selectedAnswer }]

        if (!answers || !Array.isArray(answers)) {
          throw new BadRequestError("answers array is required");
        }

        const quiz = await Quiz.findById(quizId);
        if (!quiz) throw new NotFoundError("Quiz not found");

        // Check if already submitted
        const existing = await QuizResult.findOne({ quiz: quizId, student: studentId });
        if (existing) throw new BadRequestError("Quiz already submitted");

        // Grade the quiz
        const gradedAnswers = answers.map(
          (a: { questionIndex: number; selectedAnswer: number }) => {
            const question = quiz.questions[a.questionIndex];
            if (!question) return null;
            return {
              questionIndex: a.questionIndex,
              selectedAnswer: a.selectedAnswer,
              isCorrect: a.selectedAnswer === question.correctAnswer,
              topic: question.topic,
            };
          },
        ).filter(Boolean);

        const totalCorrect = gradedAnswers.filter((a: any) => a.isCorrect).length;
        const totalQuestions = quiz.questions.length;
        const score = Math.round((totalCorrect / totalQuestions) * 100);

        // Identify weak topics
        const weakTopics = [
          ...new Set(
            gradedAnswers
              .filter((a: any) => !a.isCorrect)
              .map((a: any) => a.topic),
          ),
        ];

        const quizResult = new QuizResult({
          quiz: quizId,
          student: studentId,
          subject: quiz.subject,
          answers: gradedAnswers,
          score,
          totalCorrect,
          totalQuestions,
          weakTopics,
          submittedAt: new Date(),
        });

        await quizResult.save();

        // Auto-create study topics for weak areas
        if (weakTopics.length > 0) {
          const lecture = await Lecture.findById(quiz.lecture);
          const oneWeekLater = new Date();
          oneWeekLater.setDate(oneWeekLater.getDate() + 7);

          const studyTopics = weakTopics.map((topic) => ({
            student: studentId,
            subject: quiz.subject,
            topic,
            sourceQuiz: quizId,
            sourceLecture: quiz.lecture,
            pptUrl: lecture?.pptUrl,
            status: "pending" as const,
            deadline: oneWeekLater,
          }));

          await StudyTopic.insertMany(studyTopics, { ordered: false }).catch(() => {
            // Ignore duplicate topic entries
          });
        }

        res.status(201).json({
          message: "Quiz submitted",
          result: {
            score,
            totalCorrect,
            totalQuestions,
            weakTopics,
          },
        });
      },
    },
    // GET /quiz/results/history - Get quiz history for student
    {
      method: "get",
      props: "/results/history",
      authorization: "required",
      rateLimit: "read",
      keyType: "user",
      middlewares: [requireRole("student")],
      handler: async (req: Request, res: Response, _next: NextFunction) => {
        const studentId = req.user.id;

        const results = await QuizResult.find({ student: studentId })
          .populate("quiz", "title duration")
          .populate("subject", "name code")
          .sort({ submittedAt: -1 });

        res.json({ results });
      },
    },
  ],
};

export default quizRouter;
