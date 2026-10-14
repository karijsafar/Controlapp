import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import type { AiContent } from './ai.server';

export const FIELD_KEYS = ['ventas', 'costo_ventas', 'resultado_bruto', 'gastos_operativos', 'costo_personal', 'resultado_operativo', 'intereses', 'resultado_neto',
  'caja', 'cuentas_por_cobrar', 'inventario', 'activo_corriente', 'activo_fijo', 'activo_total', 'cuentas_por_pagar', 'pasivo_corriente', 'pasivo_total', 'patrimonio_neto'] as const;

const fileSchema = z.object({
  tipo: z.enum(['pl', 'balance']),
  nombre: z.string().max(200),
  pdf_base64: z.string().max(14_500_000).optional(),
  texto: z.string().max(200_000).optional(),
});
const inputSchema = z.object({ files: z.array(fileSchema).min(1).max(2) });

const schema = {
  type: 'object', additionalProperties: false, required: [...FIELD_KEYS],
  properties: Object.fromEntries(FIELD_KEYS.map((k) => [k, { anyOf: [{ type: 'number' }, { type: 'null' }] }])),
};

const INSTRUCTIONS = `Eres un lector de estados contables. Extrae SOLO cifras que aparezcan explícitamente en los documentos (estado de resultados y balance de un mismo período). Nunca inventes ni estimes: si un rubro no figura, devuelve null. Puedes sumar subtotales solo si el documento los detalla línea por línea (por ejemplo resultado bruto = ventas − costo de ventas si ambos figuran). Usa el último período/columna del ejercicio si hay varias. Números en unidades monetarias completas (respeta "en miles" multiplicando). Costos y gastos como valores positivos; resultados con su signo (pérdida negativa). "intereses" = gastos/intereses financieros.`;

// AI only reads figures; it never decides ratios or traffic lights.
export const extractFinancials = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data }) => {
    const content: AiContent = [];
    for (const f of data.files) {
      const label = f.tipo === 'pl' ? 'Estado de resultados' : 'Balance';
      if (f.pdf_base64) {
        content.push({ type: 'document', title: `${label} (${f.nombre})`, source: { type: 'base64', media_type: 'application/pdf', data: f.pdf_base64 } });
      } else if (f.texto) {
        content.push({ type: 'text', text: `Documento: ${label} (${f.nombre}), planilla en CSV:\n${f.texto}` });
      }
    }
    content.push({ type: 'text', text: 'Extrae las cifras de estos documentos.' });
    const { aiJson } = await import('./ai.server');
    const parsed = await aiJson<Record<string, unknown>>({ system: INSTRUCTIONS, content, schema, fallbackError: 'No pudimos leer los archivos. Puedes cargar las cifras a mano.' });
    const valores: Record<string, number | null> = {};
    for (const k of FIELD_KEYS) { const v = parsed[k]; valores[k] = typeof v === 'number' && Number.isFinite(v) ? v : null; }
    return { valores };
  });
