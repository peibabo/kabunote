'use client';

interface GetStartedStepProps {
  onGetStarted: () => void;
  onLater: () => void;
}

export default function GetStartedStep({ onGetStarted, onLater }: GetStartedStepProps) {
  return (
    <div className="text-center">
      <div className="text-5xl mb-4">🚀</div>
      <h2 className="text-2xl font-bold text-white mb-3">さあ、始めましょう！</h2>
      <p className="text-gray-300 mb-8">
        投資の思考を整理して、より良い投資判断を。
        <br />
        まずは最初の銘柄を追加してみましょう。
      </p>

      <button
        onClick={onGetStarted}
        className="cursor-pointer w-full py-3 px-6 rounded-lg text-white font-bold text-lg transition-all duration-300 hover:brightness-110"
        style={{
          backgroundColor: '#36B164',
          boxShadow: '0 0 15px rgba(52, 211, 153, 0.5), 0 0 30px rgba(52, 211, 153, 0.3)',
        }}
      >
        最初の銘柄を追加する
      </button>

      <button
        onClick={onLater}
        className="cursor-pointer mt-4 text-sm text-gray-400 hover:text-gray-300 transition-colors"
      >
        あとで始める
      </button>
    </div>
  );
}
