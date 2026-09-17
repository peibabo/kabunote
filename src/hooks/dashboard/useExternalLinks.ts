import { createCachedSettingsHook } from '@/hooks/util/createCachedSettingsHook';
import { APP_EVENTS } from '@/lib/appEvents';
import { DEFAULT_EXTERNAL_LINKS, type ExternalLink } from '@/lib/defaultExternalLinks';

interface UseExternalLinksResult {
  links: ExternalLink[];
  isLoading: boolean;
  saveLinks: (links: ExternalLink[]) => Promise<void>;
}

const useCachedExternalLinks = createCachedSettingsHook({
  endpoint: '/api/external-links',
  bodyKey: 'links',
  eventName: APP_EVENTS.EXTERNAL_LINKS_UPDATE,
  defaultValue: DEFAULT_EXTERNAL_LINKS,
  saveErrorMessage: '外部リンクの保存に失敗しました',
});

/** ダッシュボード上部の外部リンク設定（全インスタンスでキャッシュ共有） */
export function useExternalLinks(): UseExternalLinksResult {
  const { value, isLoading, save } = useCachedExternalLinks();
  return { links: value, isLoading, saveLinks: save };
}
