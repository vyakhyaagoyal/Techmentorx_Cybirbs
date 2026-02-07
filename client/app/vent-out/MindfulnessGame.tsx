export default function MindfulnessGame() {
  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold mb-4">🧘 Mindfulness</h2>

      <p className="mb-4 text-gray-600">
        Take 5 slow breaths. Relax your body.
      </p>

      <div className="space-y-3 text-lg">
        <p>🌬️ Inhale for 4s</p>
        <p>⏸️ Hold for 2s</p>
        <p>🌫️ Exhale for 6s</p>
      </div>

      <p className="mt-4 text-green-600 font-semibold">
        Practicing daily reduces stress.
      </p>
    </div>
  );
}
