import { useState } from "react";

export default function CreativeGame() {
  const steps = [
    {
      title: "👀 Look Around",
      question: "Write 3 things you can see right now:",
      count: 3,
    },
    {
      title: "👂 Listen",
      question: "Write 3 things you can hear right now:",
      count: 3,
    },
    {
      title: "✋ Feel",
      question: "Write 3 things you can feel right now:",
      count: 3,
    },
    {
      title: "🌿 Smell",
      question: "Write 2 things you can smell:",
      count: 2,
    },
    {
      title: "💛 Positive Thought",
      question: "Write 1 thing you are grateful for:",
      count: 1,
    },
  ];

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>(
    Array(steps[0].count).fill("")
  );
  const [completed, setCompleted] = useState(false);

  function handleChange(index: number, value: string) {
    const updated = [...answers];
    updated[index] = value;
    setAnswers(updated);
  }

  function handleNext() {
    if (answers.some((a) => a.trim() === "")) return;

    if (step === steps.length - 1) {
      setCompleted(true);
    } else {
      const next = step + 1;
      setStep(next);
      setAnswers(Array(steps[next].count).fill(""));
    }
  }

  if (completed) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">
          🌈 You Did Amazing!
        </h2>

        <p className="text-gray-600 mb-4">
          Your mind is calmer and more focused now.
        </p>

        <p className="text-green-600 font-semibold">
          Come back whenever you feel stressed 💚
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2 text-center">
        {steps[step].title}
      </h2>

      <p className="text-gray-600 mb-4 text-center">
        {steps[step].question}
      </p>

      <div className="space-y-3">
        {answers.map((value, index) => (
          <input
            key={index}
            type="text"
            value={value}
            onChange={(e) =>
              handleChange(index, e.target.value)
            }
            placeholder={`Item ${index + 1}`}
            className="w-full border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        ))}
      </div>

      <button
        onClick={handleNext}
        className="mt-5 w-full py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
      >
        {step === steps.length - 1
          ? "Finish"
          : "Next"}
      </button>
    </div>
  );
}