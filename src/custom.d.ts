declare module '*.svg' {
  import * as React from 'react';
  // TEMPORARY
  const SVGComponent: any;

  export default SVGComponent;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}
