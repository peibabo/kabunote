const SITE_URL = 'https://kabunote.jp'
const HASHTAGS = 'カブノオト,投資,日本株'

export function shareOnX(text: string) {
  const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(SITE_URL)}&hashtags=${encodeURIComponent(HASHTAGS)}`
  window.open(url, '_blank', 'noopener,noreferrer,width=550,height=420')
}

export function shareOnLINE(text: string) {
  const message = `${text}\n${SITE_URL}`
  const url = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(SITE_URL)}&text=${encodeURIComponent(message)}`
  window.open(url, '_blank', 'noopener,noreferrer,width=550,height=420')
}
