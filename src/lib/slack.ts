import { getCategoryLabel } from '@/lib/feedbackCategories'

export async function notifyFeedback(category: string, content: string) {
  const url = process.env.SLACK_WEBHOOK_URL
  if (!url) return

  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: '📮 新しいフィードバック',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*📮 新しいフィードバック*\n*カテゴリ:* ${getCategoryLabel(category)}\n*内容:*\n${content}`,
            },
          },
        ],
      }),
    })
  } catch {
    console.error('Slack通知の送信に失敗しました')
  }
}
