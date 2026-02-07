import mongoose, { Schema, Document } from "mongoose";

export interface ILecture extends Document {
  subject: mongoose.Types.ObjectId;
  teacher: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  pptUrl?: string;           // URL to uploaded PPT (stored path or cloud link)
  topicsCovered: string[];
  date: Date;
  duration: number;          // in minutes
  engagementProcessed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const lectureSchema = new Schema<ILecture>(
  {
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
    description: {
      type: String,
      trim: true,
    },
    pptUrl: {
      type: String,
    },
    topicsCovered: [
      {
        type: String,
        trim: true,
      },
    ],
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    duration: {
      type: Number,
      default: 60,
    },
    engagementProcessed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

export const Lecture = mongoose.model<ILecture>("Lecture", lectureSchema);
