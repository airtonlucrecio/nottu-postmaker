import { NottuColors } from '../colors/nottu-colors';
import { NottuFonts } from '../typography/nottu-fonts';
import { NottuSpacing } from '../spacing/nottu-spacing';

export const NottuTheme = {
  colors: NottuColors,
  fonts: NottuFonts,
  spacing: NottuSpacing,

  // Component variants
  components: {
    // Button variants
    button: {
      primary: {
        background: NottuColors.gradients.primary,
        color: '#FFFFFF',
        border: 'none',
        borderRadius: NottuSpacing.borderRadius.lg,
        padding: `${NottuSpacing.components.button.paddingY} ${NottuSpacing.components.button.paddingX}`,
        fontFamily: NottuFonts.presets.button.fontFamily,
        fontSize: NottuFonts.presets.button.fontSize,
        fontWeight: NottuFonts.presets.button.fontWeight,
        letterSpacing: NottuFonts.presets.button.letterSpacing,
        boxShadow: NottuSpacing.shadows.glow,
        transition: 'all 0.2s ease-in-out',
        cursor: 'pointer',
        '&:hover': {
          boxShadow: NottuSpacing.shadows.glowStrong,
          transform: 'translateY(-1px)',
        },
        '&:active': {
          transform: 'translateY(0)',
        },
        '&:disabled': {
          opacity: 0.5,
          cursor: 'not-allowed',
          boxShadow: 'none',
        },
      },
      secondary: {
        background: 'transparent',
        color: NottuColors.primary[500],
        border: `1px solid ${NottuColors.primary[500]}`,
        borderRadius: NottuSpacing.borderRadius.lg,
        padding: `${NottuSpacing.components.button.paddingY} ${NottuSpacing.components.button.paddingX}`,
        fontFamily: NottuFonts.presets.button.fontFamily,
        fontSize: NottuFonts.presets.button.fontSize,
        fontWeight: NottuFonts.presets.button.fontWeight,
        letterSpacing: NottuFonts.presets.button.letterSpacing,
        transition: 'all 0.2s ease-in-out',
        cursor: 'pointer',
        '&:hover': {
          background: NottuColors.primary[500],
          color: '#FFFFFF',
          boxShadow: NottuSpacing.shadows.glow,
        },
      },
      ghost: {
        background: 'transparent',
        color: NottuColors.dark[300],
        border: 'none',
        borderRadius: NottuSpacing.borderRadius.lg,
        padding: `${NottuSpacing.components.button.paddingY} ${NottuSpacing.components.button.paddingX}`,
        fontFamily: NottuFonts.presets.button.fontFamily,
        fontSize: NottuFonts.presets.button.fontSize,
        fontWeight: NottuFonts.presets.button.fontWeight,
        transition: 'all 0.2s ease-in-out',
        cursor: 'pointer',
        '&:hover': {
          background: NottuColors.dark[800],
          color: '#FFFFFF',
        },
      },
    },

    // Input variants
    input: {
      default: {
        background: NottuColors.dark[800],
        color: '#FFFFFF',
        border: `1px solid ${NottuColors.dark[700]}`,
        borderRadius: NottuSpacing.borderRadius.lg,
        padding: `${NottuSpacing.components.input.paddingY} ${NottuSpacing.components.input.paddingX}`,
        fontFamily: NottuFonts.presets.body.fontFamily,
        fontSize: NottuFonts.presets.body.fontSize,
        fontWeight: NottuFonts.presets.body.fontWeight,
        transition: 'all 0.2s ease-in-out',
        '&:focus': {
          outline: 'none',
          borderColor: NottuColors.primary[500],
          boxShadow: `0 0 0 3px ${NottuColors.primary[500]}20`,
        },
        '&::placeholder': {
          color: NottuColors.dark[400],
        },
      },
    },

    // Card variants
    card: {
      default: {
        background: NottuColors.dark[900],
        border: `1px solid ${NottuColors.dark[800]}`,
        borderRadius: NottuSpacing.borderRadius.xl,
        padding: NottuSpacing.components.card.padding,
        boxShadow: NottuSpacing.shadows.lg,
      },
      elevated: {
        background: NottuColors.dark[900],
        border: `1px solid ${NottuColors.dark[700]}`,
        borderRadius: NottuSpacing.borderRadius.xl,
        padding: NottuSpacing.components.card.padding,
        boxShadow: NottuSpacing.shadows.xl,
      },
      glow: {
        background: NottuColors.dark[900],
        border: `1px solid ${NottuColors.primary[500]}40`,
        borderRadius: NottuSpacing.borderRadius.xl,
        padding: NottuSpacing.components.card.padding,
        boxShadow: NottuSpacing.shadows.glow,
      },
    },

    // Chat message variants
    chatMessage: {
      user: {
        background: NottuColors.gradients.primary,
        color: '#FFFFFF',
        borderRadius: `${NottuSpacing.borderRadius.xl} ${NottuSpacing.borderRadius.xl} ${NottuSpacing.borderRadius.base} ${NottuSpacing.borderRadius.xl}`,
        padding: NottuSpacing.components.chat.messagePadding,
        marginLeft: 'auto',
        maxWidth: '80%',
        fontFamily: NottuFonts.presets.body.fontFamily,
        fontSize: NottuFonts.presets.body.fontSize,
        lineHeight: NottuFonts.presets.body.lineHeight,
      },
      assistant: {
        background: NottuColors.dark[800],
        color: '#FFFFFF',
        border: `1px solid ${NottuColors.dark[700]}`,
        borderRadius: `${NottuSpacing.borderRadius.xl} ${NottuSpacing.borderRadius.xl} ${NottuSpacing.borderRadius.xl} ${NottuSpacing.borderRadius.base}`,
        padding: NottuSpacing.components.chat.messagePadding,
        marginRight: 'auto',
        maxWidth: '80%',
        fontFamily: NottuFonts.presets.body.fontFamily,
        fontSize: NottuFonts.presets.body.fontSize,
        lineHeight: NottuFonts.presets.body.lineHeight,
      },
    },

    // Loading states
    loading: {
      skeleton: {
        background: `linear-gradient(90deg, ${NottuColors.dark[800]} 25%, ${NottuColors.dark[700]} 50%, ${NottuColors.dark[800]} 75%)`,
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
        borderRadius: NottuSpacing.borderRadius.base,
      },
      spinner: {
        border: `2px solid ${NottuColors.dark[700]}`,
        borderTop: `2px solid ${NottuColors.primary[500]}`,
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      },
    },
  },

  // Animations
  animations: {
    keyframes: {
      shimmer: {
        '0%': { backgroundPosition: '-200% 0' },
        '100%': { backgroundPosition: '200% 0' },
      },
      spin: {
        '0%': { transform: 'rotate(0deg)' },
        '100%': { transform: 'rotate(360deg)' },
      },
      fadeIn: {
        '0%': { opacity: 0 },
        '100%': { opacity: 1 },
      },
      slideUp: {
        '0%': { transform: 'translateY(10px)', opacity: 0 },
        '100%': { transform: 'translateY(0)', opacity: 1 },
      },
      slideDown: {
        '0%': { transform: 'translateY(-10px)', opacity: 0 },
        '100%': { transform: 'translateY(0)', opacity: 1 },
      },
      pulseGlow: {
        '0%, 100%': { boxShadow: NottuSpacing.shadows.glow },
        '50%': { boxShadow: NottuSpacing.shadows.glowStrong },
      },
    },
    durations: {
      fast: '0.15s',
      normal: '0.2s',
      slow: '0.3s',
    },
    easings: {
      easeInOut: 'ease-in-out',
      easeOut: 'ease-out',
      easeIn: 'ease-in',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
  },

  // Breakpoints
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  // Layout
  layout: {
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: `0 ${NottuSpacing.scale[4]}`,
    },
    sidebar: {
      width: NottuSpacing.components.sidebar.width,
      background: NottuColors.dark[950],
      borderRight: `1px solid ${NottuColors.dark[800]}`,
    },
    navbar: {
      height: NottuSpacing.components.navbar.height,
      background: NottuColors.dark[950],
      borderBottom: `1px solid ${NottuColors.dark[800]}`,
    },
  },
} as const;

export type NottuThemeComponent = keyof typeof NottuTheme.components;
export type NottuButtonVariant = keyof typeof NottuTheme.components.button;
export type NottuCardVariant = keyof typeof NottuTheme.components.card;