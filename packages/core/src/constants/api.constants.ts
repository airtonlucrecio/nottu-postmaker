export const API_ENDPOINTS = {
  GENERATE: '/api/generate',
  HISTORY: '/api/history',
  SETTINGS: '/api/settings',
  HEALTH: '/api/health',
  QUEUE: '/api/queue'
} as const;

export const API_LIMITS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_REQUESTS_PER_MINUTE: 60,
  MAX_REQUESTS_PER_HOUR: 1000,
  MAX_CONCURRENT_JOBS: 5
} as const;

export const API_TIMEOUTS = {
  DEFAULT: 30000, // 30s
  AI_REQUEST: 120000, // 2min
  IMAGE_GENERATION: 300000, // 5min
  RENDER: 60000 // 1min
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  RATE_LIMIT: 429,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
} as const;