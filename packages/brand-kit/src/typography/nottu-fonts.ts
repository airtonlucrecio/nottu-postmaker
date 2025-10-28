export const NottuFonts = {
  // Font Families
  families: {
    heading: 'Orbitron, "Courier New", monospace',
    body: 'JetBrains Mono, "Consolas", monospace',
    ui: 'IBM Plex Sans, "Segoe UI", system-ui, sans-serif',
    display: 'Orbitron, "Arial Black", sans-serif',
  },

  // Font Weights
  weights: {
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },

  // Font Sizes (in rem)
  sizes: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem',    // 48px
    '6xl': '3.75rem', // 60px
    '7xl': '4.5rem',  // 72px
  },

  // Line Heights
  lineHeights: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },

  // Letter Spacing
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },

  // Typography Presets
  presets: {
    // Headings
    h1: {
      fontFamily: 'Orbitron, "Courier New", monospace',
      fontSize: '3rem',
      fontWeight: 700,
      lineHeight: '1.25',
      letterSpacing: '-0.025em',
    },
    h2: {
      fontFamily: 'Orbitron, "Courier New", monospace',
      fontSize: '2.25rem',
      fontWeight: 700,
      lineHeight: '1.25',
      letterSpacing: '-0.025em',
    },
    h3: {
      fontFamily: 'Orbitron, "Courier New", monospace',
      fontSize: '1.875rem',
      fontWeight: 600,
      lineHeight: '1.375',
      letterSpacing: 'normal',
    },
    h4: {
      fontFamily: 'IBM Plex Sans, "Segoe UI", system-ui, sans-serif',
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: '1.375',
      letterSpacing: 'normal',
    },
    h5: {
      fontFamily: 'IBM Plex Sans, "Segoe UI", system-ui, sans-serif',
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: '1.5',
      letterSpacing: 'normal',
    },
    h6: {
      fontFamily: 'IBM Plex Sans, "Segoe UI", system-ui, sans-serif',
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: '1.5',
      letterSpacing: 'normal',
    },

    // Body Text
    bodyLarge: {
      fontFamily: 'IBM Plex Sans, "Segoe UI", system-ui, sans-serif',
      fontSize: '1.125rem',
      fontWeight: 400,
      lineHeight: '1.625',
      letterSpacing: 'normal',
    },
    body: {
      fontFamily: 'IBM Plex Sans, "Segoe UI", system-ui, sans-serif',
      fontSize: '1rem',
      fontWeight: 400,
      lineHeight: '1.5',
      letterSpacing: 'normal',
    },
    bodySmall: {
      fontFamily: 'IBM Plex Sans, "Segoe UI", system-ui, sans-serif',
      fontSize: '0.875rem',
      fontWeight: 400,
      lineHeight: '1.5',
      letterSpacing: 'normal',
    },

    // Code/Monospace
    code: {
      fontFamily: 'JetBrains Mono, "Consolas", monospace',
      fontSize: '0.875rem',
      fontWeight: 400,
      lineHeight: '1.5',
      letterSpacing: 'normal',
    },
    codeInline: {
      fontFamily: 'JetBrains Mono, "Consolas", monospace',
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: '1.5',
      letterSpacing: 'normal',
    },

    // UI Elements
    button: {
      fontFamily: 'IBM Plex Sans, "Segoe UI", system-ui, sans-serif',
      fontSize: '0.875rem',
      fontWeight: 600,
      lineHeight: '1.25',
      letterSpacing: '0.025em',
    },
    buttonLarge: {
      fontFamily: 'IBM Plex Sans, "Segoe UI", system-ui, sans-serif',
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: '1.25',
      letterSpacing: '0.025em',
    },
    label: {
      fontFamily: 'IBM Plex Sans, "Segoe UI", system-ui, sans-serif',
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: '1.25',
      letterSpacing: 'normal',
    },
    caption: {
      fontFamily: 'IBM Plex Sans, "Segoe UI", system-ui, sans-serif',
      fontSize: '0.75rem',
      fontWeight: 400,
      lineHeight: '1.25',
      letterSpacing: 'normal',
    },

    // Display Text
    display: {
      fontFamily: 'Orbitron, "Arial Black", sans-serif',
      fontSize: '4.5rem',
      fontWeight: 800,
      lineHeight: '1',
      letterSpacing: '-0.05em',
    },
    displaySmall: {
      fontFamily: 'Orbitron, "Arial Black", sans-serif',
      fontSize: '3.75rem',
      fontWeight: 700,
      lineHeight: '1',
      letterSpacing: '-0.025em',
    },
  },
} as const;

export type NottuFontFamily = keyof typeof NottuFonts.families;
export type NottuFontWeight = keyof typeof NottuFonts.weights;
export type NottuFontSize = keyof typeof NottuFonts.sizes;
export type NottuFontPreset = keyof typeof NottuFonts.presets;