import Link from 'next/link'

export default function LandingFooter() {
  return (
    <footer className="border-t border-gray-800 py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {/* Logo & tagline */}
          <div>
            <img
              src="/kabunote-logo.png"
              alt="カブノオト"
              className="h-8 w-auto opacity-70 mb-3"
            />
            <p className="text-sm text-gray-500">
              投資家の思考を整理するダッシュボード
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-gray-400 mb-1">リンク</span>
            <Link href="/help" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">ヘルプ</Link>
            <Link href="/terms" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">利用規約</Link>
            <Link href="/privacy" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">プライバシーポリシー</Link>
          </div>

          {/* Copyright */}
          <div className="md:text-right">
            <p className="text-sm text-gray-600">
              &copy; 2025 カブノオト
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
