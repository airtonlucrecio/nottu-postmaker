export class StringUtils {
  /**
   * Gera um ID único baseado em timestamp e random
   */
  static generateId(prefix: string = ''): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return prefix ? `${prefix}_${timestamp}_${random}` : `${timestamp}_${random}`;
  }

  /**
   * Gera um ID curto para posts
   */
  static generatePostId(): string {
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, '');
    const random = Math.random().toString(36).substring(2, 5);
    return `post_${dateStr}_${timeStr}_${random}`;
  }

  /**
   * Capitaliza a primeira letra de uma string
   */
  static capitalize(str: string): string {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  /**
   * Converte string para title case
   */
  static toTitleCase(str: string): string {
    if (!str) return '';
    return str
      .toLowerCase()
      .split(' ')
      .map(word => this.capitalize(word))
      .join(' ');
  }

  /**
   * Remove acentos de uma string
   */
  static removeAccents(str: string): string {
    if (!str) return '';
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  /**
   * Converte string para slug (URL-friendly)
   */
  static toSlug(str: string): string {
    if (!str) return '';
    return this.removeAccents(str)
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  /**
   * Trunca uma string com ellipsis
   */
  static truncate(str: string, maxLength: number, suffix: string = '...'): string {
    if (!str || str.length <= maxLength) return str;
    return str.substring(0, maxLength - suffix.length) + suffix;
  }

  /**
   * Conta palavras em uma string
   */
  static countWords(str: string): number {
    if (!str) return 0;
    return str.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Estima tempo de leitura em minutos
   */
  static estimateReadingTime(str: string, wordsPerMinute: number = 200): number {
    const wordCount = this.countWords(str);
    return Math.ceil(wordCount / wordsPerMinute);
  }

  /**
   * Extrai hashtags de uma string
   */
  static extractHashtags(str: string): string[] {
    if (!str) return [];
    const hashtagRegex = /#[a-zA-Z0-9_]+/g;
    const matches = str.match(hashtagRegex);
    return matches ? matches.map(tag => tag.substring(1)) : [];
  }

  /**
   * Formata hashtags para exibição
   */
  static formatHashtags(hashtags: string[]): string {
    if (!hashtags || hashtags.length === 0) return '';
    return hashtags.map(tag => `#${tag}`).join(' ');
  }

  /**
   * Limpa e formata texto para caption
   */
  static formatCaption(text: string): string {
    if (!text) return '';
    return text
      .trim()
      .replace(/\s+/g, ' ') // Normaliza espaços
      .replace(/\n{3,}/g, '\n\n') // Limita quebras de linha
      .replace(/[^\w\s\n.,!?#@-]/g, '') // Remove caracteres especiais
      .trim();
  }

  /**
   * Valida se uma string contém apenas caracteres seguros
   */
  static isSafeText(str: string): boolean {
    if (!str) return true;
    // Permite letras, números, espaços e pontuação básica
    const safeRegex = /^[a-zA-Z0-9\s.,!?#@\-_()]+$/;
    return safeRegex.test(str);
  }

  /**
   * Escapa caracteres especiais para uso em regex
   */
  static escapeRegex(str: string): string {
    if (!str) return '';
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Gera uma string aleatória
   */
  static generateRandomString(length: number = 8): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Verifica se uma string é um email válido
   */
  static isValidEmail(email: string): boolean {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Mascara informações sensíveis
   */
  static maskSensitiveInfo(str: string, visibleChars: number = 4): string {
    if (!str || str.length <= visibleChars) return str;
    const visible = str.substring(0, visibleChars);
    const masked = '*'.repeat(str.length - visibleChars);
    return visible + masked;
  }

  /**
   * Converte bytes para string legível
   */
  static formatBytes(bytes: number, decimals: number = 2): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  /**
   * Pluraliza uma palavra baseada na quantidade
   */
  static pluralize(word: string, count: number, suffix: string = 's'): string {
    return count === 1 ? word : word + suffix;
  }
}