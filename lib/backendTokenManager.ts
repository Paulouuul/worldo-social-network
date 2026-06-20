// lib/backendTokenManager.ts
class BackendTokenManager {
  private token: string | null = null;
  private expiryTime: number = 0;
  private isGenerating: boolean = false;
  private generatePromise: Promise<string> | null = null;
  
  // Configurações
  private readonly TOKEN_EXPIRY_MS = (Number(process.env.BACKEND_TOKEN_EXPIRATION) || 15) * 60 * 1000;
  private readonly SAFETY_MARGIN_MS = 2 * 60 * 1000;

  /**
   * Obtém um token válido. Se expirou ou não existe, gera um novo.
   * Só gera quando realmente precisa.
   */
  async getToken(): Promise<string> {
    const now = Date.now();
    
    // Se token existe e ainda é válido, retorna
    if (this.token && now < this.expiryTime - this.SAFETY_MARGIN_MS) {
      console.log('[TokenManager] Token válido, reutilizando');
      return this.token;
    }

    // Se já está gerando um token, aguarda
    if (this.isGenerating && this.generatePromise) {
      console.log('[TokenManager] Aguardando token sendo gerado...');
      return this.generatePromise;
    }

    // Gera novo token via API
    console.log('[TokenManager] Gerando novo token JWT...');
    this.isGenerating = true;
    
    this.generatePromise = (async () => {
      try {
        const res = await fetch('/api/auth/token');
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || `Erro ao obter token: ${res.status}`);
        }
        
        const data = await res.json();
        const newToken = data.token || "";
        
        if (!newToken) {
          throw new Error('Token não retornado pela API');
        }
        
        this.token = newToken;
        this.expiryTime = Date.now() + this.TOKEN_EXPIRY_MS;
        
        console.log(`[TokenManager] Token gerado com sucesso (expira em ${this.TOKEN_EXPIRY_MS/1000}s)`);
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

  /**
   * Força renovação do token (ex: quando der 401)
   */
  invalidate(): void {
    console.log('[TokenManager] Invalidando token...');
    this.token = null;
    this.expiryTime = 0;
    this.isGenerating = false;
    this.generatePromise = null;
  }

  /**
   * Verifica se o token é válido sem gerar um novo
   */
  isValid(): boolean {
    if (!this.token) return false;
    const now = Date.now();
    return now < this.expiryTime - this.SAFETY_MARGIN_MS;
  }

  /**
   * Retorna o tempo restante do token em segundos
   */
  getTimeRemaining(): number {
    if (!this.token) return 0;
    const remaining = (this.expiryTime - Date.now()) / 1000;
    return Math.max(0, Math.floor(remaining));
  }
}

export const tokenManager = new BackendTokenManager();