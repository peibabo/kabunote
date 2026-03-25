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
      <p className="text-gray-300 mb-4">投資の思考を整理するダッシュボード</p>
      <p className="text-gray-400 text-sm">銘柄メモ・損益管理・決算カレンダー・投資日記など、投資判断をサポートする機能が揃っています。</p>
    </div>
  );
}
