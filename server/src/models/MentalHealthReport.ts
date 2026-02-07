import mongoose, { Schema, Document } from "mongoose";

export interface IMoodEntry {
  date: Date;
  mood: "great" | "good" | "okay" | "low" | "bad";
  stressLevel: number;        // 1-10
  sleepHours: number;
  notes?: string;
  chatbotResponses?: Record<string, string>; // question -> answer pairs
}

export interface IMentalHealthReport extends Document {
  student: mongoose.Types.ObjectId;
  month: number;              // 1-12
  year: number;
  moodEntries: IMoodEntry[];
  averageMood: string;
  averageStress: number;
  averageSleep: number;
  insights: string[];         // AI-generated insights
  recommendations: string[];
  gamesPlayed: number;
  activitiesCompleted: number;
  generatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const moodEntrySchema = new Schema<IMoodEntry>(
  {
    date: { type: Date, required: true },
    mood: {
      type: String,
      enum: ["great", "good", "okay", "low", "bad"],
      required: true,
    },
    stressLevel: { type: Number, required: true, min: 1, max: 10 },
    sleepHours: { type: Number, required: true, min: 0, max: 24 },
    notes: { type: String },
    chatbotResponses: { type: Map, of: String },
  },
  { _id: false },
);

const mentalHealthReportSchema = new Schema<IMentalHealthReport>(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
    },
    moodEntries: [moodEntrySchema],
    averageMood: {
      type: String,
      enum: ["great", "good", "okay", "low", "bad"],
    },
    averageStress: { type: Number, min: 1, max: 10 },
    averageSleep: { type: Number, min: 0, max: 24 },
    insights: [{ type: String }],
    recommendations: [{ type: String }],
    gamesPlayed: { type: Number, default: 0 },
    activitiesCompleted: { type: Number, default: 0 },
    generatedAt: { type: Date },
  },
  { timestamps: true },
);

// One report per student per month
mentalHealthReportSchema.index({ student: 1, month: 1, year: 1 }, { unique: true });

export const MentalHealthReport = mongoose.model<IMentalHealthReport>(
  "MentalHealthReport",
  mentalHealthReportSchema,
);
