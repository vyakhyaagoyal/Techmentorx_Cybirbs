export default function LeafDecoration() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 opacity-5">
      {/* Top left leaves */}
      <div className="absolute top-0 left-0 text-9xl text-emerald-600 transform -translate-x-1/4 -translate-y-1/4">
        🌿
      </div>
      <div className="absolute top-20 left-40 text-6xl text-green-500 transform rotate-45">
        🍃
      </div>

      {/* Top right leaves */}
      <div className="absolute top-10 right-20 text-7xl text-teal-600 transform rotate-12">
        🌱
      </div>
      <div className="absolute top-40 right-60 text-5xl text-emerald-500">
        🍀
      </div>

      {/* Bottom left leaves */}
      <div className="absolute bottom-20 left-10 text-8xl text-lime-600 transform -rotate-45">
        🌿
      </div>
      <div className="absolute bottom-60 left-32 text-6xl text-emerald-600">
        🍃
      </div>

      {/* Bottom right leaves */}
      <div className="absolute bottom-10 right-10 text-9xl text-green-600 transform rotate-90">
        🌿
      </div>
      <div className="absolute bottom-40 right-40 text-7xl text-teal-500 transform -rotate-12">
        🍃
      </div>

      {/* Center scattered */}
      <div className="absolute top-1/2 left-1/4 text-4xl text-emerald-400 transform -translate-y-1/2">
        🌱
      </div>
      <div className="absolute top-1/3 right-1/3 text-5xl text-lime-500 transform rotate-180">
        🍃
      </div>
    </div>
  );
}
