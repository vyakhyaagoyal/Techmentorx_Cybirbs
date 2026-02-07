import mongoose, { Schema, Document } from "mongoose";

export interface IQuizAnswer {
  questionIndex: number;
  selectedAnswer: number;
  isCorrect: boolean;
  topic: string;
}

export interface IQuizResult extends Document {
  quiz: mongoose.Types.ObjectId;
  student: mongoose.Types.ObjectId;
  subject: mongoose.Types.ObjectId;
  answers: IQuizAnswer[];
  score: number;            // percentage 0-100
  totalCorrect: number;
  totalQuestions: number;
  weakTopics: string[];     // topics where student got wrong answers
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const quizAnswerSchema = new Schema<IQuizAnswer>(
  {
    questionIndex: { type: Number, required: true },
    selectedAnswer: { type: Number, required: true },
    isCorrect: { type: Boolean, required: true },
    topic: { type: String, required: true },
  },
  { _id: false },
);

const quizResultSchema = new Schema<IQuizResult>(
  {
    quiz: {
      type: Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
    },
    student: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    subject: {
      type: Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    answers: [quizAnswerSchema],
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    totalCorrect: {
      type: Number,
      required: true,
    },
    totalQuestions: {
      type: Number,
      required: true,
    },
    weakTopics: [{ type: String }],
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

// Prevent duplicate submissions
quizResultSchema.index({ quiz: 1, student: 1 }, { unique: true });

export const QuizResult = mongoose.model<IQuizResult>("QuizResult", quizResultSchema);
