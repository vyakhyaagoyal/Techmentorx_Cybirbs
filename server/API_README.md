# TechMentorX API — Backend Endpoints

> **Base URL**: `http://localhost:5000` (development)
>
> **Auth**: All protected endpoints require `Authorization: Bearer <token>` header.
>
> **Roles**: `student` or `teacher` — set during registration.

---

## Authentication

### `POST /auth/register`

Register a new student or teacher account.

**Auth**: None

**Request Body**:
| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | Yes | Full name |
| `email` | string | Yes | Must be unique |
| `password` | string | Yes | Min 6 characters |
| `role` | string | Yes | `"student"` or `"teacher"` |
| `department` | string | Yes | e.g. `"Computer Science"` |
| `enrollmentId` | string | Students only | Unique student enrollment ID |
| `semester` | number | Students only | Current semester number |
| `employeeId` | string | Teachers only | Unique employee ID |

**Response** `201`:
```json
{
  "message": "Registration successful",
  "token": "jwt_token_string",
  "user": {
    "id": "mongo_object_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student",
    "department": "Computer Science"
  }
}
```

---

### `POST /auth/login`

Login with email and password.

**Auth**: None

**Request Body**:
| Field | Type | Required |
|---|---|---|
| `email` | string | Yes |
| `password` | string | Yes |

**Response** `200`:
```json
{
  "message": "Login successful",
  "token": "jwt_token_string",
  "user": { "id", "name", "email", "role", "department" }
}
```

---

## User Profile

### `GET /me`

Get the current authenticated user's profile.

**Auth**: Required (any role)

**Response** `200`:
```json
{
  "id": "...",
  "email": "...",
  "role": "student",
  "name": "John Doe",
  "department": "Computer Science",
  "enrollmentId": "CS2024001",
  "semester": 4,
  "subjects": [{ "name": "DSA", "code": "CS301" }],
  "teachingSubjects": []
}
```

---

## Student Dashboard

### `GET /dashboard`

Personal dashboard overview — performance summary, pending study topics.

**Auth**: Required | **Role**: `student`

**Response** `200`:
```json
{
  "student": {
    "name": "...",
    "email": "...",
    "department": "...",
    "semester": 4,
    "enrollmentId": "CS2024001"
  },
  "performance": {
    "overallAverage": 72.5,
    "totalQuizzesTaken": 15,
    "subjectPerformance": [
      {
        "subjectId": "...",
        "subjectName": "DSA",
        "averageScore": 65.0,
        "quizzesTaken": 5
      }
    ]
  },
  "pendingStudyTopics": [
    {
      "topic": "Binary Search",
      "subject": { "name": "DSA", "code": "CS301" },
      "status": "pending",
      "deadline": "2026-02-14T00:00:00Z",
      "aiProgress": 0
    }
  ]
}
```

---

### `GET /dashboard/standing`

Where the student stands in the department — percentile-based (no actual rank exposed).

**Auth**: Required | **Role**: `student`

**Response** `200`:
```json
{
  "department": "Computer Science",
  "overall": {
    "percentileBehind": 25,
    "message": "You are behind 25% of students overall"
  },
  "subjectWise": [
    {
      "subjectId": "...",
      "subjectName": "DSA",
      "subjectCode": "CS301",
      "percentileBehind": 55,
      "message": "You are behind 55% of students in DSA"
    }
  ]
}
```

---

### `GET /dashboard/graph`

Performance graph data points over time, grouped by subject.

**Auth**: Required | **Role**: `student`

**Response** `200`:
```json
{
  "subjects": [
    {
      "subjectId": "...",
      "subjectName": "DSA",
      "dataPoints": [
        { "date": "2026-01-15T10:00:00Z", "score": 60 },
        { "date": "2026-01-22T10:00:00Z", "score": 75 }
      ]
    }
  ]
}
```

---

## Quizzes

### `GET /quiz/pending`

Get active quizzes the student hasn't taken yet.

