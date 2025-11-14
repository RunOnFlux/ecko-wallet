import { bringInitContentScript } from '@bringweb3/chrome-extension-kit';
import { dark } from './theme';

window.addEventListener('message', (event) => {
  if (event.source !== window) return;
  if (event.data?.action === 'res_accountChange' && event.data?.target === 'kda.dapps') {
    document.dispatchEvent(new CustomEvent('ecko_accountChange', { detail: event.data }));
  }
});

const getWalletAddress = async () =>
  new Promise((resolve) => {
    chrome.runtime.sendMessage(
      {
        target: 'kda.background',
        action: 'bring_getWalletAddress',
      },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error('getWalletAddress error:', chrome.runtime.lastError);
          resolve(null);
          return;
        }
        resolve(response?.walletAddress || null);
      },
    );
  });

const promptLogin = async () =>
  new Promise((resolve) => {
    chrome.runtime.sendMessage(
      {
        target: 'kda.background',
        action: 'bring_promptLogin',
      },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error('promptLogin error:', chrome.runtime.lastError);
          resolve(false);
          return;
        }
        resolve(response?.success || false);
      },
    );
  });

bringInitContentScript({
  getWalletAddress,
  promptLogin,
  walletAddressListeners: ['ecko_accountChange'],
  theme: 'dark',
  text: 'upper',
  darkTheme: dark,
});
