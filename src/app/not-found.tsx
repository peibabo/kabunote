export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="text-6xl">&#x1F50D;</div>
        <h1 className="text-2xl font-bold text-white">ページが見つかりません</h1>
        <p className="text-gray-400">
          お探しのページは存在しないか、移動した可能性があります。
        </p>
        <a
          href="/"
          className="inline-block px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          トップに戻る
        </a>
      </div>
    </div>
  )
}
