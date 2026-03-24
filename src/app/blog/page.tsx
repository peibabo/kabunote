import type { Metadata } from 'next'
import { getAllPosts } from '@/lib/blog'
import BlogNavbar from '@/components/blog/BlogNavbar'
import BlogCard from '@/components/blog/BlogCard'
import LandingFooter from '@/components/landing/LandingFooter'

export const metadata: Metadata = {
  title: 'ブログ',
  description: '株式投資の思考整理法、PER/PBRの活用、配当管理、ポートフォリオ運用など、投資に役立つ情報をお届けします。',
  alternates: {
    canonical: 'https://kabunote.jp/blog',
  },
  openGraph: {
    title: 'ブログ | カブノオト',
    description: '株式投資の思考整理法、PER/PBRの活用、配当管理、ポートフォリオ運用など、投資に役立つ情報をお届けします。',
    url: 'https://kabunote.jp/blog',
  },
}

export default function BlogPage() {
  const posts = getAllPosts()

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200">
      <BlogNavbar />

      <main className="container mx-auto px-4 pt-28 pb-16">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            ブログ
          </h1>
          <p className="text-gray-400 mb-10">
            投資の思考整理に役立つ情報をお届けします。
          </p>

          {posts.length === 0 ? (
            <p className="text-gray-500 text-center py-16">
              記事を準備中です。お楽しみに！
            </p>
          ) : (
            <div className="flex flex-col gap-5">
              {posts.map((post) => (
                <BlogCard key={post.slug} post={post} />
              ))}
            </div>
          )}
        </div>
      </main>

      <LandingFooter />
    </div>
  )
}
