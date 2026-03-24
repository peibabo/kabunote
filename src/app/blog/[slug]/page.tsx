import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getAllPosts, getPostBySlug } from '@/lib/blog'
import BlogNavbar from '@/components/blog/BlogNavbar'
import BlogArticle from '@/components/blog/BlogArticle'
import BlogCTA from '@/components/blog/BlogCTA'
import LandingFooter from '@/components/landing/LandingFooter'

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const posts = getAllPosts()
  return posts.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) return {}

  return {
    title: post.title,
    description: post.description,
    keywords: post.keywords,
    alternates: {
      canonical: `https://kabunote.jp/blog/${post.slug}`,
    },
    openGraph: {
      title: `${post.title} | カブノオト`,
      description: post.description,
      type: 'article',
      url: `https://kabunote.jp/blog/${post.slug}`,
      publishedTime: post.date,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
    },
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const post = await getPostBySlug(slug)

  if (!post) notFound()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: {
      '@type': 'Organization',
      name: 'カブノオト',
      url: 'https://kabunote.jp',
    },
    publisher: {
      '@type': 'Organization',
      name: 'カブノオト',
      logo: {
        '@type': 'ImageObject',
        url: 'https://kabunote.jp/kabunote-logo.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://kabunote.jp/blog/${post.slug}`,
    },
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200">
      <BlogNavbar />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="container mx-auto px-4 pt-28 pb-16">
        <BlogArticle post={post} />
        <div className="max-w-3xl mx-auto">
          <BlogCTA />
        </div>
      </main>

      <LandingFooter />
    </div>
  )
}