**Auth**: Required | **Role**: `student`

**Response** `200`:
```json
{
  "quizzes": [
    {
      "_id": "...",
      "title": "Quiz: Binary Search Lecture",
      "subject": { "name": "DSA", "code": "CS301" },
      "lecture": { "title": "Binary Search", "date": "..." },
      "duration": 20,
      "endsAt": "2026-02-07T15:00:00Z",
      "isActive": true
    }
  ]
}
```

---

### `GET /quiz/:quizId`

Get quiz questions for taking (correct answers are stripped).

**Auth**: Required | **Role**: `student`

**Response** `200`:
```json
{
  "quizId": "...",
  "title": "Quiz: Binary Search Lecture",
  "subject": { "name": "DSA", "code": "CS301" },
  "lecture": { "title": "Binary Search" },
  "duration": 20,
  "endsAt": "2026-02-07T15:00:00Z",
  "totalQuestions": 10,
  "questions": [
    {
      "index": 0,
      "question": "What is the time complexity of binary search?",
      "options": ["O(n)", "O(log n)", "O(n^2)", "O(1)"],
      "topic": "Binary Search"
    }
  ]
}
```

---

### `POST /quiz/:quizId/submit`

Submit quiz answers. Auto-creates study topics for weak areas.

**Auth**: Required | **Role**: `student`

**Request Body**:
| Field | Type | Required | Notes |
|---|---|---|---|
| `answers` | array | Yes | `[{ questionIndex: number, selectedAnswer: number }]` |

**Response** `201`:
```json
{
  "message": "Quiz submitted",
  "result": {
    "score": 70,
    "totalCorrect": 7,
    "totalQuestions": 10,
    "weakTopics": ["Recursion", "Tree Traversal"]
  }
}
```

> **Side effect**: Weak topics are automatically added to the student's "To Study" section with a 1-week deadline.

---

### `GET /quiz/results/history`

Get the student's past quiz results.

**Auth**: Required | **Role**: `student`

**Response** `200`:
```json
{
  "results": [
    {
      "quiz": { "title": "...", "duration": 20 },
      "subject": { "name": "DSA", "code": "CS301" },
      "score": 70,
      "totalCorrect": 7,
      "totalQuestions": 10,
      "weakTopics": ["Recursion"],
      "submittedAt": "2026-02-07T10:30:00Z"
    }
  ]
}
```

---

## Study Topics ("To Study" Section)

### `GET /study/topics`

Get all study topics assigned to the student.

**Auth**: Required | **Role**: `student`

**Query Parameters**:
| Param | Type | Optional | Notes |
|---|---|---|---|
| `status` | string | Yes | Filter: `"pending"`, `"in-progress"`, `"completed"` |
| `subject` | string | Yes | Filter by subject ObjectId |

**Response** `200`:
```json
{
  "topics": [
    {
      "topic": "Binary Search",
      "subject": { "name": "DSA", "code": "CS301" },
      "sourceLecture": { "title": "Searching Algorithms", "date": "..." },
      "status": "pending",
      "deadline": "2026-02-14T00:00:00Z",
      "aiProgress": 0
    }
  ],
  "summary": {
    "total": 5,
    "pending": 2,
    "inProgress": 1,
    "completed": 2,
    "overdue": 0
  }
}
```

---

### `PATCH /study/topics/:topicId`

Update a study topic's status or AI learning progress.

**Auth**: Required | **Role**: `student`

**Request Body**:
| Field | Type | Required | Notes |
|---|---|---|---|
| `status` | string | No | `"pending"`, `"in-progress"`, `"completed"` |
| `aiProgress` | number | No | 0–100, auto-set to 100 if status is `"completed"` |

**Response** `200`:
```json
{ "message": "Topic updated", "topic": { ... } }
```

---

### `POST /study/topics/:topicId/learn`

