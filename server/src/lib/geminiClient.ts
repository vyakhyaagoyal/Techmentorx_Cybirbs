/**
 * Gemini AI Client
 *
 * Uses Google Gemini free-tier API to generate quizzes from uploaded
 * lecture files (PPT, PDF, DOCX, images, etc.).
 *
 * The file buffer is sent inline to Gemini's multimodal model —
 * no file storage is required.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import path from "path";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export interface GeneratedQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  topic: string;
}

/**
 * Convert a raw buffer into Gemini's inline-data format.
 */
function bufferToGenerativePart(buffer: Buffer, mimeType: string) {
  return {
    inlineData: {
      data: buffer.toString("base64"),
      mimeType,
    },
  };
}

/**
 * Resolve MIME type from a filename extension.
 */
function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const map: Record<string, string> = {
    ".pdf": "application/pdf",
    ".ppt": "application/vnd.ms-powerpoint",
    ".pptx":
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ".doc": "application/msword",
    ".docx":
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".txt": "text/plain",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
  };
  return map[ext] || "application/octet-stream";
}

/**
 * Generate quiz questions from an uploaded file using Google Gemini.
 *
 * @param fileBuffer   Raw file bytes (straight from multer memory storage)
 * @param originalName Original filename — used for MIME detection
 * @param topicsCovered Topics the teacher expects the quiz to cover
 * @param numQuestions  How many MCQs to generate (default 10)
 */
export async function generateQuizFromFile(
  fileBuffer: Buffer,
  originalName: string,
  topicsCovered: string[],
  numQuestions: number = 10,
): Promise<GeneratedQuestion[]> {
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || "gemini-2.0-flash",
  });

  const mimeType = getMimeType(originalName);
  const filePart = bufferToGenerativePart(fileBuffer, mimeType);

  const prompt = `You are an expert educator creating a quiz for college students.

Analyze the uploaded lecture file and generate exactly ${numQuestions} multiple-choice questions.

**Topics the teacher covered**: ${topicsCovered.join(", ")}

**Rules**:
1. Each question must have exactly 4 options.
2. "correctAnswer" is the zero-based index (0-3) of the correct option.
3. Assign each question to the most relevant topic from the list above.
4. Questions should test understanding and application — NOT rote memorization.
5. Vary difficulty: ~30 % easy, ~50 % medium, ~20 % hard.
6. Return ONLY valid JSON — no markdown fences, no commentary.

**Required JSON format**:
[
  {
    "question": "What is the primary advantage of binary search over linear search?",
    "options": ["O(n) time", "O(log n) time", "O(1) time", "O(n²) time"],
    "correctAnswer": 1,
    "topic": "Searching Algorithms"
  }
]`;

  const result = await model.generateContent([prompt, filePart]);
  const text = result.response.text().trim();

  // Strip markdown code fences if Gemini wraps them anyway
  let jsonText = text;
  if (jsonText.startsWith("```")) {
    jsonText = jsonText
      .replace(/^```(?:json)?\n?/, "")
      .replace(/\n?```$/, "");
  }

  const questions: GeneratedQuestion[] = JSON.parse(jsonText);

  // Basic shape validation
  for (const q of questions) {
    if (
      !q.question ||
      !Array.isArray(q.options) ||
      q.options.length !== 4 ||
      typeof q.correctAnswer !== "number" ||
      q.correctAnswer < 0 ||
      q.correctAnswer > 3 ||
      !q.topic
    ) {
      throw new Error("Gemini returned malformed question data");
    }
  }

  return questions;
}
