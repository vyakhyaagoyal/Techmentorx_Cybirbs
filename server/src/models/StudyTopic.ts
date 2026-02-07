import mongoose, { Schema, Document } from "mongoose";

export interface IStudyTopic extends Document {
  student: mongoose.Types.ObjectId;
  subject: mongoose.Types.ObjectId;
  topic: string;
  sourceQuiz: mongoose.Types.ObjectId;
  sourceLecture: mongoose.Types.ObjectId;
  pptUrl?: string;           // PPT from lecture for AI teaching
  status: "pending" | "in-progress" | "completed";
  deadline: Date;            // 1 week from creation
  aiProgress: number;        // 0-100, progress through AI teaching
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const studyTopicSchema = new Schema<IStudyTopic>(
  {
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
    topic: {
      type: String,
      required: true,
      trim: true,
    },
    sourceQuiz: {
      type: Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
    },
    sourceLecture: {
      type: Schema.Types.ObjectId,
      ref: "Lecture",
      required: true,
    },
    pptUrl: {
      type: String,
    },
    status: {
      type: String,
      enum: ["pending", "in-progress", "completed"],
      default: "pending",
    },
    deadline: {
      type: Date,
      required: true,
    },
    aiProgress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    completedAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

// Index for efficient student queries
studyTopicSchema.index({ student: 1, status: 1 });
studyTopicSchema.index({ student: 1, subject: 1 });

export const StudyTopic = mongoose.model<IStudyTopic>("StudyTopic", studyTopicSchema);
