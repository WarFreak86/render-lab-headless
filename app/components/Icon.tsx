export type IconName =
  | 'account'
  | 'arrow-left'
  | 'arrow-right'
  | 'cart'
  | 'chevron-down'
  | 'close'
  | 'checkout'
  | 'details'
  | 'edition'
  | 'material'
  | 'menu'
  | 'search';

export function Icon({
  name,
  size = 20,
}: {
  name: IconName;
  size?: number;
}) {
  const shared = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    focusable: false,
  };

  switch (name) {
    case 'account':
      return (
        <svg {...shared}>
          <circle cx="12" cy="7.25" r="3.25" />
          <path d="M5.25 20c.45-4.1 2.75-6.15 6.75-6.15S18.3 15.9 18.75 20" />
        </svg>
      );
    case 'arrow-left':
      return (
        <svg {...shared}>
          <path d="M19 12H5M10 7l-5 5 5 5" />
        </svg>
      );
    case 'arrow-right':
      return (
        <svg {...shared}>
          <path d="M5 12h14M14 7l5 5-5 5" />
        </svg>
      );
    case 'cart':
      return (
        <svg {...shared}>
          <path d="M3.5 4.5h2l1.65 10.1h10.7l1.65-7.1H6" />
          <path d="M8.25 18.75h.01M17 18.75h.01" />
        </svg>
      );
    case 'chevron-down':
      return (
        <svg {...shared}>
          <path d="m7 9.5 5 5 5-5" />
        </svg>
      );
    case 'close':
      return (
        <svg {...shared}>
          <path d="m5.5 5.5 13 13M18.5 5.5l-13 13" />
        </svg>
      );
    case 'checkout':
      return (
        <svg {...shared}>
          <path d="M7 10V7a5 5 0 0 1 10 0v3" />
          <rect x="4.5" y="10" width="15" height="10" rx="1.5" />
          <path d="M12 14v2.5" />
        </svg>
      );
    case 'details':
      return (
        <svg {...shared}>
          <path d="M6 3.5h9l3 3V20H6z" />
          <path d="M15 3.5V7h3M9 11h6M9 15h6" />
        </svg>
      );
    case 'edition':
      return (
        <svg {...shared}>
          <path d="m12 3 2.2 2.3 3.2-.2.2 3.2L20 10.5l-1.8 2.6.8 3-3 1-1.3 2.9-2.7-1.5L9.3 20 8 17.1l-3-1 .8-3L4 10.5l2.4-2.2.2-3.2 3.2.2z" />
          <path d="m9.5 11.5 1.7 1.7 3.6-3.7" />
        </svg>
      );
    case 'material':
      return (
        <svg {...shared}>
          <path d="m12 3 8 5-8 5-8-5z" />
          <path d="m4 12 8 5 8-5M4 16l8 5 8-5" />
        </svg>
      );
    case 'menu':
      return (
        <svg {...shared}>
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      );
    case 'search':
      return (
        <svg {...shared}>
          <circle cx="10.5" cy="10.5" r="6" />
          <path d="m15 15 4.5 4.5" />
        </svg>
      );
  }
}
