import { describe, it, expect } from 'vitest';
import {
  isValidExternalLinkUrl,
  isValidExternalLinkLabel,
  isValidExternalLinkIcon,
  isValidExternalLinksCount,
} from '@/lib/validation';

describe('isValidExternalLinkUrl', () => {
  it('有効なHTTP/HTTPS URLは許可', () => {
    expect(isValidExternalLinkUrl('https://example.com')).toBe(true);
    expect(isValidExternalLinkUrl('http://example.com/path?q=1')).toBe(true);
    expect(isValidExternalLinkUrl('https://kabutan.jp/warning/record_w52_high_price')).toBe(true);
  });

  it('http/https以外のプロトコルは拒否', () => {
    expect(isValidExternalLinkUrl('ftp://example.com')).toBe(false);
    expect(isValidExternalLinkUrl('javascript:alert(1)')).toBe(false);
    expect(isValidExternalLinkUrl('data:text/html,<h1>test</h1>')).toBe(false);
  });

  it('無効なURLは拒否', () => {
    expect(isValidExternalLinkUrl('')).toBe(false);
    expect(isValidExternalLinkUrl('not-a-url')).toBe(false);
    expect(isValidExternalLinkUrl('example.com')).toBe(false);
  });

  it('長すぎるURLは拒否', () => {
    const longUrl = 'https://example.com/' + 'a'.repeat(2000);
    expect(isValidExternalLinkUrl(longUrl)).toBe(false);
  });
});

describe('isValidExternalLinkLabel', () => {
  it('有効なラベルは許可', () => {
    expect(isValidExternalLinkLabel('52週高値')).toBe(true);
    expect(isValidExternalLinkLabel('a')).toBe(true);
    expect(isValidExternalLinkLabel('a'.repeat(30))).toBe(true);
  });

  it('空文字・空白のみは拒否', () => {
    expect(isValidExternalLinkLabel('')).toBe(false);
    expect(isValidExternalLinkLabel('   ')).toBe(false);
  });

  it('長すぎるラベルは拒否', () => {
    expect(isValidExternalLinkLabel('a'.repeat(31))).toBe(false);
  });
});

describe('isValidExternalLinkIcon', () => {
  it('有効なアイコンは許可', () => {
    expect(isValidExternalLinkIcon('📈')).toBe(true);
    expect(isValidExternalLinkIcon('🌍')).toBe(true);
    expect(isValidExternalLinkIcon('A')).toBe(true);
  });

  it('空文字は拒否', () => {
    expect(isValidExternalLinkIcon('')).toBe(false);
    expect(isValidExternalLinkIcon('   ')).toBe(false);
  });

  it('長すぎるアイコンは拒否', () => {
    expect(isValidExternalLinkIcon('abcde')).toBe(false);
  });
});

describe('isValidExternalLinksCount', () => {
  it('0〜8は許可', () => {
    expect(isValidExternalLinksCount(0)).toBe(true);
    expect(isValidExternalLinksCount(4)).toBe(true);
    expect(isValidExternalLinksCount(8)).toBe(true);
  });

  it('上限超過は拒否', () => {
    expect(isValidExternalLinksCount(9)).toBe(false);
  });

  it('負数・小数は拒否', () => {
    expect(isValidExternalLinksCount(-1)).toBe(false);
    expect(isValidExternalLinksCount(1.5)).toBe(false);
  });
});
