'use client';

export default function QuickStartStep() {
  const steps = [
    {
      number: 1,
      title: '銘柄を追加',
      description: '右下の緑の＋ボタンから、銘柄コードや会社名で検索',
      icon: '\u2795',
    },
    {
      number: 2,
      title: 'ポジションを登録',
      description: '取得単価・株数を入力して保有状況を記録',
      icon: '\uD83D\uDCBC',
    },
    {
      number: 3,
      title: '損切り/利確ラインを設定',
      description: '損益シミュレーション・リスクリワード比が見える！',
      icon: '\uD83C\uDFAF',
      highlight: true,
    },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-white text-center mb-2">
        3ステップで始めよう
      </h2>
      <p className="text-gray-400 text-center text-sm mb-6">
        カブノオトのコア機能を使うまでの流れ
      </p>

      <div className="space-y-4">
        {steps.map((step, i) => (
          <div key={step.number}>
            <div
              className={`flex items-start gap-4 p-4 rounded-lg ${
                step.highlight
                  ? 'bg-blue-600 bg-opacity-20 border border-blue-500 border-opacity-30'
                  : 'bg-gray-700 bg-opacity-50'
              }`}
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm">
                {step.number}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span>{step.icon}</span>
                  <span className="font-medium text-white">{step.title}</span>
                </div>
                <p className={`text-sm mt-1 ${step.highlight ? 'text-green-400 font-medium' : 'text-gray-400'}`}>
                  {step.description}
                </p>
              </div>
            </div>
            {i < steps.length - 1 && (
              <div className="flex justify-center py-1">
                <span className="text-gray-500 text-lg">&#x25BC;</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
