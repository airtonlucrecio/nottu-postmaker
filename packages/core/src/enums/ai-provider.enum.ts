export enum AIProvider {
  OPENAI = 'openai',
  DALLE = 'dalle'
}

export enum AIProviderType {
  TEXT = 'text',
  IMAGE = 'image'
}

export enum ImageSize {
  SQUARE_1024 = '1024x1024',
  PORTRAIT_1024 = '1024x1792',
  LANDSCAPE_1024 = '1792x1024',
  INSTAGRAM_SQUARE = '1080x1080',
  INSTAGRAM_PORTRAIT = '1080x1350',
  INSTAGRAM_LANDSCAPE = '1350x1080'
}

export enum ImageQuality {
  STANDARD = 'standard',
  HD = 'hd',
  ULTRA = 'ultra'
}