declare module '*.svg' {
  import * as React from 'react';
  // TEMPORARY
  const SVGComponent: any;

  export default SVGComponent;
}

declare module '*.svg?react' {
  import React from 'react';
  const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>;
  export default ReactComponent;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

// declare module '@kadena/hd-wallet/chainweaver' {
//   export const legacyKadenaGenMnemonic: () => string;

//   export const legacyKadenaMnemonicToRootKeypair: (password: string | Uint8Array, mnemonic: string) => Promise<Uint8Array>;

//   export const legacyKadenaGenKeypair: (
//     password: string | Uint8Array,
//     rootKey: string | Uint8Array,
//     index: number,
//   ) => Promise<[Uint8Array, Uint8Array]>;

//   export const kadenaGenMnemonic: () => string;
//   export const kadenaGenKeypair: () => string;
// }
