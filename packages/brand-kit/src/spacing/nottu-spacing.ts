export const NottuSpacing = {
  // Base spacing scale (in rem)
  scale: {
    0: '0',
    px: '1px',
    0.5: '0.125rem',  // 2px
    1: '0.25rem',     // 4px
    1.5: '0.375rem',  // 6px
    2: '0.5rem',      // 8px
    2.5: '0.625rem',  // 10px
    3: '0.75rem',     // 12px
    3.5: '0.875rem',  // 14px
    4: '1rem',        // 16px
    5: '1.25rem',     // 20px
    6: '1.5rem',      // 24px
    7: '1.75rem',     // 28px
    8: '2rem',        // 32px
    9: '2.25rem',     // 36px
    10: '2.5rem',     // 40px
    11: '2.75rem',    // 44px
    12: '3rem',       // 48px
    14: '3.5rem',     // 56px
    16: '4rem',       // 64px
    20: '5rem',       // 80px
    24: '6rem',       // 96px
    28: '7rem',       // 112px
    32: '8rem',       // 128px
    36: '9rem',       // 144px
    40: '10rem',      // 160px
    44: '11rem',      // 176px
    48: '12rem',      // 192px
    52: '13rem',      // 208px
    56: '14rem',      // 224px
    60: '15rem',      // 240px
    64: '16rem',      // 256px
    72: '18rem',      // 288px
    80: '20rem',      // 320px
    96: '24rem',      // 384px
  },

  // Component-specific spacing
  components: {
    // Buttons
    button: {
      paddingX: '1rem',
      paddingY: '0.5rem',
      gap: '0.5rem',
    },
    buttonLarge: {
      paddingX: '1.5rem',
      paddingY: '0.75rem',
      gap: '0.75rem',
    },
    buttonSmall: {
      paddingX: '0.75rem',
      paddingY: '0.375rem',
      gap: '0.375rem',
    },

    // Cards
    card: {
      padding: '1.5rem',
      gap: '1rem',
      borderRadius: '0.75rem',
    },
    cardCompact: {
      padding: '1rem',
      gap: '0.75rem',
      borderRadius: '0.5rem',
    },

    // Forms
    input: {
      paddingX: '0.75rem',
      paddingY: '0.5rem',
      borderRadius: '0.5rem',
    },
    inputLarge: {
      paddingX: '1rem',
      paddingY: '0.75rem',
      borderRadius: '0.75rem',
    },

    // Layout
    container: {
      paddingX: '1rem',
      maxWidth: '1200px',
    },
    section: {
      paddingY: '4rem',
      gap: '2rem',
    },
    grid: {
      gap: '1.5rem',
    },

    // Navigation
    navbar: {
      height: '4rem',
      paddingX: '1rem',
    },
    sidebar: {
      width: '16rem',
      padding: '1rem',
    },

    // Chat Interface
    chat: {
      messageGap: '1rem',
      messagePadding: '1rem',
      inputPadding: '0.75rem',
      avatarSize: '2.5rem',
    },

    // Preview
    preview: {
      padding: '2rem',
      gap: '1.5rem',
      borderRadius: '1rem',
    },
  },

  // Border radius scale
  borderRadius: {
    none: '0',
    sm: '0.125rem',   // 2px
    base: '0.25rem',  // 4px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    '2xl': '1rem',    // 16px
    '3xl': '1.5rem',  // 24px
    full: '9999px',
  },

  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
    none: '0 0 #0000',
    
    // Nottu-specific shadows
    glow: '0 0 20px rgb(78 63 226 / 0.3)',
    glowStrong: '0 0 40px rgb(78 63 226 / 0.5)',
    neon: '0 0 5px rgb(78 63 226 / 0.5), 0 0 10px rgb(78 63 226 / 0.3), 0 0 15px rgb(78 63 226 / 0.2)',
  },

  // Z-index scale
  zIndex: {
    hide: -1,
    auto: 'auto',
    base: 0,
    docked: 10,
    dropdown: 1000,
    sticky: 1100,
    banner: 1200,
    overlay: 1300,
    modal: 1400,
    popover: 1500,
    skipLink: 1600,
    toast: 1700,
    tooltip: 1800,
  },
} as const;

export type NottuSpacingScale = keyof typeof NottuSpacing.scale;
export type NottuBorderRadius = keyof typeof NottuSpacing.borderRadius;
export type NottuShadow = keyof typeof NottuSpacing.shadows;
export type NottuZIndex = keyof typeof NottuSpacing.zIndex;