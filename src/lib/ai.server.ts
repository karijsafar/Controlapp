import Anthropic from '@anthropic-ai/sdk';
import type { BetaContentBlockParam } from '@anthropic-ai/sdk/resources/beta/messages/messages';

export type AiContent = BetaContentBlockParam[];

let client: Anthropic | null = null;
function getClient() {
  const apiKey = process.env['ANTHROPIC_API_KEY'];
  if (!apiKey) throw new Error('La IA no está configurada.');
  client ??= new Anthropic({ apiKey });
  return client;
}

// Server-only helper: streamed Claude call with strict JSON schema output.
export async function aiJson<T>(opts: { system: string; content: AiContent; schema: object; fallbackError: string }): Promise<T> {
  let message;
  try {
    message = await getClient().beta.messages.stream({
      model: 'claude-opus-5-5',
      max_tokens: 64000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'medium', format: { type: 'json_schema', schema: opts.schema as Record<string, unknown> } },
      system: opts.system,
      messages: [{ role: 'user', content: opts.content }],
    }).finalMessage();
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) throw new Error('Hay muchas solicitudes en este momento. Espera un minuto e intenta de nuevo.');
    if (e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.PermissionDeniedError) throw new Error('La IA no está disponible: revisa la clave de API.');
    if (e instanceof Anthropic.BadRequestError && /credit balance/i.test(e.message)) throw new Error('La IA no está disponible por falta de créditos.');
    if (e instanceof Anthropic.APIError) console.error('Claude API error', e.status, e.message);
    throw new Error(opts.fallbackError);
  }
  if (message.stop_reason === 'refusal' || message.stop_reason === 'max_tokens') throw new Error(opts.fallbackError);
  const text = message.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('');
  try { return JSON.parse(text) as T; } catch { throw new Error(opts.fallbackError); }
}
