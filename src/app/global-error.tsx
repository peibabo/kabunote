'use client'

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="ja" className="dark">
      <body className="bg-gray-900 text-white antialiased">
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="text-6xl">&#x1F4A5;</div>
            <h1 className="text-2xl font-bold">重大なエラーが発生しました</h1>
            <p className="text-gray-400">
              アプリケーションの読み込みに失敗しました。再試行してください。
            </p>
            <button
              onClick={reset}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              再試行
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
