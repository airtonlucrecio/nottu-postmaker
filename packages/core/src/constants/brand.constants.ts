export const BRAND_COLORS = {
  primary: '#4E3FE2',
  secondary: '#0A0A0F',
  accent: '#6366F1',
  background: '#FFFFFF',
  surface: '#F8FAFC',
  text: {
    primary: '#0A0A0F',
    secondary: '#64748B',
    muted: '#94A3B8'
  },
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444'
} as const;

export const BRAND_FONTS = {
  primary: 'Inter',
  secondary: 'Poppins',
  mono: 'JetBrains Mono'
} as const;

export const BRAND_SPACING = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem',
  '3xl': '4rem'
} as const;

export const BRAND_RADIUS = {
  sm: '0.25rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
  '2xl': '1.5rem',
  full: '9999px'
} as const;

export const BRAND_SHADOWS = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
} as const;

export const BRAND_LOGO = {
  url: '/assets/nottu-logo.svg',
  width: 120,
  height: 40,
  alt: 'Nottu'
} as const;