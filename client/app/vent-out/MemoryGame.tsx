import { useEffect, useState } from "react";

type Card = {
  symbol: string;
  color: string;
};

export default function MemoryGame() {
  // Periodic Elements
  const elements: Card[] = [
    { symbol: "H", color: "bg-blue-400" },
    { symbol: "O", color: "bg-red-400" },
    { symbol: "Na", color: "bg-yellow-400" },
    { symbol: "Cl", color: "bg-green-400" },
    { symbol: "C", color: "bg-gray-400" },
    { symbol: "N", color: "bg-purple-400" },
  ];

  // Shuffle once
  const [cards] = useState(() => {
    return [...elements, ...elements].sort(
      () => 0.5 - Math.random()
    );
  });

  const [opened, setOpened] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);

  // Handle Click
  function handleClick(index: number) {
    if (
      opened.length === 2 ||
      opened.includes(index) ||
      matched.includes(index)
    )
      return;

    setOpened((prev) => [...prev, index]);
  }

  // Match Logic (Runs AFTER render)
  useEffect(() => {
    if (opened.length === 2) {
      const [first, second] = opened;

      if (
        cards[first].symbol === cards[second].symbol
      ) {
        setMatched((prev) => [...prev, first, second]);
      }

      setTimeout(() => {
        setOpened([]);
      }, 700);
    }
  }, [opened, cards]);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 text-center">
        🧪 Periodic Memory Match
      </h2>

      <p className="text-center text-gray-600 mb-4">
        Match chemical elements to boost memory and focus.
      </p>

      <div className="grid grid-cols-4 gap-3">
        {cards.map((card, index) => {
          const isOpen =
            opened.includes(index) ||
            matched.includes(index);

          return (
            <button
              key={index}
              onClick={() => handleClick(index)}
              className={`h-16 rounded-lg font-bold text-xl
              transition-all flex items-center justify-center
              ${
                isOpen
                  ? `${card.color} text-white`
                  : "bg-gray-200"
              }`}
            >
              {isOpen ? card.symbol : "❓"}
            </button>
          );
        })}
      </div>

      {matched.length === cards.length && (
        <p className="text-green-600 font-semibold mt-4 text-center">
          🎉 Excellent! Your memory skills improved!
        </p>
      )}
    </div>
  );
}