import { bringInitContentScript } from '@bringweb3/chrome-extension-kit';
import { dark } from './theme';

window.addEventListener('message', (event) => {
  if (event.source !== window) return;
  if (event.data?.action === 'res_accountChange' && event.data?.target === 'kda.dapps') {
    window.dispatchEvent(new CustomEvent('ecko_accountChange', { detail: event.data }));
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
          resolve(false);
          return;
        }
        resolve(response?.success || false);
      },
    );
  });

// "KDA Wallet" button on Bring's welcome page: open the wallet in a new tab.
const openWallet = () => {
  chrome.runtime.sendMessage(
    {
      target: 'kda.background',
      action: 'bring_openWallet',
    },
    () => {
      // Read lastError so Chrome doesn't log it when the service worker is restarting.
      void chrome.runtime.lastError;
    },
  );
};

bringInitContentScript({
  getWalletAddress,
  promptLogin,
  walletAddressListeners: ['ecko_accountChange'],
  theme: 'dark',
  text: 'upper',
  darkTheme: dark,
  switchWallet: false,
  onboarding: {
    onWalletClick: openWallet,
  },
});
