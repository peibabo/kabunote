import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import HelpPage from '@/app/help/page'

describe('HelpPage', () => {
  it('各セクション見出しが表示される', () => {
    render(<HelpPage />)
    expect(screen.getAllByText('カブノオトとは').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('はじめかた').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('主要機能ガイド').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('よくある質問（FAQ）').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByRole('heading', { name: 'About' })).toBeInTheDocument()
  })

  it('目次リンクのhrefが正しい', () => {
    render(<HelpPage />)
    expect(screen.getByRole('link', { name: 'カブノオトとは' })).toHaveAttribute('href', '#about')
    expect(screen.getByRole('link', { name: 'はじめかた' })).toHaveAttribute('href', '#getting-started')
    expect(screen.getByRole('link', { name: '主要機能ガイド' })).toHaveAttribute('href', '#features')
    expect(screen.getByRole('link', { name: 'よくある質問（FAQ）' })).toHaveAttribute('href', '#faq')
    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute('href', '#version')
  })

  it('「ホームに戻る」リンクが /dashboard を指す', () => {
    render(<HelpPage />)
    const homeLinks = screen.getAllByText('← ホームに戻る')
    homeLinks.forEach(link => {
      expect(link.closest('a')).toHaveAttribute('href', '/dashboard')
    })
  })

  it('FAQ質問テキストが表示される', () => {
    render(<HelpPage />)
    expect(screen.getByText('銘柄は最大いくつまで登録できますか？')).toBeInTheDocument()
    expect(screen.getByText('データはどこに保存されますか？')).toBeInTheDocument()
    expect(screen.getByText('株価は自動で更新されますか？')).toBeInTheDocument()
    expect(screen.getByText('アカウントを削除するとどうなりますか？')).toBeInTheDocument()
    expect(screen.getByText('スマートフォンでも使えますか？')).toBeInTheDocument()
    expect(screen.getByText('利用料金はかかりますか？')).toBeInTheDocument()
  })
})
