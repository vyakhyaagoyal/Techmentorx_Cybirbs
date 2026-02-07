import mongoose, { Schema, Document } from "mongoose";

export interface IQuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number; // index into options
  topic: string;
}

export interface IQuiz extends Document {
  lecture: mongoose.Types.ObjectId;
  subject: mongoose.Types.ObjectId;
  teacher: mongoose.Types.ObjectId;
  title: string;
  questions: IQuizQuestion[];
  duration: number;         // in minutes (default 20)
  isActive: boolean;
  startsAt: Date;
  endsAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const quizQuestionSchema = new Schema<IQuizQuestion>(
  {
    question: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctAnswer: { type: Number, required: true },
    topic: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const quizSchema = new Schema<IQuiz>(
  {
    lecture: {
      type: Schema.Types.ObjectId,
      ref: "Lecture",
      required: true,
    },
    subject: {
      type: Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    teacher: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    questions: [quizQuestionSchema],
    duration: {
      type: Number,
      default: 20, // 20 minutes after each lecture
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    startsAt: {
      type: Date,
      required: true,
    },
    endsAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true },
);

export const Quiz = mongoose.model<IQuiz>("Quiz", quizSchema);
