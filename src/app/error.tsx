'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="text-6xl">&#x1F6A8;</div>
        <h1 className="text-2xl font-bold text-white">エラーが発生しました</h1>
        <p className="text-gray-400">
          予期しないエラーが発生しました。再試行するか、トップページに戻ってください。
        </p>
        {process.env.NODE_ENV === 'development' && (
          <pre className="text-left text-xs text-red-400 bg-gray-800 rounded-lg p-4 overflow-auto max-h-40">
            {error.message}
          </pre>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            再試行
          </button>
          <a
            href="/"
            className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            トップに戻る
          </a>
        </div>
      </div>
    </div>
  )
}
