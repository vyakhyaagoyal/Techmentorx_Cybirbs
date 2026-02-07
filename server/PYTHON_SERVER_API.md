# Python AI/ML Server API Endpoints

> **Status**: Mock endpoints — update URLs and request/response formats when the Python server is implemented.
>
> **Base URL**: `http://localhost:8000` (configurable via `PYTHON_SERVER_URL` in `.env`)

---

## 1. Quiz Generation from PPT

Generate quiz questions using LLM from teacher-uploaded PPT content.

### `POST /api/quiz/generate`

**Request Body:**
```json
{
  "pptUrl": "string — URL/path to uploaded PPT file",
  "topicsCovered": ["string — list of topics covered in the lecture"]
}
```

**Response:**
```json
{
  "questions": [
    {
      "question": "What is the time complexity of binary search?",
      "options": ["O(n)", "O(log n)", "O(n^2)", "O(1)"],
      "correctAnswer": 1,
      "topic": "Binary Search"
    }
  ]
}
```

---

## 2. OpenCV Engagement Processing

Process lecture video/stream for student engagement analysis using OpenCV.

### `POST /api/engagement/process`

**Request Body:**
```json
{
  "lectureId": "string — MongoDB ObjectId of the lecture",
  "videoUrl": "string — URL/path to lecture video or live stream endpoint"
}
```

**Response:**
```json
{
  "topicSegments": [
    {
      "topic": "Binary Search",
      "startTime": 0,
      "endTime": 15,
      "avgEngagement": 72.5
    }
  ],
  "studentEngagements": [
    {
      "studentId": "string — MongoDB ObjectId",
      "attentionScore": 85,
      "engagementLevel": "high"
    }
  ],
  "overallAvgEngagement": 68.3,
  "lowEngagementTopics": ["Recursion", "Dynamic Programming"]
}
```

**Notes:**
- `engagementLevel` values: `"high"` (>70), `"medium"` (40-70), `"low"` (<40)
- `startTime`/`endTime` are in minutes from lecture start
- The Python server can also push data via webhook: `POST /engagement/webhook` on the Express server

---

## 3. AI Teaching Content Generation

Generate teaching content from PPT for topics where students are lagging.

### `POST /api/ai-teach/generate`

**Request Body:**
```json
{
  "topic": "string — the weak topic to teach",
  "pptUrl": "string — URL/path to the PPT covering this topic",
  "studentLevel": "string — 'beginner' | 'intermediate' | 'advanced'"
}
```

**Response:**
```json
{
  "content": "string — markdown/HTML formatted teaching content",
  "exercises": [
    {
      "question": "Explain how binary search works step by step.",
      "answer": "Binary search works by..."
    }
  ],
  "summary": "string — brief summary of the topic"
}
```

---

## 4. Mental Health — Mood Analysis

Analyze chatbot conversation responses to determine student mood and mental state.

### `POST /api/mental-health/analyze`

**Request Body:**
```json
{
  "studentId": "string — MongoDB ObjectId",
  "responses": {
    "How are you feeling today?": "I'm feeling a bit overwhelmed with exams",
    "How well did you sleep last night?": "Not great, maybe 4 hours",
    "What's causing you the most stress?": "Upcoming deadlines and assignments"
  }
}
```

**Response:**
```json
{
  "mood": "low",
  "stressLevel": 7,
  "insights": [
    "Student appears to be experiencing exam-related stress",
    "Sleep patterns suggest fatigue and anxiety"
  ],
  "recommendations": [
    "Consider breaking study sessions into smaller blocks",
    "Try the breathing exercises in the wellness section"
  ]
}
```

**Notes:**
- `mood` values: `"great"`, `"good"`, `"okay"`, `"low"`, `"bad"`
- `stressLevel`: 1 (low) to 10 (high)

---

## 5. Monthly Mental Health Report

Generate a comprehensive monthly mental health report from accumulated mood data.

### `POST /api/mental-health/monthly-report`

**Request Body:**
```json
{
  "studentId": "string — MongoDB ObjectId",
  "month": 2,
  "year": 2026
}
```

**Response:**
```json
{
  "averageMood": "okay",
  "averageStress": 5.2,
  "averageSleep": 6.5,
  "insights": [
    "Overall mood has improved compared to last month",
    "Stress peaks correlate with quiz deadlines",
    "Sleep duration is below recommended 7-8 hours"
  ],
  "recommendations": [
    "Continue engaging with brain-training games",
    "Establish a consistent sleep schedule",
    "Consider speaking with a counselor about exam anxiety"
  ]
}
```

---

## Integration Notes

### How the Express server communicates with Python:

1. **Outbound calls** (Express → Python): via `src/lib/pythonClient.ts`
   - Quiz generation after a teacher creates a lecture with PPT
   - Engagement processing trigger
   - Mental health chatbot analysis
   - Monthly report generation

2. **Inbound webhooks** (Python → Express): via route endpoints
   - `POST /engagement/webhook` — Python server pushes engagement results after processing

### Environment Variable

```
PYTHON_SERVER_URL=http://localhost:8000
```

### Error Handling

If the Python server is unreachable, the Express server will:
- Return a `503 Service Unavailable` with an error message
- Log the failure to console
- Continue operating for non-AI features

---

## Data Flow Summary

```
Teacher uploads PPT → Express stores Lecture → Express calls Python /api/quiz/generate
                                              → Python returns questions
                                              → Express creates Quiz in MongoDB

Lecture video feed  → Express calls Python /api/engagement/process
                    → Python runs OpenCV analysis
                    → Python returns engagement data (or pushes via webhook)
                    → Express stores EngagementData in MongoDB
                    → Teacher views low-engagement topics to repeat

Student takes quiz  → Express grades it → identifies weak topics
                    → Creates StudyTopics with 1-week deadline
                    → Student requests AI teaching → Express calls Python /api/ai-teach/generate
                    → Student learns from AI content

Student uses chatbot → Express sends responses to Python /api/mental-health/analyze
                     → Python returns mood analysis
                     → Express stores in MentalHealthReport
                     → Monthly report generated via Python /api/mental-health/monthly-report
```
