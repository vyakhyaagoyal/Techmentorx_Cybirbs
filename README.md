# LLM-Based Student Monitoring System

An AI-powered academic intelligence platform that continuously tracks student learning progress, engagement, conceptual understanding, and mental well-being — enabling **early intervention, personalized learning, and data-driven teaching decisions at scale**.

---

## 🚀 What is Our Project?

Traditional academic systems only measure **marks and attendance**, missing the deeper picture of:

- Conceptual understanding  
- Engagement during lectures  
- Learning gaps in real time  
- Emotional and mental well-being  

Our system solves this by building a **centralized AI-driven student intelligence dashboard** that:

- Tracks **complete academic progress**
- Detects **learning gaps early**
- Measures **classroom engagement using computer vision**
- Provides **personalized AI teaching**
- Supports **student mental wellness**
- Helps teachers take **timely, data-driven action**

This transforms education from **reactive (after exams)** to **proactive (during learning)**.

---

## 🌟 Core Features

### 1️⃣ Personal Student Performance Dashboard
Each student gets a secure login with:

- Overall academic performance graph  
- Subject-wise progress tracking  
- Anonymous percentile comparison within department  
  - Example: *“Behind 25% students overall, 55% in DSA”*  
- Continuous performance monitoring  

➡ Helps students **self-reflect and improve early** without exposing ranks.

---

### 2️⃣ Early Learning Gap Detection via Daily AI Quizzes
After every lecture:

- Teacher uploads lecture PPT  
- System generates a **20-minute smart quiz**  
- AI analyzes:
  - Incorrect answers  
  - weak concepts  
  - repeated mistakes  

Dashboard automatically updates:

- **“To Study” section** with weak topics  
- **1-week deadline** for improvement  
- **AI-powered topic explanation from lecture PPT**

➡ Ensures **no concept remains unclear for long**.

---

### 3️⃣ Classroom Engagement & Interaction Analysis (Computer Vision)
Using **OpenCV + YOLO + MediaPipe + XGBoost** on the **DAiSEE dataset**, the system:

- Detects:
  - attention level  
  - distraction  
  - drowsiness  
  - engagement patterns  
- Maps engagement **topic-wise per lecture**
- Identifies **topics with lowest interaction**
- Suggests teachers to **revise difficult concepts**

➡ Converts classrooms into **measurable learning environments**, not guesswork.

---

### 4️⃣ Mental Health & Cognitive Wellness Support
Student dashboard includes:

- Brain-engaging mini activities & games  
- AI chatbot for periodic emotional check-ins  
- Behavioral pattern analysis over time  
- **Monthly mood & wellness report**

➡ Promotes **healthy learning mindset**, not just academic scores.

---

## 🔄 System Flow

<!-- Add Flowchart Image Here -->

**High-level flow:**

1. Student attends lecture  
2. Teacher uploads PPT  
3. AI generates quiz  
4. Weak topics detected  
5. Personalized AI learning assigned  
6. Engagement monitored via CV  
7. Dashboard + teacher insights updated  
8. Mental wellness tracked monthly  

---
## File Structure

