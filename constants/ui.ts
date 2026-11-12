// constants/ui.ts
// Tempos de feedback e breakpoints de layout compartilhados pelas telas.

/** Tempos após uma ação (ms). */
export const UI_TIMING = {
  /** Quanto tempo uma mensagem fica visível antes de sumir ou de redirecionar. */
  messageMs: 3000,
  /** Espera após um sucesso antes de fechar, trocar de etapa ou navegar. */
  transitionMs: 1500,
};

/** Larguras mínimas (px) dos breakpoints do Tailwind usados no cálculo de colunas das grades. */
export const BREAKPOINTS = { xs: 480, sm: 640, md: 768, lg: 1024, xl: 1280 };
