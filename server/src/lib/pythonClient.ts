/**
 * Mock Python Server Client
 *
 * Communicates with the Python AI/ML server for:
 * - Quiz generation from PPTs (LLM)
 * - OpenCV engagement analysis
 * - Mental health chatbot analysis
 * - AI topic teaching content
 *
 * See PYTHON_SERVER_API.md for endpoint documentation.
 * Replace PYTHON_SERVER_URL in .env when the Python server is ready.
 */

const PYTHON_URL = process.env.PYTHON_SERVER_URL || "http://localhost:8000";

interface PythonResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

async function pythonFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<PythonResponse<T>> {
  try {
    const res = await fetch(`${PYTHON_URL}${endpoint}`, {
      headers: { "Content-Type": "application/json", ...options.headers },
      ...options,
    });
    const data = await res.json();
    return { success: res.ok, data: data as T };
  } catch (error) {
    console.error(`[PythonClient] ${endpoint} failed:`, error);
    return {
      success: false,
      error: `Python server unreachable at ${PYTHON_URL}${endpoint}`,
    };
  }
}

/** Generate quiz questions from a PPT file */
export async function generateQuizFromPPT(pptUrl: string, topicsCovered: string[]) {
  return pythonFetch<{
    questions: {
      question: string;
      options: string[];
      correctAnswer: number;
      topic: string;
    }[];
  }>("/api/quiz/generate", {
    method: "POST",
    body: JSON.stringify({ pptUrl, topicsCovered }),
  });
}

/** Process lecture video/feed for engagement analysis */
export async function processEngagement(lectureId: string, videoUrl: string) {
  return pythonFetch<{
    topicSegments: {
      topic: string;
      startTime: number;
      endTime: number;
      avgEngagement: number;
    }[];
    studentEngagements: {
      studentId: string;
      attentionScore: number;
      engagementLevel: "high" | "medium" | "low";
    }[];
    overallAvgEngagement: number;
    lowEngagementTopics: string[];
  }>("/api/engagement/process", {
    method: "POST",
    body: JSON.stringify({ lectureId, videoUrl }),
  });
}

/** Generate AI teaching content for a weak topic from PPT */
export async function generateTeachingContent(
  topic: string,
  pptUrl: string,
  studentLevel: string,
) {
  return pythonFetch<{
    content: string;
    exercises: { question: string; answer: string }[];
    summary: string;
  }>("/api/ai-teach/generate", {
    method: "POST",
    body: JSON.stringify({ topic, pptUrl, studentLevel }),
  });
}

/** Analyze chatbot responses for mental health insights */
export async function analyzeMoodResponses(
  studentId: string,
  responses: Record<string, string>,
) {
  return pythonFetch<{
    mood: "great" | "good" | "okay" | "low" | "bad";
    stressLevel: number;
    insights: string[];
    recommendations: string[];
  }>("/api/mental-health/analyze", {
    method: "POST",
    body: JSON.stringify({ studentId, responses }),
  });
}

/** Generate monthly mental health report */
export async function generateMonthlyReport(
  studentId: string,
  month: number,
  year: number,
) {
  return pythonFetch<{
    averageMood: string;
    averageStress: number;
    averageSleep: number;
    insights: string[];
    recommendations: string[];
  }>("/api/mental-health/monthly-report", {
    method: "POST",
    body: JSON.stringify({ studentId, month, year }),
  });
}
