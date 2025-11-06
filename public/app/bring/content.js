import { bringInitContentScript } from "@bringweb3/chrome-extension-kit";
import { dark } from "./theme";

bringInitContentScript({
    getWalletAddress: async () => new Promise(resolve => resolve(null)),
    promptLogin: () => new Promise((resolve) => resolve(true)),
    walletAddressListeners: ['test-listener'],
    theme: 'dark',
    text: 'upper',
    darkTheme: dark,
})