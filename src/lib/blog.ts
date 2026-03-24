import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { remark } from 'remark'
import remarkGfm from 'remark-gfm'
import remarkHtml from 'remark-html'

const BLOG_DIR = path.join(process.cwd(), 'content', 'blog')

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
    .filter((post) => post.date && post.title)
    .sort((a, b) => (a.date > b.date ? -1 : 1))

  return posts
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const filePath = path.join(BLOG_DIR, `${slug}.mdx`)

  if (!fs.existsSync(filePath)) return null

  const fileContents = fs.readFileSync(filePath, 'utf8')
  const { data, content } = matter(fileContents)

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
