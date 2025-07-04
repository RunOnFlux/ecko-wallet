import images from '../images';

export const ECKO_DEXTOOLS_API_URL = 'https://api-dexscan.eckowallet.com/';

export const OptionSelect = {
  ConnectedSite: 0,
  ViewExplorer: 1,
  ExportPrivateKey: 2,
  RemoveWallet: 3,
  FinishTransfer: 5,
  DetailTrans: 6,
  Close: 4,
};

export const BUTTON_SIZE = {
  NORMAL: 'normal',
  FULL: 'full',
};

export const BUTTON_TYPE = {
  ACTIVE: 'active',
  DISABLE: 'disabled',
  TRANSPARENT: 'transparent',
  REMOVE: 'remove',
};

export const GAS_PAYER = [{ value: 0, label: 'Public Gas Station' }];

export const ACTIVE_TAB = {
  HOME: 'home',
  SETTINGS: 'settings',
  NFT: 'nft',
  ANALYTICS: 'analytics',
};

export const CHAIN_COUNT = 20;

export const KNOWN_TOKENS = {
  'runonflux.flux': {
    symbol: 'flux',
    coingeckoId: 'zelcash',
  },
  'kaddex.kdx': {
    symbol: 'kdx',
  },
  'hypercent.prod-hype-coin': {
    symbol: 'hype',
  },
  'kdlaunch.token': {
    symbol: 'kdl',
  },
  'free.anedak': {
    symbol: 'anedak',
  },
  'free.babena': {
    symbol: 'babena',
  },
  'mok.token': {
    symbol: 'mok',
  },
  'lago.kwUSDC': {
    symbol: 'usdc',
  },
  'kaddex.skdx': {
    symbol: 'skdx',
  },
};

const baseTokenList = [
  'arkade.token',
  'coin',
  'free.KAYC',
  'free.KSVT',
  'free.SHIB',
  'free.anedak',
  'free.ba-t2',
  'free.ba-t3',
  'free.babena',
  'free.backalley',
  'free.backalley-token',
  'free.catter',
  'free.corona-inu',
  'free.corona-token',
  'free.crankk01',
  'free.dbc-token',
  'free.docu',
  'free.dummy-token',
  'free.hyperhub',
  'free.jodie-inu',
  'free.jodie-token',
  'free.kaddex',
  'free.kadoge',
  'free.kapybara-token',
  'free.kishu-ken',
  'free.nancy',
  'free.newest-token-admin',
  'free.phiga-inu',
  'free.real-kdoge',
  'free.scar',
  'free.shatter',
  'free.simplesales5',
  'free.simplesales6',
  'free.sway',
  'free.test-kFRAX',
  'free.testflux',
  'free.timpi',
  'free.www',
  'free.yeettoken',
  'free.zrb',
  'hypercent.prod-hype-coin',
  'kaddex.kdx',
  'kdlaunch.kdswap-token',
  'kdlaunch.token',
  'lago.USD2',
  'lago.kwBTC',
  'lago.kwUSDC',
  'mok.token',
  'runonflux.flux',
  'runonflux.testflux',
];

export const NON_TRANSFERABLE_TOKENS = ['kaddex.skdx'];

export const CHAIN_AVAILABLE_TOKENS_FIXTURE = [
  baseTokenList,
  baseTokenList.filter((tk) => tk !== 'lago.kwUSDC'),
  baseTokenList,
  baseTokenList,
  baseTokenList,
  baseTokenList,
  baseTokenList,
  baseTokenList,
  baseTokenList,
  baseTokenList,
  baseTokenList,
  baseTokenList,
  baseTokenList,
  baseTokenList,
  baseTokenList,
  baseTokenList,
  baseTokenList,
  baseTokenList,
  baseTokenList,
  baseTokenList,
];

export const SETTINGS_STORAGE_KEY = 'settingsV2';

export const getTokenImageUrl = (contractAddress: string) => `${ECKO_DEXTOOLS_API_URL}api/token-icon?token=${encodeURIComponent(contractAddress)}`;
