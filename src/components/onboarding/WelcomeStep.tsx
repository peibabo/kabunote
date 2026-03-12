'use client';

import Image from 'next/image';

export default function WelcomeStep() {
  return (
    <div className="text-center">
      <div className="mb-6" style={{ animation: 'neonPulse 2s ease-in-out infinite' }}>
        <Image
          src="/kabunote-logo.png"
          alt="カブノオト"
          width={200}
          height={80}
          className="h-16 md:h-20 w-auto mx-auto"
        />
      </div>
      <h2 className="text-2xl font-bold text-white mb-3">カブノオトへようこそ</h2>
      <p className="text-gray-300 mb-6">投資の思考を整理するダッシュボード</p>
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: '📝', label: 'メモ', desc: '銘柄ごとに思考を記録' },
          { icon: '📊', label: '分析', desc: 'ポートフォリオを可視化' },
          { icon: '📅', label: 'カレンダー', desc: 'イベントを一覧管理' },
        ].map((item) => (
          <div key={item.label} className="bg-gray-700 bg-opacity-50 rounded-lg p-3">
            <div className="text-2xl mb-1">{item.icon}</div>
            <div className="text-sm font-medium text-white">{item.label}</div>
            <div className="text-xs text-gray-400 mt-1">{item.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
