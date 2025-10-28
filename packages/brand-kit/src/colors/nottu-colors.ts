export const NottuColors = {
  // Primary Brand Colors
  primary: {
    50: '#F0EFFF',
    100: '#E5E2FF',
    200: '#CCC8FF',
    300: '#A8A0FF',
    400: '#7C6EFF',
    500: '#4E3FE2', // Main brand purple
    600: '#3D32B8',
    700: '#2F268E',
    800: '#241D64',
    900: '#1A143A',
    950: '#0F0A20',
  },

  // Dark Theme Colors
  dark: {
    50: '#F7F7F8',
    100: '#EEEEF0',
    200: '#D9D9DC',
    300: '#B8B8BD',
    400: '#92929A',
    500: '#6B6B73',
    600: '#52525A',
    700: '#3F3F46',
    800: '#27272A',
    900: '#18181B',
    950: '#0A0A0F', // Main dark background
  },

  // Accent Colors
  accent: {
    cyan: '#00D9FF',
    green: '#00FF88',
    yellow: '#FFD700',
    orange: '#FF8C00',
    red: '#FF4444',
    pink: '#FF69B4',
  },

  // Semantic Colors
  semantic: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },

  // Gradients
  gradients: {
    primary: 'linear-gradient(135deg, #4E3FE2 0%, #7C6EFF 100%)',
    dark: 'linear-gradient(135deg, #0A0A0F 0%, #18181B 100%)',
    accent: 'linear-gradient(135deg, #4E3FE2 0%, #00D9FF 100%)',
    neon: 'linear-gradient(135deg, #4E3FE2 0%, #FF69B4 50%, #00D9FF 100%)',
  },
} as const;

export type NottuColorKey = keyof typeof NottuColors;
export type NottuColorShade = keyof typeof NottuColors.primary;