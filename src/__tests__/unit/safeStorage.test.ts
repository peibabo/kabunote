import { describe, it, expect, vi, afterEach } from 'vitest';
import { safeGetItem, safeSetItem, safeRemoveItem } from '@/lib/safeStorage';

describe('safeStorage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('通常環境', () => {
    it('保存・取得・削除ができる', () => {
      expect(safeSetItem('k', 'v')).toBe(true);
      expect(safeGetItem('k')).toBe('v');
      safeRemoveItem('k');
      expect(safeGetItem('k')).toBeNull();
    });

    it('未設定キーは null を返す', () => {
      expect(safeGetItem('missing')).toBeNull();
    });
  });

  describe('localStorage へのアクセス自体が拒否される環境（SecurityError）', () => {
    const denyAccess = () => {
      vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
        throw new DOMException('Access is denied for this document.', 'SecurityError');
      });
    };

    it('safeGetItem は例外を投げず null を返す', () => {
      denyAccess();
      expect(() => safeGetItem('k')).not.toThrow();
      expect(safeGetItem('k')).toBeNull();
    });

    it('safeSetItem は例外を投げず false を返す', () => {
      denyAccess();
      expect(safeSetItem('k', 'v')).toBe(false);
    });

    it('safeRemoveItem は例外を投げない', () => {
      denyAccess();
      expect(() => safeRemoveItem('k')).not.toThrow();
    });
  });

  describe('容量超過などで操作が失敗する環境', () => {
    it('setItem が例外を投げても false を返す', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new DOMException('quota', 'QuotaExceededError');
      });
      expect(safeSetItem('k', 'v')).toBe(false);
    });

    it('getItem が例外を投げても null を返す', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('boom');
      });
      expect(safeGetItem('k')).toBeNull();
    });
  });
});
