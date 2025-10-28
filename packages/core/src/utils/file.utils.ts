import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const mkdir = promisify(fs.mkdir);
const access = promisify(fs.access);
const stat = promisify(fs.stat);

export class FileUtils {
  /**
   * Cria um diretório se não existir
   */
  static async ensureDir(dirPath: string): Promise<void> {
    try {
      await access(dirPath);
    } catch {
      await mkdir(dirPath, { recursive: true });
    }
  }

  /**
   * Verifica se um arquivo ou diretório existe
   */
  static async exists(filePath: string): Promise<boolean> {
    try {
      await access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Gera um nome de arquivo único baseado em timestamp
   */
  static generateUniqueFileName(prefix: string = 'post', extension: string = 'png'): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}_${timestamp}_${random}.${extension}`;
  }

  /**
   * Cria a estrutura de pastas para um post
   */
  static async createPostFolder(basePath: string, date?: Date): Promise<string> {
    const postDate = date || new Date();
    const dateStr = postDate.toISOString().split('T')[0]; // YYYY-MM-DD
    const folderPath = path.join(basePath, dateStr);
    
    await this.ensureDir(folderPath);
    return folderPath;
  }

  /**
   * Salva dados JSON em arquivo
   */
  static async saveJSON(filePath: string, data: any): Promise<void> {
    const jsonData = JSON.stringify(data, null, 2);
    await writeFile(filePath, jsonData, 'utf8');
  }

  /**
   * Carrega dados JSON de arquivo
   */
  static async loadJSON<T>(filePath: string): Promise<T> {
    const data = await readFile(filePath, 'utf8');
    return JSON.parse(data) as T;
  }

  /**
   * Salva texto em arquivo
   */
  static async saveText(filePath: string, content: string): Promise<void> {
    await writeFile(filePath, content, 'utf8');
  }

  /**
   * Salva buffer (imagem) em arquivo
   */
  static async saveBuffer(filePath: string, buffer: Buffer): Promise<void> {
    await writeFile(filePath, buffer);
  }

  /**
   * Obtém informações de um arquivo
   */
  static async getFileInfo(filePath: string): Promise<{
    size: number;
    created: Date;
    modified: Date;
    isFile: boolean;
    isDirectory: boolean;
  }> {
    const stats = await stat(filePath);
    return {
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory(),
    };
  }

  /**
   * Sanitiza nome de arquivo removendo caracteres inválidos
   */
  static sanitizeFileName(fileName: string): string {
    return fileName
      .replace(/[<>:"/\\|?*]/g, '_')
      .replace(/\s+/g, '_')
      .toLowerCase();
  }

  /**
   * Gera caminho completo para assets do post
   */
  static generatePostPaths(folderPath: string, postId: string) {
    const baseName = this.sanitizeFileName(postId);
    
    return {
      imagePath: path.join(folderPath, `${baseName}.png`),
      captionPath: path.join(folderPath, `${baseName}_caption.txt`),
      hashtagsPath: path.join(folderPath, `${baseName}_hashtags.txt`),
      metadataPath: path.join(folderPath, `${baseName}_metadata.json`),
    };
  }
}