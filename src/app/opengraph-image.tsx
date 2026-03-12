import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export const alt = 'カブノオト - 投資の思考を、ひとつに。'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  const logoData = await readFile(join(process.cwd(), 'public', 'kabunote-logo.png'))
  const logoBase64 = `data:image/png;base64,${logoData.toString('base64')}`

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #111827 0%, #1f2937 50%, #111827 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* 背景の装飾 */}
        <div
          style={{
            position: 'absolute',
            top: '-100px',
            right: '-100px',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(34,197,94,0.15) 0%, transparent 70%)',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-50px',
            left: '-50px',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)',
            display: 'flex',
          }}
        />

        {/* ロゴ画像 */}
        <img
          src={logoBase64}
          alt=""
          width={400}
          height={120}
          style={{
            marginBottom: '32px',
            objectFit: 'contain',
          }}
        />

        {/* サブタイトル */}
        <div
          style={{
            fontSize: 36,
            color: '#22c55e',
            fontWeight: 600,
            display: 'flex',
            marginBottom: '32px',
          }}
        >
          投資の思考を、ひとつに。
        </div>

        {/* 説明 */}
        <div
          style={{
            fontSize: 22,
            color: '#9ca3af',
            display: 'flex',
            textAlign: 'center',
            maxWidth: '800px',
          }}
        >
          銘柄情報・メモ・戦略・スケジュールを一つのダッシュボードで整理
        </div>

        {/* 下部のURL */}
        <div
          style={{
            position: 'absolute',
            bottom: '32px',
            fontSize: 20,
            color: '#6b7280',
            display: 'flex',
          }}
        >
          kabunote.jp
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
