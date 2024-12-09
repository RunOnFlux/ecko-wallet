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

declare module '@kadena/hd-wallet' {
  export function kadenaEncrypt(password: string, message: any): Promise<string>;
}
