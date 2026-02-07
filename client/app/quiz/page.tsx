"use client";

import { useState } from "react";
import { useEffect } from "react";


export default function Quiz() {

  const quiz = {
    subject: "Operating Systems",
    topic: "Process Synchronization",
    duration: 20,
    totalQuestions: 5,
    questions: [
      {
        question:
          "What is the main purpose of a semaphore in process synchronization?",
        options: [
          "To increase processor speed",
          "To control access to shared resources",
          "To allocate memory to processes",
          "To schedule process execution",
        ],
        correct: 1,
      },
      {
        question:
          "Which problem is commonly used to illustrate synchronization issues?",
        options: [
          "Binary Search Problem",
          "Dining Philosophers Problem",
          "Sorting Problem",
          "Shortest Path Problem",
        ],
        correct: 1,
      },
      {
        question: "What does the wait() operation do in a semaphore?",
        options: [
          "Increases the semaphore value",
          "Decreases the semaphore value",
          "Resets the semaphore",
          "Deletes the semaphore",
        ],
        correct: 1,
      },
      {
        question:
          "What is a critical section in the context of process synchronization?",
        options: [
          "A section of code that can be executed by multiple processes simultaneously",
          "A section of code where shared resources are accessed",
          "A section that handles errors",
          "A section that initializes variables",
        ],
        correct: 1,
      },
      {
        question:
          "Which of the following is NOT a solution to the critical section problem?",
        options: [
          "Mutex locks",
          "Semaphores",
          "Peterson's Solution",
          "Bubble Sort",
        ],
        correct: 3,
      },
    ],
  };
  
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(quiz.duration * 60); // in seconds

useEffect(() => {
  if (quizCompleted) return;

  if (timeLeft <= 0) {
    setQuizCompleted(true);
    return;
  }

  const timer = setInterval(() => {
    setTimeLeft((prev) => prev - 1);
  }, 1000);

  return () => clearInterval(timer);
}, [timeLeft, quizCompleted]);

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
};

  // Handle answer selection
  const handleAnswerSelect = (index: number) => {
    setSelectedAnswer(index);
  };

  // Next question
  const handleNextQuestion = () => {
    if (selectedAnswer !== null) {
      setAnswers([...answers, selectedAnswer]);

      if (currentQuestion < quiz.questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
      } else {
        setQuizCompleted(true);
      }
    }
  };

  // Calculate score
  const calculateScore = () => {
    let correct = 0;

    answers.forEach((answer, index) => {
      if (answer === quiz.questions[index].correct) {
        correct++;
      }
    });

    return (correct / quiz.questions.length) * 100;
  };

  // Weak topics
  const getWeakTopics = () => {
    const weak: string[] = [];

    answers.forEach((answer, index) => {
      if (answer !== quiz.questions[index].correct) {
        weak.push(quiz.questions[index].question);
      }
    });

    return weak;
  };

  /* ===============================
     QUIZ COMPLETED SCREEN
  =============================== */

  if (quizCompleted) {
    const score = calculateScore();
    const weakTopics = getWeakTopics();

    return (
      <div className="min-h-screen bg-gray-50">
        <main className="max-w-4xl mx-auto py-6 px-4">

          <div className="bg-white rounded-lg shadow-lg p-8">

            {/* Header */}
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">
                {score >= 80 ? "🎉" : score >= 60 ? "👍" : "📚"}
              </div>

              <h1 className="text-3xl font-bold mb-2">
                Quiz Completed!
              </h1>

              <p className="text-gray-600">
                Here are your results
              </p>
            </div>

            {/* Score */}
            <div className="bg-linear-to-br from-emerald-600 to-teal-600 rounded-lg p-6 text-white mb-8 text-center">
              <div className="text-5xl font-bold mb-2">
                {score.toFixed(0)}%
              </div>
              <div>Your Score</div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">

              <div className="bg-green-50 p-4 rounded text-center">
                <div className="text-2xl font-bold text-green-600">
                  {
                    answers.filter(
                      (a, i) => a === quiz.questions[i].correct
                    ).length
                  }
                </div>
                <div className="text-sm">Correct</div>
              </div>

              <div className="bg-red-50 p-4 rounded text-center">
                <div className="text-2xl font-bold text-red-600">
                  {weakTopics.length}
                </div>
                <div className="text-sm">Incorrect</div>
              </div>

              <div className="bg-blue-50 p-4 rounded text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {quiz.questions.length}
                </div>
                <div className="text-sm">Total</div>
              </div>

            </div>

            {/* Weak Topics */}
            {weakTopics.length > 0 && (
              <div className="bg-yellow-50 p-6 rounded mb-6">

                <h2 className="font-bold mb-3">
                  🎯 Topics To Revise
                </h2>

                <ul className="space-y-2">
                  {weakTopics.map((t, i) => (
                    <li key={i}>• {t}</li>
                  ))}
                </ul>

              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-4">

              <button
                onClick={() => (window.location.href = "/")}
                className="flex-1 py-3 bg-gray-200 rounded font-semibold"
              >
                Dashboard
              </button>

              <button
                onClick={() => {
  setCurrentQuestion(0);
  setAnswers([]);
  setSelectedAnswer(null);
  setQuizCompleted(false);
  setTimeLeft(quiz.duration * 60);
}}
                className="flex-1 py-3 bg-emerald-600 text-white rounded font-semibold"
              >
                Retake
              </button>

            </div>

          </div>
        </main>
      </div>
    );
  }

  /* ===============================
     MAIN QUIZ SCREEN
  =============================== */

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto py-6 px-4">

        {/* Intro Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 mb-6">

          <h2 className="font-bold text-blue-900 mb-2">
            📘 Today’s Learning Recap
          </h2>

          <p className="text-sm text-blue-800">
            Your teacher has uploaded today’s PPT based on
            <strong> {quiz.topic}</strong>.  
            This quiz is designed to help you revise and
            remember what you learned in class.
            Let’s check your understanding!
          </p>

        </div>

        {/* Quiz Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">

          <div className="flex justify-between mb-4">

            <div>
              <h1 className="text-2xl font-bold">
                {quiz.subject}
              </h1>

              <p className="text-gray-600">
                {quiz.topic}
              </p>
            </div>

            <div className="text-right">
              <div className="text-3xl font-bold text-emerald-600">
  {formatTime(timeLeft)}
</div>

              <div className="text-sm">
                Time Remaining
              </div>
            </div>

          </div>

          <div className="text-sm text-gray-600 flex justify-between">
            <span>
              Question {currentQuestion + 1} / {quiz.totalQuestions}
            </span>

            <span>
              {quiz.duration} minutes
            </span>
          </div>

        </div>

        {/* Question */}
        <div className="bg-white shadow-lg rounded-lg p-8">

          <h2 className="text-xl font-semibold mb-6">
            {quiz.questions[currentQuestion].question}
          </h2>

          {/* Options */}
          <div className="space-y-4">

            {quiz.questions[currentQuestion].options.map(
              (option, index) => (
                <div
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  className={`border-2 p-4 rounded cursor-pointer ${
                    selectedAnswer === index
                      ? "border-emerald-600 bg-emerald-50"
                      : "border-gray-200"
                  }`}
                >
                  {option}
                </div>
              )
            )}

          </div>

          {/* Buttons */}
          <div className="mt-8 flex justify-between">

            <button
              disabled={currentQuestion === 0}
              onClick={() =>
                setCurrentQuestion(currentQuestion - 1)
              }
              className="px-6 py-3 border rounded disabled:opacity-50"
            >
              Previous
            </button>

            <button
              disabled={selectedAnswer === null}
              onClick={handleNextQuestion}
              className="px-6 py-3 bg-emerald-600 text-white rounded"
            >
              {currentQuestion === quiz.questions.length - 1
                ? "Submit"
                : "Next"}
            </button>

          </div>

        </div>

      </main>
    </div>
  );
}
