import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { calculateDiagnosis, rubroFromAnswer, type Financials } from './diagnosis';

const saveSchema = z.object({
  nombre_empresa: z.string().trim().min(1).max(200),
  fecha_cierre_periodo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  meses_periodo: z.number().int().min(1).max(12),
  respuestas: z.record(z.string(), z.union([z.string().max(200), z.array(z.string().max(200)).max(10)])),
  valores: z.record(z.string(), z.number().finite()),
});

// Ratios are always recalculated on the server with fixed formulas; the client never sends results.
export const saveDiagnosis = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => saveSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const rubroAnswer = data.respuestas['rubro'];
    const rubro = rubroFromAnswer(typeof rubroAnswer === 'string' ? rubroAnswer : undefined);
    if (!rubro) throw new Error('Rubro inválido');
    if (!((data.valores['ventas'] ?? 0) > 0)) throw new Error('Las ventas deben ser mayores a 0');
    const result = calculateDiagnosis(rubro, data.valores as Financials, data.meses_periodo);
    const { data: row, error } = await supabase.from('diagnosticos').insert({
      user_id: userId, nombre_empresa: data.nombre_empresa, fecha_cierre_periodo: data.fecha_cierre_periodo,
      meses_periodo: data.meses_periodo, rubro, respuestas: data.respuestas, estado: 'completado',
      semaforo_general: result.semaforo_general, puntaje_general: result.puntaje_general,
    }).select('id').single();
    if (error) throw new Error(error.message);
    const id = row.id;
    const fin = await supabase.from('datos_financieros').insert({ diagnostico_id: id, valores: data.valores, confirmado: true });
    if (fin.error) throw new Error(fin.error.message);
    const rat = await supabase.from('resultados_ratios').insert(result.ratios.map(r => ({
      diagnostico_id: id, ratio: r.ratio, categoria: r.categoria, valor: r.valor, referencia: r.referencia,
      tipo_referencia: r.tipo_referencia, desvio_pct: r.desvio_pct, estado: r.estado, nota: r.nota ?? null,
    })));
    if (rat.error) throw new Error(rat.error.message);
    return { id };
  });

export const listDiagnoses = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from('diagnosticos')
      .select('id, nombre_empresa, fecha_cierre_periodo, meses_periodo, rubro, estado, semaforo_general, puntaje_general, created_at')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  });

export const getDiagnosis = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: d, error } = await context.supabase.from('diagnosticos').select('*').eq('id', data.id).maybeSingle();
    if (error) throw new Error(error.message);
    if (!d) return null;
    const { data: ratios } = await context.supabase.from('resultados_ratios').select('*').eq('diagnostico_id', data.id);
    return { diagnostico: d, ratios: ratios ?? [] };
  });

export const deleteDiagnosis = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from('diagnosticos').delete().eq('id', data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export type Analisis = { resumen: string; riesgos: string[]; recomendaciones: string[] };
const analysisSchema = {
  type: 'object', additionalProperties: false, required: ['resumen', 'riesgos', 'recomendaciones'],
  properties: {
    resumen: { type: 'string' },
    riesgos: { type: 'array', items: { type: 'string' } },
    recomendaciones: { type: 'array', items: { type: 'string' } },
  },
};

// AI only writes text about results already computed with fixed formulas; it never changes figures or colors.
export const generateAnalysis = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; force?: boolean }) => z.object({ id: z.string().uuid(), force: z.boolean().optional() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: d, error } = await supabase.from('diagnosticos').select('*').eq('id', data.id).maybeSingle();
    if (error || !d) throw new Error('Diagnóstico no encontrado');
    if (d.analisis_ia && !data.force) return d.analisis_ia as unknown as Analisis;
    const { data: ratios } = await supabase.from('resultados_ratios').select('ratio, categoria, valor, referencia, tipo_referencia, estado, nota').eq('diagnostico_id', data.id);
    const { aiJson } = await import('./ai.server');
    const out = await aiJson<Analisis>({
      schema: analysisSchema, fallbackError: 'No pudimos generar el análisis. Intenta de nuevo.',
      system: 'Eres un analista financiero para pymes. Redacta en español rioplatense neutro, claro y sin jerga. Usa SOLO los indicadores, estados (verde=saludable, amarillo=crítico, rojo=en riesgo, no_disponible) y respuestas recibidas: no inventes cifras, no recalcules ni cambies estados. "resumen": 2 a 4 oraciones. "riesgos": entre 3 y 6 frases breves, priorizando indicadores en rojo y amarillo. "recomendaciones": entre 3 y 6 acciones concretas y prudentes. No des asesoramiento legal ni impositivo.',
      content: [{ type: 'text', text: JSON.stringify({ empresa: d.nombre_empresa, rubro: d.rubro, meses_periodo: d.meses_periodo, semaforo_general: d.semaforo_general, puntaje_general: d.puntaje_general, respuestas: d.respuestas, indicadores: ratios ?? [] }) }],
    });
    const clean = (a: unknown) => (Array.isArray(a) ? a.filter((x): x is string => typeof x === 'string' && x.trim() !== '').slice(0, 6) : []);
    const analisis: Analisis = { resumen: String(out.resumen ?? ''), riesgos: clean(out.riesgos), recomendaciones: clean(out.recomendaciones) };
    const up = await supabase.from('diagnosticos').update({ analisis_ia: analisis }).eq('id', data.id);
    if (up.error) throw new Error(up.error.message);
    return analisis;
  });

export const setShare = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; activo: boolean }) => z.object({ id: z.string().uuid(), activo: z.boolean() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: d } = await supabase.from('diagnosticos').select('share_token').eq('id', data.id).maybeSingle();
    if (!d) throw new Error('Diagnóstico no encontrado');
    // Revoking rotates the token so old links never work again.
    const token = data.activo ? (d.share_token ?? crypto.randomUUID()) : null;
    const { error } = await supabase.from('diagnosticos').update({ share_activo: data.activo, share_token: token }).eq('id', data.id);
    if (error) throw new Error(error.message);
    return { share_activo: data.activo, share_token: token };
  });

// Public read-only access: only an active, unguessable token unlocks a report; private fields are never returned.
export const getSharedReport = createServerFn({ method: 'GET' })
  .inputValidator((input: { token: string }) => z.object({ token: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { data: d } = await supabaseAdmin.from('diagnosticos')
      .select('id, nombre_empresa, fecha_cierre_periodo, meses_periodo, rubro, semaforo_general, puntaje_general, analisis_ia, created_at')
      .eq('share_token', data.token).eq('share_activo', true).maybeSingle();
    if (!d) return null;
    const { data: ratios } = await supabaseAdmin.from('resultados_ratios').select('*').eq('diagnostico_id', d.id);
    const { id: _omit, ...diagnostico } = d;
    return { diagnostico: { ...diagnostico, share_activo: true, share_token: null }, ratios: ratios ?? [] };
  });
