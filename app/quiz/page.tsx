"use client";

import { useState } from "react";

export default function Quiz() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [quizCompleted, setQuizCompleted] = useState(false);

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

  const handleAnswerSelect = (index: number) => {
    setSelectedAnswer(index);
  };

  const handleNextQuestion = () => {
    if (selectedAnswer !== null) {
      const newAnswers = [...answers, selectedAnswer];
      setAnswers(newAnswers);

      if (currentQuestion < quiz.questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
      } else {
        setQuizCompleted(true);
      }
    }
  };

  const calculateScore = () => {
    let correct = 0;
    answers.forEach((answer, index) => {
      if (answer === quiz.questions[index].correct) {
        correct++;
      }
    });
    return (correct / quiz.questions.length) * 100;
  };

  const getWeakTopics = (): string[] => {
    const weak: string[] = [];
    answers.forEach((answer, index) => {
      if (answer !== quiz.questions[index].correct) {
        weak.push(quiz.questions[index].question);
      }
    });
    return weak;
  };

  if (quizCompleted) {
    const score = calculateScore();
    const weakTopics = getWeakTopics();

    return (
      <div className="min-h-screen">
        <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">
                {score >= 80 ? "🎉" : score >= 60 ? "👍" : "📚"}
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Quiz Completed!
              </h1>
              <p className="text-gray-600">Here are your results</p>
            </div>

            <div className="bg-linear-to-br from-emerald-600 to-teal-600 rounded-lg p-6 text-white mb-8">
              <div className="text-center">
                <div className="text-5xl font-bold mb-2">
                  {score.toFixed(0)}%
                </div>
                <div className="text-lg">Your Score</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {
                    answers.filter(
                      (ans, idx) => ans === quiz.questions[idx].correct,
                    ).length
                  }
                </div>
                <div className="text-sm text-gray-600">Correct</div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-600">
                  {weakTopics.length}
                </div>
                <div className="text-sm text-gray-600">Incorrect</div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {quiz.questions.length}
                </div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
            </div>

            {weakTopics.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
                <h2 className="text-lg font-bold text-yellow-900 mb-4">
                  🎯 Topics Added to Your Study List
                </h2>
                <p className="text-sm text-yellow-800 mb-4">
                  Based on your quiz performance, these topics need attention:
                </p>
                <ul className="space-y-2">
                  {weakTopics.map((topic, index) => (
                    <li
                      key={index}
                      className="text-sm text-yellow-900 flex items-start"
                    >
                      <span className="mr-2">•</span>
                      <span className="flex-1">
                        {topic.substring(0, 50)}...
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 p-3 bg-white rounded border border-yellow-300">
                  <p className="text-sm text-gray-700">
                    <strong>Deadline:</strong> Complete within 7 days
                  </p>
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <h2 className="text-lg font-bold text-blue-900 mb-3">
                💡 Learning Recommendation
              </h2>
              <p className="text-sm text-blue-800 mb-4">
                Personalized learning materials are ready for the topics you
                struggled with. These materials are based on the PPT your
                teacher uploaded for today's lecture.
              </p>
              <button className="w-full py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors">
                Start Learning Session
              </button>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => (window.location.href = "/")}
                className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Back to Dashboard
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
              >
                Retake Quiz
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Quiz Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {quiz.subject}
              </h1>
              <p className="text-gray-600">{quiz.topic}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-emerald-600">18:45</div>
              <div className="text-sm text-gray-500">Time Remaining</div>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              Question {currentQuestion + 1} of {quiz.totalQuestions}
            </span>
            <span>{quiz.duration} minutes total</span>
          </div>
          <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all"
              style={{
                width: `${((currentQuestion + 1) / quiz.totalQuestions) * 100}%`,
              }}
            ></div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-8">
            <div className="text-sm text-gray-500 mb-3">
              Question {currentQuestion + 1}
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              {quiz.questions[currentQuestion].question}
            </h2>
          </div>

          <div className="space-y-4">
            {quiz.questions[currentQuestion].options.map((option, index) => (
              <div
                key={index}
                onClick={() => handleAnswerSelect(index)}
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  selectedAnswer === index
                    ? "border-emerald-600 bg-emerald-50"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center">
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-4 ${
                      selectedAnswer === index
                        ? "border-emerald-600 bg-emerald-600"
                        : "border-gray-300"
                    }`}
                  >
                    {selectedAnswer === index && (
                      <div className="w-3 h-3 bg-white rounded-full"></div>
                    )}
                  </div>
                  <span
                    className={
                      selectedAnswer === index
                        ? "font-medium text-gray-900"
                        : "text-gray-700"
                    }
                  >
                    {option}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-between">
            <button
              disabled={currentQuestion === 0}
              onClick={() => setCurrentQuestion(currentQuestion - 1)}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              disabled={selectedAnswer === null}
              onClick={handleNextQuestion}
              className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {currentQuestion === quiz.questions.length - 1
                ? "Submit Quiz"
                : "Next Question"}
            </button>
          </div>
        </div>

        {/* Info Card */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> This quiz is based on today's lecture
            material uploaded by your teacher. Your performance will help AI
            identify topics where you need additional support.
          </p>
        </div>
      </main>
    </div>
  );
}
