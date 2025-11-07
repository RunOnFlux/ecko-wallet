import { bringInitContentScript } from '@bringweb3/chrome-extension-kit';
import { dark } from './theme';

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

bringInitContentScript({
  getWalletAddress,
  promptLogin: () => new Promise((resolve) => resolve(true)),
  walletAddressListeners: ['test-listener'],
  theme: 'dark',
  text: 'upper',
  darkTheme: dark,
});
