import { useEffect, useState } from 'react';
import { getOnboardingUrl } from '@bringweb3/chrome-extension-kit';
import { CASHBACK_LINK } from './config';

// How long to wait for the background script before treating the Gold Cashback block as unavailable.
const EMBED_URL_TIMEOUT_MS = 5000;

const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });

/**
 * Opens a URL in a normal browser tab.
 * Extension pages run under a CSP `sandbox` directive, so a tab opened with a link or window.open stays
 * sandboxed, and so does every site the user then visits in it (merchants included). chrome.tabs.create
 * opens a regular tab. Use it for anything that leads to Bring's welcome page or Rewards portal.
 */
export const openInNewTab = (url: string) => {
  const tabs = (window as any)?.chrome?.tabs;
  if (tabs?.create) {
    tabs.create({ url });
  } else {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
};

/**
 * Opens Bring's welcome page (navbar "Rewards" button). The URL always comes from the kit, never hardcoded:
 * it carries the extension id and tells the kit which origin to listen on. Falls back to the Rewards portal
 * if the welcome page can't be resolved, so the button never does nothing.
 */
export const openBringRewards = async () => {
  let url: string | undefined;
  try {
    url = await getOnboardingUrl('start');
  } catch (error) {
    console.warn('Bring welcome page unavailable', error);
  }
  openInNewTab(url || CASHBACK_LINK);
};

export type GoldCashbackEmbed = { status: 'loading' } | { status: 'ready'; url: string } | { status: 'unavailable' };

/** Resolves the URL of the embeddable Gold Cashback block. */
export const useGoldCashbackEmbed = (): GoldCashbackEmbed => {
  const [embed, setEmbed] = useState<GoldCashbackEmbed>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    withTimeout(getOnboardingUrl('embed'), EMBED_URL_TIMEOUT_MS)
      .then((url) => {
        if (!cancelled) setEmbed(url ? { status: 'ready', url } : { status: 'unavailable' });
      })
      .catch(() => {
        if (!cancelled) setEmbed({ status: 'unavailable' });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return embed;
};
