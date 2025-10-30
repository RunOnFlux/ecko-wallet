# eckoWALLET Chrome Extension

## Powered by Flux · The Gateway to Kadena

The **eckoWALLET Chrome Extension** brings secure and streamlined access to the Kadena ecosystem, allowing users to manage their KDA and tokens, interact with dApps using WalletConnect, and sign transactions—directly from their browser.

---

### 📅 Download Now

- **Chrome Extension:** [Install from Chrome Web Store](https://chromewebstore.google.com/detail/eckowallet/bofddndhbegljegmpmnlbhcejofmjgbn?pli=1)
- Official website: [eckowallet.com](https://eckowallet.com)
- Documentation: [docs.eckowallet.com](https://docs.eckowallet.com)
- Community: [Join our Discord](https://discord.com/invite/runonflux)

---

## ✨ Key Features

- **Self-Custodial**: You own your keys and your crypto.
- **WalletConnect Integration**: Seamlessly connect to Kadena dApps.
- **Secure Recovery**: 12-word seed phrase and local encryption.
- **Token Management**: Auto-detect and display supported tokens.
- **Multisig Ready**: Built with future Kadena multisig support in mind.
- **Fiat On-Ramp**: Purchase KDA using fiat directly from the extension.
- **Audited by CertiK**: [View security audit on CertiK Skynet](https://skynet.certik.com/wallets/eckowallet)

---

## 🛠️ Development Setup

### Prerequisites

- Node.js v22+

### Getting Started

1. **Clone the repository**

```bash
git clone https://github.com/RunOnFlux/ecko-wallet-extension.git
cd ecko-wallet-extension
```

2. **Setup environment**

```bash
cp .env.example .env
```

3. **Install dependencies**

```bash
npm install
```

4. **Start in development mode**

```bash
npm start
```

5. **Load the extension in Chrome**

- Go to `chrome://extensions/`
- Enable "Developer mode"
- Click "Load unpacked"
- Select the `build` folder

The extension auto-reloads on code changes.

---

## 🚀 Production Build

Create a production-ready build:

```bash
npm run build
```

Or for development with source maps:

```bash
npm run build:dev
```

Then load it via `chrome://extensions/` as described above.

---

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.

---

## 🚨 Disclaimer

By using eckoWALLET, you agree to the terms outlined in the Disclaimer. Never share your recovery phrase. eckoWALLET does not store keys or sensitive data centrally.

---

Let's make Kadena accessible to everyone — securely and simply. ✨
