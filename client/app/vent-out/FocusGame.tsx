import { useState } from "react";
export default function FocusGame() {
  const [count, setCount] = useState(5);

  function start() {
    setCount(5);

    const interval = setInterval(() => {
      setCount((c) => {
        if (c === 1) {
          clearInterval(interval);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  }

  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold mb-4">🎯 Focus Challenge</h2>

      <p className="mb-4 text-gray-600">
        Breathe slowly. Focus on the countdown.
      </p>

      <div className="text-5xl font-bold mb-4">{count}</div>

      <button
        onClick={start}
        className="px-6 py-2 bg-emerald-600 text-white rounded-lg"
      >
        Start
      </button>
    </div>
  );
}
