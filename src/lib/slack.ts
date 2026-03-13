const CATEGORY_LABELS: Record<string, string> = {
  FEATURE_REQUEST: '💡 機能要望',
  IMPROVEMENT: '✨ 改善提案',
  BUG_REPORT: '🐛 不具合報告',
  OTHER: '📝 その他',
}

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
              text: `*📮 新しいフィードバック*\n*カテゴリ:* ${CATEGORY_LABELS[category] ?? category}\n*内容:*\n${content}`,
            },
          },
        ],
      }),
    })
  } catch {
    console.error('Slack通知の送信に失敗しました')
  }
}
