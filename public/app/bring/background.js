import { bringInitBackground } from '@bringweb3/chrome-extension-kit';

bringInitBackground({
  // Gold Cashback key. Rewards are tied to the extension install, not to a wallet address.
  identifier: 'poWGjQC4k3s8P4F0DCexaS0HmBiudKVvIllb8vSf',
  apiEndpoint: 'prod',
  cashbackPagePath: '',
  isEnabledByDefault: true,
  // Opens Bring's welcome page once on first install. It replaces our own install onboarding.
  onboarding: { on: true },
});
