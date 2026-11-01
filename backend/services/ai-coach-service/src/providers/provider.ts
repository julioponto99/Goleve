import { fail } from '../config/errors';
export interface ProviderInput {
  instructions?: string;
  purpose: string;
  messages: { role: 'user' | 'assistant'; content: string }[];
  context: Record<string, unknown>;
  tools: { name: string; parameters: Record<string, unknown> }[];
}
export interface CoachProvider {
  readonly name: string;
  readonly model: string;
  generate(input: ProviderInput, signal?: AbortSignal): Promise<unknown>;
}
export class UnavailableProvider implements CoachProvider {
  readonly name = 'unavailable'; readonly model = 'none';
  async generate(_input: ProviderInput): Promise<never> { return fail(503, 'AI_PROVIDER_UNAVAILABLE', 'No AI provider is configured'); }
}
// Versioned integration contract for a model API/adapter. No user Bearer reaches this transport.
export class HttpJsonProvider implements CoachProvider {
  readonly name = 'http-json-v1';
  constructor(private readonly endpoint: string, readonly model: string, private readonly credential?: string) {}
  async generate(input: ProviderInput, signal?: AbortSignal): Promise<unknown> {
    try {
      const response = await fetch(this.endpoint, { method: 'POST', redirect: 'error', signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(8000)]) : AbortSignal.timeout(8000),
        headers: { 'Content-Type': 'application/json', ...(this.credential ? { Authorization: 'Bearer ' + this.credential } : {}) },
        body: JSON.stringify({ contractVersion: 1, model: this.model, ...input, store: false }) });
      if (!response.ok || !response.body) throw new Error();
      const reader = response.body.getReader(); let length = 0; const chunks: Uint8Array[] = [];
      try { for (;;) { const { done, value } = await reader.read(); if (done) break; length += value.length; if (length > 32768) throw new Error(); chunks.push(value); } }
      finally { await reader.cancel().catch(() => undefined); }
      return JSON.parse(Buffer.concat(chunks).toString('utf8'));
    } catch { return fail(503, 'AI_PROVIDER_UNAVAILABLE', 'AI provider request failed or returned an invalid response'); }
  }
}
