import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { remark } from 'remark'
import remarkGfm from 'remark-gfm'
import remarkHtml from 'remark-html'

const BLOG_DIR = path.join(process.cwd(), 'content', 'blog')

/** JSTの今日の日付（YYYY-MM-DD）を返す */
function getTodayJST(): string {
  return new Date(
    Date.now() + 9 * 60 * 60 * 1000
  ).toISOString().slice(0, 10)
}

export type BlogPostMeta = {
  slug: string
  title: string
  description: string
  date: string
  category: string
  keywords: string[]
  ogImage?: string
}

export type BlogPost = BlogPostMeta & {
  contentHtml: string
}

export function getAllPosts(): BlogPostMeta[] {
  if (!fs.existsSync(BLOG_DIR)) return []

  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith('.mdx'))

  const posts = files
    .map((filename) => {
      const slug = filename.replace(/\.mdx$/, '')
      const filePath = path.join(BLOG_DIR, filename)
      const fileContents = fs.readFileSync(filePath, 'utf8')
      const { data } = matter(fileContents)

      return {
        slug,
        title: data.title ?? '',
        description: data.description ?? '',
        date: data.date ?? '',
        category: data.category ?? '',
        keywords: data.keywords ?? [],
        ogImage: data.ogImage,
      } satisfies BlogPostMeta
    })
    .filter((post) => post.date && post.title && post.date <= getTodayJST())
    .sort((a, b) => (a.date > b.date ? -1 : 1))

  return posts
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const filePath = path.join(BLOG_DIR, `${slug}.mdx`)

  if (!fs.existsSync(filePath)) return null

  const fileContents = fs.readFileSync(filePath, 'utf8')
  const { data, content } = matter(fileContents)

  // 未来日付の記事は非公開
  if (data.date && data.date > getTodayJST()) return null

  const result = await remark().use(remarkGfm).use(remarkHtml).process(content)

  return {
    slug,
    title: data.title ?? '',
    description: data.description ?? '',
    date: data.date ?? '',
    category: data.category ?? '',
    keywords: data.keywords ?? [],
    ogImage: data.ogImage,
    contentHtml: result.toString(),
  }
}
