// lib/serverBackendTokenManager.ts
// Gerenciador do JWT do backend no servidor Next.js: gera o token a partir da sessão (auth()),
// reutiliza enquanto válido (com 2 minutos de margem) e evita gerações simultâneas.

import 'server-only';
import { auth } from '@/auth';
import { generateJwtToken } from '@/lib/backend-jwt-token-generator';
/** Cache em memória do JWT do backend no servidor. */
class serverBackendTokenManager {
  private token: string | null = null;
  private expiryTime: number = 0;
  private isGenerating: boolean = false;
  private generatePromise: Promise<string> | null = null;

  private readonly TOKEN_EXPIRY_MS =
    (Number(process.env.BACKEND_TOKEN_EXPIRATION) || 15) * 60 * 1000;
  private readonly SAFETY_MARGIN_MS = 2 * 60 * 1000;

  /**
   * Retorna o token em cache ou gera um novo a partir da sessão atual; chamadas concorrentes
   * compartilham a mesma geração.
   */
  async getToken(): Promise<string> {
    const now = Date.now();

    if (this.token && now < this.expiryTime - this.SAFETY_MARGIN_MS) {
      console.log('[BackendTokenManager] Token válido, reutilizando');
      return this.token;
    }

    if (this.isGenerating && this.generatePromise) {
      console.log('[BackendTokenManager] Aguardando token sendo gerado...');
      return this.generatePromise;
    }

    console.log('[BackendTokenManager] Gerando novo token JWT...');
    this.isGenerating = true;

    this.generatePromise = (async () => {
      try {
        const session = await auth();

        if (!session?.user) {
          throw new Error('Usuário não autenticado');
        }

        const newToken = await generateJwtToken(session);

        if (!newToken) {
          throw new Error('Token não foi gerado');
        }

        this.token = newToken;
        this.expiryTime = Date.now() + this.TOKEN_EXPIRY_MS;

        console.log(
          `[BackendTokenManager] Token gerado com sucesso (expira em ${this.TOKEN_EXPIRY_MS / 1000}s)`,
        );
        return newToken;
      } catch (error) {
        console.error('[BackendTokenManager] Erro ao gerar token:', error);
        throw error;
      } finally {
        this.isGenerating = false;
        this.generatePromise = null;
      }
    })();

    return this.generatePromise;
  }

  /** Descarta o token em cache. */
  invalidate(): void {
    console.log('[BackendTokenManager] Invalidando token...');
    this.token = null;
    this.expiryTime = 0;
    this.isGenerating = false;
    this.generatePromise = null;
  }

  /** Indica se o token em cache ainda vale, considerando a margem de segurança. */
  isValid(): boolean {
    if (!this.token) return false;
    const now = Date.now();
    return now < this.expiryTime - this.SAFETY_MARGIN_MS;
  }

  /** Segundos restantes até o token expirar (0 sem token). */
  getTimeRemaining(): number {
    if (!this.token) return 0;
    const remaining = (this.expiryTime - Date.now()) / 1000;
    return Math.max(0, Math.floor(remaining));
  }
}
/** Instância única do servidor. */
export const serverTokenManager = new serverBackendTokenManager();
