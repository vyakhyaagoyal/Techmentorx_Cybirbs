import mongoose, { Schema, Document } from "mongoose";

export interface IChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface IExtractedMetrics {
  anxietyLevel: number;       // 0-100
  moodScore: number;          // 0-10
  stressLevel: number;        // 0-100
  sleepQuality: "poor" | "fair" | "good" | "excellent";
  motivationLevel: number;    // 0-100
  socialEngagement: number;   // 0-100
  mainConcerns: string[];
}

export interface IChatConversation extends Document {
  userId: string;
  messages: IChatMessage[];
  extractedMetrics: IExtractedMetrics;
  isCrisisFlag: boolean;
  crisisKeywords: string[];
  createdAt: Date;
  updatedAt: Date;
}

const chatMessageSchema = new Schema<IChatMessage>(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false },
);

const extractedMetricsSchema = new Schema<IExtractedMetrics>(
  {
    anxietyLevel: { type: Number, min: 0, max: 100, default: 0 },
    moodScore: { type: Number, min: 0, max: 10, default: 5 },
    stressLevel: { type: Number, min: 0, max: 100, default: 0 },
    sleepQuality: {
      type: String,
      enum: ["poor", "fair", "good", "excellent"],
      default: "fair",
    },
    motivationLevel: { type: Number, min: 0, max: 100, default: 50 },
    socialEngagement: { type: Number, min: 0, max: 100, default: 50 },
    mainConcerns: [{ type: String }],
  },
  { _id: false },
);

const chatConversationSchema = new Schema<IChatConversation>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    messages: [chatMessageSchema],
    extractedMetrics: {
      type: extractedMetricsSchema,
      default: () => ({}),
    },
    isCrisisFlag: { type: Boolean, default: false },
    crisisKeywords: [{ type: String }],
  },
  { timestamps: true },
);

// Index for fast user conversation lookups
chatConversationSchema.index({ userId: 1, updatedAt: -1 });

export const ChatConversation = mongoose.model<IChatConversation>(
  "ChatConversation",
  chatConversationSchema,
);
