import type { BlogPost } from '@/lib/blog'

export default function BlogArticle({ post }: { post: BlogPost }) {
  return (
    <article className="max-w-3xl mx-auto">
      <header className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          {post.category && (
            <span className="text-sm font-medium px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-400">
              {post.category}
            </span>
          )}
          <time className="text-base text-gray-500" dateTime={post.date}>
            {new Date(post.date).toLocaleDateString('ja-JP', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </time>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight">
          {post.title}
        </h1>
        <p className="mt-4 text-lg text-gray-400">{post.description}</p>
      </header>

      <div
        className="prose"
        dangerouslySetInnerHTML={{ __html: post.contentHtml }}
      />
    </article>
  )
}
