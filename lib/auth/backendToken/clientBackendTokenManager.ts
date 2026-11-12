// lib/auth/backendToken/clientBackendTokenManager.ts
// Gerenciador do JWT do backend no navegador: busca o token em /api/auth/back/token, reutiliza
// enquanto válido (renovado com a margem de tokenConfig.ts) e evita requisições simultâneas.

import { BACKEND_TOKEN_EXPIRY_MS, BACKEND_TOKEN_RENEW_MARGIN_MS } from './tokenConfig';

/** Cache em memória do JWT do backend para o navegador. */
class clientBackendTokenManager {
  private token: string | null = null;
  private expiryTime: number = 0;
  private isGenerating: boolean = false;
  private generatePromise: Promise<string> | null = null;

  /**
   * Retorna o token em cache ou busca um novo; chamadas concorrentes compartilham a mesma
   * requisição.
   */
  async getToken(): Promise<string> {
    const now = Date.now();

    // Token em cache ainda válido
    if (this.token && now < this.expiryTime - BACKEND_TOKEN_RENEW_MARGIN_MS) {
      console.log('[TokenManager] Token válido, reutilizando');
      return this.token;
    }

    // Requisição de token já em andamento
    if (this.isGenerating && this.generatePromise) {
      console.log('[TokenManager] Aguardando token sendo gerado...');
      return this.generatePromise;
    }

    // Busca um novo token na API do Next.js
    console.log('[TokenManager] Gerando novo token JWT...');
    this.isGenerating = true;

    this.generatePromise = (async () => {
      try {
        const res = await fetch('/api/auth/back/token');

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || `Erro ao obter token: ${res.status}`);
        }

        const data = await res.json();
        const newToken = data.token || '';

        if (!newToken) {
          throw new Error('Token não retornado pela API');
        }

        this.token = newToken;
        this.expiryTime = Date.now() + BACKEND_TOKEN_EXPIRY_MS;

        console.log(
          `[TokenManager] Token gerado com sucesso (expira em ${BACKEND_TOKEN_EXPIRY_MS / 1000}s)`,
        );
        return newToken;
      } catch (error) {
        console.error('[TokenManager] Erro ao gerar token:', error);
        throw error;
      } finally {
        this.isGenerating = false;
        this.generatePromise = null;
      }
    })();

    return this.generatePromise;
  }

  /** Descarta o token em cache (ex.: após 401). */
  invalidate(): void {
    console.log('[TokenManager] Invalidando token...');
    this.token = null;
    this.expiryTime = 0;
    this.isGenerating = false;
    this.generatePromise = null;
  }

  /** Indica se o token em cache ainda vale, considerando a margem de segurança. */
  isValid(): boolean {
    if (!this.token) return false;
    const now = Date.now();
    return now < this.expiryTime - BACKEND_TOKEN_RENEW_MARGIN_MS;
  }

  /** Segundos restantes até o token expirar (0 sem token). */
  getTimeRemaining(): number {
    if (!this.token) return 0;
    const remaining = (this.expiryTime - Date.now()) / 1000;
    return Math.max(0, Math.floor(remaining));
  }
}

/** Instância única usada pelo backendApiCall. */
export const clientTokenManager = new clientBackendTokenManager();
