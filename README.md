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

## 📁 Project Structure

```
Techmentorx_Cybirbs/
│
├── client/                          # Next.js Frontend
│   ├── app/
│   │   ├── engagement/             # Engagement tracking page
│   │   ├── analytics/              # Teacher analytics dashboard
│   │   ├── generate-quiz/          # Quiz generation interface
│   │   ├── quiz/                   # Student quiz taking interface
│   │   ├── vent-out/               # Mental wellness games
│   │   └── components/             # Shared React components
│   └── package.json
│
├── server/                          # Node.js/TypeScript Backend
│   ├── src/
│   │   ├── routes/                 # API route handlers
│   │   │   ├── engagement.ts       # Engagement endpoints
│   │   │   ├── quiz.ts             # Quiz management
│   │   │   ├── auth.ts             # Authentication
│   │   │   └── ...
│   │   ├── models/                 # MongoDB schemas
│   │   ├── lib/
│   │   │   ├── pythonClient.ts     # Python API integration
│   │   │   └── ...
│   │   └── middlewares/
│   └── package.json
│
└── student_engagement_monitor/     # Python AI/ML Engine
    ├── api_server/
    │   └── main.py                 # FastAPI server
    ├── src/
    │   ├── cctv_pipeline/          # Video processing
    │   │   ├── engagement_processor.py
    │   │   └── student_detector.py
    │   ├── feature_extraction/     # Feature extractors
    │   │   ├── facial_expression_detector.py
    │   │   ├── head_pose_estimator.py
    │   │   ├── hand_movement_detector.py
    │   │   └── phone_usage_detector.py
    │   ├── models/                 # ML model training
    │   │   ├── engagement_classifier.py
    │   │   ├── train_model.py
    │   │   └── evaluate_model.py
    │   └── data_processing/        # Dataset handling
    ├── configs/
    │   └── config.yaml             # System configuration
    ├── scripts/
    │   ├── preprocess_all.py       # Feature extraction
    │   ├── run_inference.py        # CCTV video analysis
    │   └── download_dataset.py     # DAiSEE dataset downloader
    └── requirements.txt            # Python dependencies
```


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
```

---

## 📚 Dataset Acknowledgment

This project uses the **DAiSEE (Dataset for Affective States in E-learning Environments)** for training and evaluating the student engagement monitoring system.