Get AI-generated teaching content for a weak topic (uses the lecture's PPT).

**Auth**: Required | **Role**: `student`

**Response** `200`:
```json
{
  "topic": "Binary Search",
  "content": {
    "content": "## Binary Search\nBinary search works by...",
    "exercises": [
      { "question": "Explain binary search step by step.", "answer": "..." }
    ],
    "summary": "Binary search is a divide-and-conquer algorithm..."
  }
}
```
> Returns `503` if AI service is unavailable.

---

## Teacher Endpoints

### `GET /teacher/dashboard`

Teacher overview — subjects, recent lectures, student counts.

**Auth**: Required | **Role**: `teacher`

**Response** `200`:
```json
{
  "subjects": [
    {
      "name": "DSA",
      "code": "CS301",
      "students": [{ "name": "...", "email": "..." }]
    }
  ],
  "recentLectures": [
    {
      "title": "Binary Search",
      "subject": { "name": "DSA", "code": "CS301" },
      "date": "2026-02-07T09:00:00Z"
    }
  ],
  "totalSubjects": 3,
  "totalStudents": 120
}
```

---

### `POST /teacher/subjects`

Create a new subject/course.

**Auth**: Required | **Role**: `teacher`

**Request Body**:
| Field | Type | Required |
|---|---|---|
| `name` | string | Yes |
| `code` | string | Yes |
| `department` | string | Yes |
| `semester` | number | Yes |

**Response** `201`:
```json
{ "message": "Subject created", "subject": { ... } }
```

---

### `POST /teacher/subjects/:subjectId/students`

Enroll students in a subject.

**Auth**: Required | **Role**: `teacher`

**Request Body**:
| Field | Type | Required | Notes |
|---|---|---|---|
| `studentIds` | string[] | Yes | Array of student MongoDB ObjectIds |

**Response** `200`:
```json
{ "message": "Students enrolled successfully" }
```

---

### `GET /teacher/subjects/:subjectId/students`

List all enrolled students for a subject.

**Auth**: Required | **Role**: `teacher`

**Response** `200`:
```json
{
  "students": [
    { "name": "...", "email": "...", "enrollmentId": "CS2024001", "semester": 4, "department": "..." }
  ]
}
```

---

### `POST /teacher/lectures`

Create a lecture. If a PPT URL is provided, a 20-minute quiz is auto-generated.

**Auth**: Required | **Role**: `teacher`

**Request Body**:
| Field | Type | Required | Notes |
|---|---|---|---|
| `subjectId` | string | Yes | Subject ObjectId |
| `title` | string | Yes | Lecture title |
| `description` | string | No | Optional description |
| `pptUrl` | string | No | URL/path to PPT — triggers quiz generation |
| `topicsCovered` | string[] | Yes | List of topics taught |
| `date` | string (ISO) | No | Defaults to now |
| `duration` | number | No | Minutes, defaults to 60 |

**Response** `201`:
```json
{
  "message": "Lecture created with quiz",
  "lecture": { ... },
  "quiz": { ... }
}
```

> If `pptUrl` is provided, the server calls the Python AI backend to auto-generate quiz questions from the PPT content.

---

### `GET /teacher/subjects/:subjectId/engagement`

View engagement analytics for a subject. Identifies topics that need repeating.

**Auth**: Required | **Role**: `teacher`

**Response** `200`:
```json
{
  "subject": { "name": "DSA", "code": "CS301" },
  "engagementRecords": [ ... ],
  "topicSummary": [
    { "topic": "Recursion", "avgEngagement": 38.5, "needsRepeat": true },
    { "topic": "Arrays", "avgEngagement": 82.0, "needsRepeat": false }
  ],
  "topicsNeedingRepeat": [
    { "topic": "Recursion", "avgEngagement": 38.5, "needsRepeat": true }
  ]
}
```

---

## Engagement (OpenCV Student Interaction)

### `POST /engagement/process`

Trigger OpenCV engagement analysis for a lecture.

**Auth**: Required | **Role**: `teacher`

**Request Body**:
| Field | Type | Required |
|---|---|---|
| `lectureId` | string | Yes |
| `videoUrl` | string | No |

**Response** `201`:
```json
{ "message": "Engagement data processed", "data": { ... } }
```

---

### `POST /engagement/webhook`

Webhook for the Python server to push engagement data.

**Auth**: None (called by Python server)

**Request Body**:
| Field | Type | Required |
|---|---|---|
| `lectureId` | string | Yes |
| `topicSegments` | array | No |
| `studentEngagements` | array | No |
| `overallAvgEngagement` | number | No |
| `lowEngagementTopics` | string[] | No |

**Response** `201`:
```json
{ "message": "Engagement data received" }
```

---

### `GET /engagement/lecture/:lectureId`

Get engagement data for a specific lecture.

**Auth**: Required | **Role**: `teacher`

**Response** `200`:
```json
{
  "data": {
    "lecture": { "title": "...", "date": "...", "topicsCovered": [...] },
    "subject": { "name": "...", "code": "..." },
    "topicSegments": [
      { "topic": "...", "startTime": 0, "endTime": 15, "avgEngagement": 72.5 }
    ],
    "studentEngagements": [
      { "studentId": "...", "attentionScore": 85, "engagementLevel": "high" }
    ],
    "overallAvgEngagement": 68.3,
    "lowEngagementTopics": ["Recursion"]
  }
}
```

---

### `GET /engagement/subject/:subjectId/low-topics`

Get topics with low student engagement that need repetition.

**Auth**: Required | **Role**: `teacher`

**Response** `200`:
```json
{
  "subject": { "name": "DSA", "code": "CS301" },
  "lowEngagementTopics": [
    { "topic": "Recursion", "avgEngagement": 35.2, "lectureCount": 2 }
  ],
  "recommendation": "Consider repeating these topics in upcoming lectures"
}
```

---

## Mental Health Support

### `POST /mental-health/mood`

Log a daily mood entry.

**Auth**: Required | **Role**: `student`

**Request Body**:
| Field | Type | Required | Notes |
|---|---|---|---|
| `mood` | string | Yes | `"great"`, `"good"`, `"okay"`, `"low"`, `"bad"` |
| `stressLevel` | number | Yes | 1 (low) to 10 (high) |
| `sleepHours` | number | Yes | 0–24 |
| `notes` | string | No | Free-text notes |

**Response** `201`:
```json
{ "message": "Mood entry logged", "entry": { ... } }
```

---

### `POST /mental-health/chatbot`

Submit chatbot conversation responses for AI mood analysis.

**Auth**: Required | **Role**: `student`

**Request Body**:
| Field | Type | Required | Notes |
|---|---|---|---|
| `responses` | object | Yes | `{ "question": "answer" }` pairs |

**Response** `200`:
```json
{
  "message": "Chatbot analysis complete",
  "analysis": {
    "mood": "low",
    "stressLevel": 7,
    "insights": ["Student appears to be experiencing exam-related stress"],
    "recommendations": ["Try the breathing exercises in the wellness section"]
  }
}
```

---

### `POST /mental-health/activity`

Log completion of a brain-training game or wellness activity.

**Auth**: Required | **Role**: `student`

**Request Body**:
| Field | Type | Required | Notes |
|---|---|---|---|
| `type` | string | Yes | `"game"` or `"activity"` |

**Response** `200`:
```json
{ "message": "game logged", "gamesPlayed": 5, "activitiesCompleted": 3 }
```

---

### `GET /mental-health/report`

Get a monthly mental health report.

**Auth**: Required | **Role**: `student`

**Query Parameters**:
| Param | Type | Optional | Notes |
|---|---|---|---|
| `month` | number | Yes | 1–12, defaults to current month |
| `year` | number | Yes | Defaults to current year |

**Response** `200`:
```json
{
  "report": {
    "month": 2,
    "year": 2026,
    "moodEntries": [ ... ],
    "averageMood": "okay",
    "averageStress": 5.2,
    "averageSleep": 6.5,
    "insights": ["Stress peaks correlate with quiz deadlines"],
    "recommendations": ["Establish a consistent sleep schedule"],
    "gamesPlayed": 12,
    "activitiesCompleted": 8
  }
}
```

---

### `POST /mental-health/report/generate`

Generate a monthly report with AI-powered insights.

**Auth**: Required | **Role**: `student`

**Request Body**:
| Field | Type | Required |
|---|---|---|
| `month` | number | No |
| `year` | number | No |

**Response** `200`:
```json
{ "message": "Monthly report generated", "report": { ... } }
```

---

## Chat Conversations (Mental Health Chatbot)

### `POST /chat/conversations`

Create a new chat conversation.

**Auth**: Required | **Role**: `student`

**Response** `201`:
```json
{
  "message": "Conversation created",
  "conversation": {
    "_id": "...",
    "userId": "...",
    "messages": [],
    "extractedMetrics": {
      "anxietyLevel": 0,
      "moodScore": 5,
      "stressLevel": 0,
      "sleepQuality": "fair",
      "motivationLevel": 50,
      "socialEngagement": 50,
      "mainConcerns": []
    },
    "isCrisisFlag": false,
    "crisisKeywords": []
  }
}
```

---

### `GET /chat/conversations`

List all conversations for the student (paginated, messages excluded).

**Auth**: Required | **Role**: `student`

**Query Parameters**:
| Param | Type | Optional | Notes |
|---|---|---|---|
| `page` | number | Yes | Default 1 |
| `limit` | number | Yes | Default 20, max 100 |

**Response** `200`:
```json
{
  "conversations": [ { "_id": "...", "userId": "...", "extractedMetrics": { ... }, "isCrisisFlag": false, "updatedAt": "..." } ],
  "total": 5,
  "page": 1,
  "limit": 20
}
```

---

### `GET /chat/conversations/:conversationId`

Get a single conversation with all messages.

**Auth**: Required | **Role**: `student`

**Response** `200`:
```json
{
  "conversation": {
    "_id": "...",
    "userId": "...",
    "messages": [
      { "role": "user", "content": "I feel stressed", "timestamp": "..." },
      { "role": "assistant", "content": "I understand...", "timestamp": "..." }
    ],
    "extractedMetrics": { ... },
    "isCrisisFlag": false,
    "crisisKeywords": []
  }
}
```

---

### `POST /chat/conversations/:conversationId/messages`

Append a message to a conversation.

**Auth**: Required | **Role**: `student`

**Request Body**:
| Field | Type | Required | Notes |
|---|---|---|---|
| `role` | string | Yes | `"user"` or `"assistant"` |
| `content` | string | Yes | Message text |

**Response** `201`:
```json
{
  "message": "Message added",
  "entry": { "role": "user", "content": "...", "timestamp": "..." }
}
```

---

### `PATCH /chat/conversations/:conversationId/metrics`

Update extracted mental health metrics for a conversation.

**Auth**: Required | **Role**: `student`

**Request Body** (all fields optional):
| Field | Type | Notes |
|---|---|---|
| `anxietyLevel` | number | 0–100 |
| `moodScore` | number | 0–10 |
| `stressLevel` | number | 0–100 |
| `sleepQuality` | string | `"poor"`, `"fair"`, `"good"`, `"excellent"` |
| `motivationLevel` | number | 0–100 |
| `socialEngagement` | number | 0–100 |
| `mainConcerns` | string[] | e.g. `["academic pressure", "sleep issues"]` |

**Response** `200`:
```json
{ "message": "Metrics updated", "extractedMetrics": { ... } }
```

---

### `PATCH /chat/conversations/:conversationId/crisis`

Update crisis flag and keywords for a conversation.

**Auth**: Required | **Role**: `student`

**Request Body**:
| Field | Type | Required | Notes |
|---|---|---|---|
| `isCrisisFlag` | boolean | No | Set crisis state |
| `crisisKeywords` | string[] | No | Words that triggered crisis detection |

**Response** `200`:
```json
{ "message": "Crisis flag updated", "isCrisisFlag": true, "crisisKeywords": ["self-harm"] }
```

---

### `DELETE /chat/conversations/:conversationId`

Delete a conversation.

**Auth**: Required | **Role**: `student`

**Response** `200`:
```json
{ "message": "Conversation deleted" }
```

---

### `GET /chat/conversations/metrics/summary`

Get aggregated mental health metrics across all conversations.

**Auth**: Required | **Role**: `student`

**Response** `200`:
```json
{
  "summary": {
    "totalConversations": 12,
    "avgAnxiety": 35.5,
    "avgMood": 6.2,
    "avgStress": 42.0,
    "avgMotivation": 55.0,
    "avgSocialEngagement": 60.0,
    "allConcerns": ["academic pressure", "sleep issues"],
    "crisisCount": 1,
    "latestMetrics": { ... }
  }
}
```

---

## Quiz Generation (Gemini AI)

### `POST /generate-quiz`

Upload a lecture file (PPT, PDF, DOCX, etc.) and generate a quiz using Google Gemini free-tier API. The file is **not stored** — it is sent directly to Gemini in memory, questions are generated, and the quiz is saved and made available to every student enrolled in the subject (visible via `GET /quiz/pending`).

A companion `Lecture` record is also created automatically.

**Auth**: Required | **Role**: `teacher`

**Content-Type**: `multipart/form-data`

**Form Fields**:
| Field | Type | Required | Notes |
|---|---|---|---|
| `file` | file | Yes | PPT, PPTX, PDF, DOC, DOCX, TXT, PNG, JPG — max 50 MB |
| `subjectId` | string | Yes | Subject ObjectId |
| `title` | string | Yes | Lecture / quiz title |
| `topicsCovered` | string (JSON) | Yes | JSON array, e.g. `["Recursion","Trees"]` |
| `numQuestions` | number | No | Default 10 |
| `duration` | number | No | Quiz duration in minutes (default 20) |

**Example (curl)**:
```bash
curl -X POST http://localhost:5000/generate-quiz \
  -H "Authorization: Bearer <token>" \
  -F "file=@lecture.pptx" \
  -F 'subjectId=665a...' \
  -F 'title=Binary Search Lecture' \
  -F 'topicsCovered=["Binary Search","Divide and Conquer"]' \
  -F 'numQuestions=10'
```

**Response** `201`:
```json
{
  "message": "Quiz generated and assigned to all students of this subject",
  "quiz": {
    "_id": "...",
    "title": "Quiz: Binary Search Lecture",
    "questionsCount": 10,
    "duration": 20,
    "startsAt": "2026-02-07T10:00:00.000Z",
    "endsAt": "2026-02-08T10:00:00.000Z",
    "subjectId": "665a..."
  },
  "lecture": {
    "_id": "...",
    "title": "Binary Search Lecture"
  }
}
```

**Errors**:
| Status | Reason |
|---|---|
| `400` | Missing file, subjectId, title, or topicsCovered |
| `404` | Subject not found or teacher doesn't own it |
| `500` | Gemini API failure or malformed AI response |

> **How it works**: The uploaded file buffer is sent to Gemini's multimodal API. Gemini reads the content, generates MCQs targeting the given topics, and returns structured JSON. The quiz is active for 24 hours.

---

## Teacher Analytics

### `GET /teacher/analytics/overview`
**Auth**: Required (teacher only)

Returns high-level statistics across all of the teacher's subjects.

**Response**:
```json
{
  "overview": {
    "totalSubjects": 3,
    "totalStudents": 45,
    "totalQuizSubmissions": 120,
    "overallAverageScore": 72.5
  },
  "subjectStats": [
    {
      "subjectId": "...",
      "subjectName": "Data Structures",
      "subjectCode": "CS201",
      "totalStudents": 15,
      "totalQuizResults": 40,
      "averageScore": 74.2,
      "highestScore": 100,
      "lowestScore": 20,
      "weakTopics": [
        { "topic": "Binary Trees", "failCount": 8 }
      ]
    }
  ],
  "recentResults": [
    {
      "student": { "name": "John", "enrollmentId": "CS2023001" },
      "quiz": "DSA Week 3",
      "subject": "Data Structures",
      "score": 65,
      "weakTopics": ["Recursion"],
      "submittedAt": "2025-01-15T10:30:00Z"
    }
  ]
}
```

---

### `GET /teacher/analytics/subjects/:subjectId`
**Auth**: Required (teacher only)

Returns detailed per-student performance for a specific subject, including quiz history and class-wide weak topics.

**Response**:
```json
{
  "subject": { "_id": "...", "name": "Data Structures", "code": "CS201", "totalEnrolled": 15 },
  "classAverage": 74.2,
  "studentPerformance": [
    {
      "studentId": "...",
      "name": "Alice",
      "email": "alice@example.com",
      "enrollmentId": "CS2023005",
      "quizzesTaken": 4,
      "averageScore": 82.5,
      "highestScore": 95,
      "lowestScore": 60,
      "trend": "up",
      "weakTopics": [{ "topic": "Graph Traversal", "count": 2 }]
    }
  ],
  "quizzes": [
    { "_id": "...", "title": "DSA Week 3", "submissions": 12, "averageScore": 71 }
  ],
  "classWeakTopics": [
    { "topic": "Dynamic Programming", "studentsStruggling": 8, "percentageStruggling": 53 }
  ]
}
```

---

### `GET /teacher/analytics/quiz/:quizId`
**Auth**: Required (teacher only)

Returns per-quiz analytics including question-by-question breakdown and all student results.

**Response**:
```json
{
  "quiz": {
    "_id": "...",
    "title": "DSA Week 3",
    "subject": { "name": "Data Structures", "code": "CS201" },
    "duration": 20,
    "totalQuestions": 10,
    "isActive": false
  },
  "stats": {
    "totalSubmissions": 12,
    "averageScore": 71,
    "highestScore": 100,
    "lowestScore": 30,
    "passRate": 75
  },
  "questionStats": [
    {
      "questionIndex": 0,
      "question": "What is the time complexity of BFS?",
      "topic": "Graph Traversal",
      "correctAnswer": 2,
      "totalAttempts": 12,
      "correctCount": 8,
      "accuracy": 67,
      "optionDistribution": [
        { "option": "O(n)", "count": 2, "isCorrect": false },
        { "option": "O(n^2)", "count": 2, "isCorrect": false },
        { "option": "O(V+E)", "count": 8, "isCorrect": true },
        { "option": "O(log n)", "count": 0, "isCorrect": false }
      ]
    }
  ],
  "studentResults": [
    {
      "studentId": "...",
      "name": "Alice",
      "email": "alice@example.com",
      "enrollmentId": "CS2023005",
      "score": 90,
      "totalCorrect": 9,
      "totalQuestions": 10,
      "weakTopics": ["Dynamic Programming"],
      "submittedAt": "2025-01-15T10:30:00Z"
    }
  ]
}
```

---

## Error Responses

All errors follow this format:
```json
{ "error": { "message": "Error description", "code": "ERROR_CODE", "status": 400 } }
```

| Status | Code | Meaning |
|---|---|---|
| `400` | `BAD_REQUEST` | Missing or invalid fields |
| `401` | `UNAUTHORIZED` | Missing or invalid JWT token |
| `403` | `FORBIDDEN` | Wrong role for this endpoint |
| `404` | `NOT_FOUND` | Resource not found |
| `429` | — | Rate limit exceeded |
| `503` | — | AI/Python service unavailable |
