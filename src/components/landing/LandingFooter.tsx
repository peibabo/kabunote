import Link from 'next/link'
import Image from 'next/image'

export default function LandingFooter() {
  return (
    <footer className="border-t border-gray-800 py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {/* Logo & tagline */}
          <div>
            <Image
              src="/kabunote-logo.png"
              alt="カブノオト"
              width={120}
              height={32}
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

          {/* SNS & Copyright */}
          <div className="md:text-right space-y-3">
            <a
              href="https://x.com/kabunote_jp"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              @kabunote_jp
            </a>
            <p className="text-sm text-gray-600">
              &copy; 2025 カブノオト
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
