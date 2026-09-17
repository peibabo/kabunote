import { useState, useEffect, useCallback } from 'react';
import { toast } from '@/lib/toast';
import { useAppEvent } from '../util/useAppEvent';
import { emitAppEvent, APP_EVENTS } from '@/lib/appEvents';
import { DEFAULT_EXTERNAL_LINKS, type ExternalLink } from '@/lib/defaultExternalLinks';

interface UseExternalLinksResult {
  links: ExternalLink[];
  isLoading: boolean;
  saveLinks: (links: ExternalLink[]) => Promise<void>;
}

// Module-level cache
let cachedLinks: ExternalLink[] | null = null;
let fetchPromise: Promise<ExternalLink[] | null> | null = null;

async function fetchLinksOnce(): Promise<ExternalLink[] | null> {
  if (cachedLinks) return cachedLinks;
  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    try {
      const response = await fetch('/api/external-links');
      if (!response.ok) throw new Error('外部リンクの取得に失敗しました');
      const result = await response.json();
      // data: null → 未設定、デフォルトを使用
      const links = result.data ?? DEFAULT_EXTERNAL_LINKS;
      cachedLinks = links;
      return links;
    } catch {
      return null;
    } finally {
      fetchPromise = null;
    }
  })();

  return fetchPromise;
}

export function useExternalLinks(): UseExternalLinksResult {
  const [links, setLinks] = useState<ExternalLink[]>(cachedLinks ?? DEFAULT_EXTERNAL_LINKS);
  const [isLoading, setIsLoading] = useState<boolean>(cachedLinks === null);

  useEffect(() => {
    if (cachedLinks) {
      setLinks(cachedLinks);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    fetchLinksOnce().then(data => {
      if (cancelled) return;
      if (data) {
        setLinks(data);
      }
      setIsLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  // Listen for updates from other instances
  useAppEvent(APP_EVENTS.EXTERNAL_LINKS_UPDATE, (detail) => setLinks(detail));

  const saveLinks = useCallback(async (newLinks: ExternalLink[]) => {
    try {
      const response = await fetch('/api/external-links', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ links: newLinks }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || '外部リンクの保存に失敗しました');
      }
      const result = await response.json();
      const savedLinks = result.data ?? newLinks;

      // Update cache and broadcast
      cachedLinks = savedLinks;
      setLinks(savedLinks);
      emitAppEvent(APP_EVENTS.EXTERNAL_LINKS_UPDATE, savedLinks);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '保存に失敗しました';
      toast.error(msg);
      throw err;
    }
  }, []);

  return { links, isLoading, saveLinks };
}
