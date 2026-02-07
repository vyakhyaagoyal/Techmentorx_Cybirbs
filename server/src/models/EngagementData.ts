import mongoose, { Schema, Document } from "mongoose";

export interface IStudentEngagement {
  studentId: mongoose.Types.ObjectId;
  attentionScore: number;     // 0-100 from OpenCV analysis
  engagementLevel: "high" | "medium" | "low";
}

export interface IEngagementData extends Document {
  lecture: mongoose.Types.ObjectId;
  subject: mongoose.Types.ObjectId;
  topicSegments: {
    topic: string;
    startTime: number;        // minutes from lecture start
    endTime: number;
    avgEngagement: number;    // 0-100 average across all students
  }[];
  studentEngagements: IStudentEngagement[];
  overallAvgEngagement: number;
  lowEngagementTopics: string[];
  processedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const studentEngagementSchema = new Schema(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    attentionScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    engagementLevel: {
      type: String,
      enum: ["high", "medium", "low"],
      required: true,
    },
  },
  { _id: false },
);

const topicSegmentSchema = new Schema(
  {
    topic: { type: String, required: true },
    startTime: { type: Number, required: true },
    endTime: { type: Number, required: true },
    avgEngagement: { type: Number, required: true, min: 0, max: 100 },
  },
  { _id: false },
);

const engagementDataSchema = new Schema<IEngagementData>(
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
    topicSegments: [topicSegmentSchema],
    studentEngagements: [studentEngagementSchema],
    overallAvgEngagement: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    lowEngagementTopics: [{ type: String }],
    processedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

engagementDataSchema.index({ lecture: 1 }, { unique: true });
engagementDataSchema.index({ subject: 1 });

export const EngagementData = mongoose.model<IEngagementData>(
  "EngagementData",
  engagementDataSchema,
);