Techmentorx_Cybirbs/
├── .gitignore
├── README.md
├── client/
│   ├── .gitignore
│   ├── PROJECT_README.md
│   ├── app/
│   │   ├── analytics/
│   │   │   └── page.tsx
│   │   ├── components/
│   │   │   ├── LeafDecoration.tsx
│   │   │   └── Navigation.tsx
│   │   ├── engagement/
│   │   │   └── page.tsx
│   │   ├── favicon.ico
│   │   ├── generate-quiz/
│   │   │   └── page.tsx
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── page.tsx
│   │   ├── quiz/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   ├── teacher-dashboard/
│   │   │   └── page.tsx
│   │   └── vent-out/
│   │       ├── CreativeGame.tsx
│   │       ├── FocusGame.tsx
│   │       ├── MemoryGame.tsx
│   │       ├── MindfulnessGame.tsx
│   │       └── page.tsx
│   ├── eslint.config.mjs
│   ├── next.config.ts
│   ├── package-lock.json
│   ├── package.json
│   ├── postcss.config.mjs
│   ├── public/
│   │   ├── file.svg
│   │   ├── globe.svg
│   │   ├── next.svg
│   │   ├── vercel.svg
│   │   └── window.svg
│   ├── student graph.html
│   ├── teacher.html
│   └── tsconfig.json
├── design/
│   └── README.md
├── server/
│   ├── .gitignore
│   ├── API_README.md
│   ├── PYTHON_SERVER_API.md
│   ├── api.yml
│   ├── package-lock.json
│   ├── package.json
│   ├── pnpm-lock.yaml
│   ├── pnpm-workspace.yaml
│   ├── src/
│   │   ├── app.ts
│   │   ├── errors/
│   │   │   ├── AppError.ts
│   │   │   └── httpErrors.ts
│   │   ├── lib/
│   │   │   ├── auth.ts
│   │   │   ├── db.ts
│   │   │   ├── env.ts
│   │   │   ├── geminiClient.ts
│   │   │   ├── generateJwt.ts
│   │   │   ├── pythonClient.ts
│   │   │   ├── rateLimiter.ts
│   │   │   ├── requireRole.ts
│   │   │   ├── routeHandler.ts
│   │   │   └── verifyJwt.ts
│   │   ├── middlewares/
│   │   │   └── errorHandler.ts
│   │   ├── models/
│   │   │   ├── ChatConversation.ts
│   │   │   ├── EngagementData.ts
│   │   │   ├── Lecture.ts
│   │   │   ├── MentalHealthReport.ts
│   │   │   ├── Quiz.ts
│   │   │   ├── QuizResult.ts
│   │   │   ├── StudyTopic.ts
│   │   │   ├── Subject.ts
│   │   │   └── User.ts
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── chat.ts
│   │   │   ├── dashboard.ts
│   │   │   ├── engagement.ts
│   │   │   ├── generateQuiz.ts
│   │   │   ├── index.ts
│   │   │   ├── me.ts
│   │   │   ├── mentalHealth.ts
│   │   │   ├── quiz.ts
│   │   │   ├── study.ts
│   │   │   ├── teacher.ts
│   │   │   └── teacherAnalytics.ts
│   │   ├── server.ts
│   │   └── utils/
│   │       └── tryCatch.ts
│   ├── tests/
│   │   └── .gitkeep
│   ├── tsconfig.json
│   └── types/
│       ├── express.d.ts
│       ├── responseError.ts
│       └── router.ts
├── student_engagement_monitor/
│   ├── .gitignore
│   ├── QUICKSTART.md
│   ├── README.md
│   ├── api_server/
│   │   └── main.py
│   ├── configs/
│   │   └── config.yaml
│   ├── outputs/
│   │   └── reports/
│   │       └── confusion_matrices.png
│   ├── requirements.txt
│   ├── requirements_api.txt
│   ├── scripts/
│   │   ├── download_dataset.py
│   │   ├── preprocess_all.py
│   │   └── run_inference.py
│   ├── src/
│   │   ├── __init__.py
│   │   ├── cctv_pipeline/
│   │   │   ├── __init__.py
│   │   │   ├── engagement_processor.py
│   │   │   └── student_detector.py
│   │   ├── dashboard/
│   │   │   ├── __init__.py
│   │   │   └── dashboard_app.py
│   │   ├── data_processing/
│   │   │   ├── __init__.py
│   │   │   ├── dataset_loader.py
│   │   │   └── frame_extractor.py
│   │   ├── feature_extraction/
│   │   │   ├── __init__.py
│   │   │   ├── facial_expression_detector.py
│   │   │   ├── feature_aggregator.py
│   │   │   ├── hand_movement_detector.py
│   │   │   ├── head_pose_estimator.py
│   │   │   └── phone_usage_detector.py
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── engagement_classifier.py
│   │   │   ├── evaluate_model.py
│   │   │   └── train_model.py
│   │   └── utils.py
│   └── yolov8n.pt
└── teacher.html

## 🧠 Tech Stack

### Frontend
- **Next.js**
- **Tailwind CSS**

### Backend
- **Node.js**
- **Supabase (Database + Auth + Storage)**

### AI / ML / CV
- **Python**
- **OpenCV**
- **MediaPipe**
- **NumPy**
- **PyTorch Vision**
- **YOLO**
- **XGBoost**
- **Dataset:** DAiSEE  
- **Kaggle** for model training & experimentation

---

## ⚙️ How to Run the Project

```bash
npm install
make 3 terminals
cd client
npm run dev
cd server
npm run dev
cd student_engagement_monitor
python api_server/main.py
