export const NottuLogo = {
  // SVG Logo Components
  svg: {
    // Main logo SVG
    main: `<svg width="120" height="40" viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="nottu-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#4E3FE2;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#7C6EFF;stop-opacity:1" />
        </linearGradient>
      </defs>
      <path d="M8 8h4v24h-4V8zm8 0h4l8 16V8h4v24h-4l-8-16v16h-4V8zm16 0h4v20h8v4H32V8zm16 0h4v20h8v4H48V8zm20 0h4v24h-4V8z" fill="url(#nottu-gradient)"/>
      <circle cx="84" cy="20" r="3" fill="url(#nottu-gradient)"/>
      <path d="M92 8h4v24h-4V8zm8 0h4v4h-4V8zm0 8h4v16h-4V16zm8-8h4v24h-4V8zm8 0h4v4h-4V8zm0 8h4v16h-4V16z" fill="url(#nottu-gradient)"/>
    </svg>`,

    // Icon only (symbol)
    icon: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="nottu-icon-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#4E3FE2;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#7C6EFF;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="24" height="24" rx="6" fill="url(#nottu-icon-gradient)"/>
      <path d="M10 12h2v8h-2v-8zm4 0h2l3 6v-6h2v8h-2l-3-6v6h-2v-8z" fill="white"/>
      <circle cx="22" cy="16" r="1.5" fill="white"/>
    </svg>`,

    // Monogram (N)
    monogram: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="nottu-mono-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#4E3FE2;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#7C6EFF;stop-opacity:1" />
        </linearGradient>
      </defs>
      <path d="M4 4h4v16h-4V4zm8 0h4l4 8V4h4v16h-4l-4-8v8h-4V4z" fill="url(#nottu-mono-gradient)"/>
    </svg>`,
  },

  // Base64 encoded versions for use in templates
  base64: {
    main: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjQwIiB2aWV3Qm94PSIwIDAgMTIwIDQwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxsaW5lYXJHcmFkaWVudCBpZD0ibm90dHUtZ3JhZGllbnQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjAlIj48c3RvcCBvZmZzZXQ9IjAlIiBzdHlsZT0ic3RvcC1jb2xvcjojNEUzRkUyO3N0b3Atb3BhY2l0eToxIiAvPjxzdG9wIG9mZnNldD0iMTAwJSIgc3R5bGU9InN0b3AtY29sb3I6IzdDNkVGRjtzdG9wLW9wYWNpdHk6MSIgLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cGF0aCBkPSJNOCA4aDR2MjRoLTRWOHptOCAwaDRsOCAxNlY4aDR2MjRoLTRsLTgtMTZ2MTZoLTRWOHptMTYgMGg0djIwaDh2NEgzMlY4em0xNiAwaDR2MjBoOHY0SDQ4Vjh6bTIwIDBoNHYyNGgtNFY4eiIgZmlsbD0idXJsKCNub3R0dS1ncmFkaWVudCkiLz48Y2lyY2xlIGN4PSI4NCIgY3k9IjIwIiByPSIzIiBmaWxsPSJ1cmwoI25vdHR1LWdyYWRpZW50KSIvPjxwYXRoIGQ9Ik05MiA4aDR2MjRoLTRWOHptOCAwaDR2NGgtNFY4em0wIDhoNHYxNmgtNFYxNnptOC04aDR2MjRoLTRWOHptOCAwaDR2NGgtNFY4em0wIDhoNHYxNmgtNFYxNnoiIGZpbGw9InVybCgjbm90dHUtZ3JhZGllbnQpIi8+PC9zdmc+',
    icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9Im5vdHR1LWljb24tZ3JhZGllbnQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiM0RTNGRTI7c3RvcC1vcGFjaXR5OjEiIC8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjojN0M2RUZGO3N0b3Atb3BhY2l0eToxIiAvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxyZWN0IHg9IjQiIHk9IjQiIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgcng9IjYiIGZpbGw9InVybCgjbm90dHUtaWNvbi1ncmFkaWVudCkiLz48cGF0aCBkPSJNMTAgMTJoMnY4aC0ydi04em00IDBoMmwzIDZ2LTZoMnY4aC0ybC0zLTZ2NmgtMnYtOHoiIGZpbGw9IndoaXRlIi8+PGNpcmNsZSBjeD0iMjIiIGN5PSIxNiIgcj0iMS41IiBmaWxsPSJ3aGl0ZSIvPjwvc3ZnPg==',
    monogram: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9Im5vdHR1LW1vbm8tZ3JhZGllbnQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiM0RTNGRTI7c3RvcC1vcGFjaXR5OjEiIC8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjojN0M2RUZGO3N0b3Atb3BhY2l0eToxIiAvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxwYXRoIGQ9Ik00IDRoNHYxNmgtNFY0em04IDBoNGw0IDhWNGg0djE2aC00bC00LTh2OGgtNFY0eiIgZmlsbD0idXJsKCNub3R0dS1tb25vLWdyYWRpZW50KSIvPjwvc3ZnPg==',
  },

  // Logo positioning options
  positions: {
    'top-left': {
      top: '20px',
      left: '20px',
      transform: 'none',
    },
    'top-right': {
      top: '20px',
      right: '20px',
      transform: 'none',
    },
    'bottom-left': {
      bottom: '20px',
      left: '20px',
      transform: 'none',
    },
    'bottom-right': {
      bottom: '20px',
      right: '20px',
      transform: 'none',
    },
    'center': {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    },
  },

  // Logo sizes
  sizes: {
    xs: { width: '60px', height: '20px' },
    sm: { width: '90px', height: '30px' },
    md: { width: '120px', height: '40px' },
    lg: { width: '150px', height: '50px' },
    xl: { width: '180px', height: '60px' },
  },

  // Logo variants for different backgrounds
  variants: {
    light: {
      filter: 'none',
      opacity: 1,
    },
    dark: {
      filter: 'brightness(1.2)',
      opacity: 1,
    },
    overlay: {
      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
      opacity: 0.9,
    },
    subtle: {
      filter: 'none',
      opacity: 0.7,
    },
  },

  // Animation presets
  animations: {
    fadeIn: {
      animation: 'fadeIn 0.5s ease-in-out',
    },
    slideIn: {
      animation: 'slideIn 0.3s ease-out',
    },
    glow: {
      animation: 'pulseGlow 2s ease-in-out infinite',
    },
  },
} as const;

export type NottuLogoSize = keyof typeof NottuLogo.sizes;
export type NottuLogoPosition = keyof typeof NottuLogo.positions;
export type NottuLogoVariant = keyof typeof NottuLogo.variants;