'use client';

export default function FloatingFeedbackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 left-6 z-40 w-11 h-11 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-lg transition-all duration-200 hover:scale-110 cursor-pointer flex items-center justify-center"
      aria-label="フィードバックを送る"
      title="開発者にフィードバックを送る"
    >
      <span className="text-lg">&#x1F4EE;</span>
    </button>
  );
}
