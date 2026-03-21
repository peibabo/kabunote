import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
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

  it('検索バーが表示される', () => {
    render(<HelpPage />)
    expect(screen.getByPlaceholderText('ヘルプ内を検索...')).toBeInTheDocument()
  })

  it('検索するとマッチする項目のみ表示される', () => {
    render(<HelpPage />)
    const input = screen.getByPlaceholderText('ヘルプ内を検索...')
    fireEvent.change(input, { target: { value: 'チェックリスト' } })

    expect(screen.getByText('デイリーチェックリスト')).toBeInTheDocument()
    expect(screen.getByText(/1件の項目が見つかりました/)).toBeInTheDocument()
    // 無関係なセクションは非表示
    expect(screen.queryByText('価格アラート')).not.toBeInTheDocument()
  })

  it('検索結果が0件のときメッセージが表示される', () => {
    render(<HelpPage />)
    const input = screen.getByPlaceholderText('ヘルプ内を検索...')
    fireEvent.change(input, { target: { value: 'ありえないキーワード' } })

    expect(screen.getByText('該当する項目が見つかりませんでした')).toBeInTheDocument()
  })

  it('検索中は目次・カブノオトとは・はじめかた・Aboutが非表示になる', () => {
    render(<HelpPage />)
    const input = screen.getByPlaceholderText('ヘルプ内を検索...')
    fireEvent.change(input, { target: { value: 'アラート' } })

    expect(screen.queryByText('目次')).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'About' })).not.toBeInTheDocument()
  })

  it('クリアボタンで検索をリセットできる', () => {
    render(<HelpPage />)
    const input = screen.getByPlaceholderText('ヘルプ内を検索...')
    fireEvent.change(input, { target: { value: 'アラート' } })

    const clearButton = screen.getByText('×')
    fireEvent.click(clearButton)

    expect(input).toHaveValue('')
    // 目次が再表示される
    expect(screen.getByText('目次')).toBeInTheDocument()
  })
})
