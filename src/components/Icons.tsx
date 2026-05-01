import type { SVGProps } from 'react';

const baseProps: SVGProps<SVGSVGElement> = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

export const ChevronRight = (p: SVGProps<SVGSVGElement>) => (
  <svg {...baseProps} {...p}><path d="M9 18l6-6-6-6" /></svg>
);
export const ArrowLeft = (p: SVGProps<SVGSVGElement>) => (
  <svg {...baseProps} {...p}><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
);
export const Plus = (p: SVGProps<SVGSVGElement>) => (
  <svg {...baseProps} strokeWidth={2.5} {...p}><path d="M12 5v14M5 12h14" /></svg>
);
export const X = (p: SVGProps<SVGSVGElement>) => (
  <svg {...baseProps} strokeWidth={2.5} {...p}><path d="M18 6 6 18M6 6l12 12" /></svg>
);
export const Edit = (p: SVGProps<SVGSVGElement>) => (
  <svg {...baseProps} {...p}>
    <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
);
export const Trash = (p: SVGProps<SVGSVGElement>) => (
  <svg {...baseProps} {...p}>
    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
  </svg>
);
export const Logo = (p: SVGProps<SVGSVGElement>) => (
  <svg {...baseProps} {...p}>
    <path d="M12 2v20M2 12h20M5 5l14 14M19 5L5 19" />
  </svg>
);
export const Book = (p: SVGProps<SVGSVGElement>) => (
  <svg {...baseProps} {...p}>
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);
