import Link from 'next/link'
import type { BlogPostMeta } from '@/lib/blog'

const categoryColors: Record<string, string> = {
  '投資入門': 'bg-green-500/20 text-green-400',
  'ツール活用': 'bg-blue-500/20 text-blue-400',
  '分析手法': 'bg-purple-500/20 text-purple-400',
  '配当・優待': 'bg-yellow-500/20 text-yellow-400',
  'ポートフォリオ': 'bg-cyan-500/20 text-cyan-400',
}

export default function BlogCard({ post }: { post: BlogPostMeta }) {
  const colorClass = categoryColors[post.category] ?? 'bg-gray-500/20 text-gray-400'

  return (
    <Link href={`/blog/${post.slug}`} className="block group">
      <article className="p-6 rounded-xl bg-gray-800/50 border border-gray-700/50 hover:border-blue-500/30 hover:bg-gray-800/80 transition-all duration-200">
        <div className="flex items-center gap-3 mb-3">
          {post.category && (
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${colorClass}`}>
              {post.category}
            </span>
          )}
          <time className="text-xs text-gray-500" dateTime={post.date}>
            {new Date(post.date).toLocaleDateString('ja-JP', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </time>
        </div>
        <h2 className="text-lg font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
          {post.title}
        </h2>
        <p className="text-sm text-gray-400 line-clamp-2">{post.description}</p>
      </article>
    </Link>
  )
}
