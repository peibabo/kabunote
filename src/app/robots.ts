import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/help', '/privacy', '/terms'],
      disallow: ['/dashboard', '/login', '/api/'],
    },
    sitemap: 'https://kabunote.jp/sitemap.xml',
  }
}
