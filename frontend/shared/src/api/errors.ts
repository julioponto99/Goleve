export type Outcome = 'not-started' | 'rejected' | 'unknown';
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    public readonly outcome: Outcome = 'rejected',
    public readonly retryAfter: string | null = null,
    public readonly requestId: string | null = null,
  ) {
    super('API request failed: ' + code);
    this.name = 'ApiError';
  }
}
export function errorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return 'Não foi possível concluir a operação.';
  if (error.code === 'PAYMENT_RECONCILIATION_REQUIRED') return 'O resultado do pagamento simulado é incerto. Não repitas a cobrança; é necessária reconciliação.';
  if (error.outcome === 'unknown') return 'Não foi possível confirmar o resultado. Consulta o estado antes de tentar novamente.';
  if (error.status === 401) return 'A sessão expirou ou foi revogada. Inicia sessão novamente.';
  if (error.status === 403) return 'Não tens autorização para esta operação.';
  if (error.status === 404) return 'Este recurso não está disponível.';
  if ([409, 412, 428].includes(error.status)) return 'Os dados foram alterados. Atualiza a informação antes de continuar.';
  if ([400, 422].includes(error.status)) return 'Verifica os dados e as regras indicadas para esta operação.';
  if (error.status === 429) return 'Foram feitos demasiados pedidos. Aguarda antes de continuar.';
  if (error.status >= 500 || error.status === 0) return 'O serviço está temporariamente indisponível.';
  return 'Não foi possível concluir a operação.';
}
