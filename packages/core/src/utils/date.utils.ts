export class DateUtils {
  /**
   * Formata uma data para string no formato YYYY-MM-DD
   */
  static formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Formata uma data para string no formato DD/MM/YYYY
   */
  static formatDateBR(date: Date): string {
    return date.toLocaleDateString('pt-BR');
  }

  /**
   * Formata uma data para timestamp legível
   */
  static formatTimestamp(date: Date): string {
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  /**
   * Gera um timestamp único para nomes de arquivo
   */
  static generateFileTimestamp(): string {
    return new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').split('.')[0];
  }

  /**
   * Calcula diferença em segundos entre duas datas
   */
  static diffInSeconds(start: Date, end: Date): number {
    return Math.floor((end.getTime() - start.getTime()) / 1000);
  }

  /**
   * Calcula diferença em minutos entre duas datas
   */
  static diffInMinutes(start: Date, end: Date): number {
    return Math.floor(this.diffInSeconds(start, end) / 60);
  }

  /**
   * Formata duração em segundos para string legível
   */
  static formatDuration(seconds: number): string {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes < 60) {
      return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    return `${hours}h ${remainingMinutes}m`;
  }

  /**
   * Verifica se uma data está dentro de um intervalo
   */
  static isDateInRange(date: Date, startDate?: Date, endDate?: Date): boolean {
    if (startDate && date < startDate) return false;
    if (endDate && date > endDate) return false;
    return true;
  }

  /**
   * Obtém o início do dia para uma data
   */
  static startOfDay(date: Date): Date {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  /**
   * Obtém o fim do dia para uma data
   */
  static endOfDay(date: Date): Date {
    const result = new Date(date);
    result.setHours(23, 59, 59, 999);
    return result;
  }

  /**
   * Adiciona dias a uma data
   */
  static addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  /**
   * Subtrai dias de uma data
   */
  static subtractDays(date: Date, days: number): Date {
    return this.addDays(date, -days);
  }

  /**
   * Verifica se uma data é hoje
   */
  static isToday(date: Date): boolean {
    const today = new Date();
    return this.formatDate(date) === this.formatDate(today);
  }

  /**
   * Verifica se uma data é ontem
   */
  static isYesterday(date: Date): boolean {
    const yesterday = this.subtractDays(new Date(), 1);
    return this.formatDate(date) === this.formatDate(yesterday);
  }

  /**
   * Obtém uma descrição relativa da data (hoje, ontem, X dias atrás)
   */
  static getRelativeDescription(date: Date): string {
    if (this.isToday(date)) return 'Hoje';
    if (this.isYesterday(date)) return 'Ontem';
    
    const today = new Date();
    const diffDays = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0) {
      return `${diffDays} dia${diffDays > 1 ? 's' : ''} atrás`;
    } else {
      return `Em ${Math.abs(diffDays)} dia${Math.abs(diffDays) > 1 ? 's' : ''}`;
    }
  }
}