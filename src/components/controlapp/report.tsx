import { useEffect, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { FileQuestion, ArrowLeft, Trash2, Download, Link2, Copy, Loader2, Sparkles, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getDiagnosis, deleteDiagnosis, generateAnalysis, setShare, getSharedReport, type Analisis } from '@/lib/diagnoses.functions';
import { RATIO_DEFS, type DiagnosisResult, type RatioResult, type Estado } from '@/lib/diagnosis';
import { LegalNotice, AppFooter } from './shell';
import { DiagnosisResults } from './results';
import { ReportCharts } from './charts';
import { Logo } from './logo';

const rubros: Record<string, string> = { comercio: 'Comercio', industria: 'Industria', servicios: 'Servicios', gastronomia: 'Gastronomía', tecnologia: 'Tecnología / SaaS' };
const fmtDate = (d: string) => d.slice(0, 10).split('-').reverse().join('/');
const order = Object.keys(RATIO_DEFS);

type Row = { ratio: string; categoria: string; valor: number | string | null; referencia: number | string; tipo_referencia: string; desvio_pct: number | string | null; estado: string; nota: string | null };
type Diag = { nombre_empresa: string; rubro: string; meses_periodo: number; fecha_cierre_periodo: string; created_at: string; semaforo_general: string | null; puntaje_general: number | string | null; analisis_ia: unknown; share_activo: boolean; share_token: string | null };

function toResult(d: Diag, rows: Row[]): DiagnosisResult {
  const ratios: RatioResult[] = [...rows].sort((a, b) => order.indexOf(a.ratio) - order.indexOf(b.ratio)).map(r => ({
    ratio: r.ratio as RatioResult['ratio'], nombre: RATIO_DEFS[r.ratio as keyof typeof RATIO_DEFS]?.nombre ?? r.ratio, categoria: r.categoria as RatioResult['categoria'],
    unidad: RATIO_DEFS[r.ratio as keyof typeof RATIO_DEFS]?.unidad ?? 'veces', valor: r.valor === null ? null : Number(r.valor), referencia: Number(r.referencia),
    tipo_referencia: r.tipo_referencia as 'min' | 'max', desvio_pct: r.desvio_pct === null ? null : Number(r.desvio_pct), estado: r.estado as Estado, nota: r.nota ?? undefined,
  }));
  return { ratios, semaforo_general: (d.semaforo_general ?? 'no_disponible') as Estado, puntaje_general: d.puntaje_general === null ? null : Number(d.puntaje_general) };
}

function Unavailable({ shared }: { shared?: boolean }) {
  return <div className="empty"><FileQuestion size={42} className="text-muted-foreground mb-6" /><h1>{shared ? 'Este informe no está disponible' : 'No se encontró el diagnóstico'}</h1><p>{shared ? 'El enlace puede ser inválido o estar desactivado.' : 'Puede que haya sido eliminado o que no pertenezca a tu cuenta.'}</p><Button asChild><Link to={shared ? '/registro' : '/panel'}>{!shared && <ArrowLeft />}{shared ? 'Crear mi cuenta' : 'Volver a mis diagnósticos'}</Link></Button></div>;
}

function AnalysisBlock({ analisis, loading, error, onRetry }: { analisis: Analisis | null; loading?: boolean | undefined; error?: string | undefined; onRetry?: (() => void) | undefined }) {
  return <section className="analysis" aria-label="Análisis">
    <div className="eyebrow flex items-center gap-2"><Sparkles size={14} />ANÁLISIS</div>
    {loading && <div className="space-y-2 mt-3" aria-busy="true"><p className="field-note flex items-center gap-2"><Loader2 size={14} className="animate-spin" />Redactando el análisis a partir de tus indicadores…</p><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-4/5" /></div>}
    {error && !loading && <p className="notice" role="alert">{error} {onRetry && <Button size="sm" variant="outline" className="ml-2 no-print" onClick={onRetry}><RefreshCw />Reintentar</Button>}</p>}
    {analisis && !loading && <>
      <p className="analysis-summary">{analisis.resumen}</p>
      <div className="analysis-grid">
        <div><h3 className="question-title">Principales riesgos</h3><ul>{analisis.riesgos.map((r, i) => <li key={i}>{r}</li>)}</ul></div>
        <div><h3 className="question-title">Recomendaciones</h3><ul>{analisis.recomendaciones.map((r, i) => <li key={i}>{r}</li>)}</ul></div>
      </div>
      <p className="field-note mt-3">Texto redactado con IA sobre indicadores calculados con fórmulas fijas. La IA no modifica cifras ni semáforos.</p>
    </>}
  </section>;
}

function Header({ d }: { d: Diag }) {
  return <div><div className="print-only mb-4"><Logo /></div><div className="eyebrow">INFORME FINANCIERO</div><h1>{d.nombre_empresa}</h1><p className="subtitle">{rubros[d.rubro]} · {d.meses_periodo} meses · Cierre {fmtDate(d.fecha_cierre_periodo)} · Diagnóstico del {fmtDate(d.created_at)}</p></div>;
}

function SharePanel({ id, d }: { id: string; d: Diag }) {
  const share = useServerFn(setShare); const qc = useQueryClient(); const [copied, setCopied] = useState(false);
  const m = useMutation({ mutationFn: (activo: boolean) => share({ data: { id, activo } }), onSuccess: () => qc.invalidateQueries({ queryKey: ['diagnostico', id] }) });
  const url = d.share_activo && d.share_token ? `${window.location.origin}/informe/${d.share_token}` : '';
  return <section className="share-panel no-print">
    <div><h3 className="question-title flex items-center gap-2"><Link2 size={16} />Enlace público de solo lectura</h3>
      <p className="field-note">{url ? 'Cualquiera con este enlace puede ver el informe, sin editarlo. Puedes desactivarlo cuando quieras.' : 'Crea un enlace para compartir este informe con tu contador o socios.'}</p></div>
    {url ? <div className="share-row"><input readOnly value={url} aria-label="Enlace público" className="share-input" onFocus={e => e.currentTarget.select()} />
      <Button variant="outline" onClick={async () => { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); }}><Copy />{copied ? 'Copiado' : 'Copiar'}</Button>
      <Button variant="outline" disabled={m.isPending} onClick={() => m.mutate(false)}>Desactivar enlace</Button></div>
      : <Button disabled={m.isPending} onClick={() => m.mutate(true)}>{m.isPending ? <Loader2 className="animate-spin" /> : <Link2 />}Crear enlace</Button>}
    {m.isError && <p className="error-note" role="alert">No pudimos actualizar el enlace. Intenta de nuevo.</p>}
  </section>;
}

export function ReportScreen({ token }: { token: string }) {
  const fetchShared = useServerFn(getSharedReport);
  const q = useQuery({ queryKey: ['informe', token], queryFn: () => fetchShared({ data: { token } }), retry: false });
  let body;
  if (q.isLoading) body = <Skeleton className="h-32 w-full" />;
  else if (q.isError || !q.data) body = <Unavailable shared />;
  else {
    const d = q.data.diagnostico as unknown as Diag;
    body = <><div className="page-heading"><Header d={d} /><Button variant="outline" className="no-print" onClick={() => window.print()}><Download />Descargar PDF</Button></div>
      <p className="notice no-print">Informe compartido en modo de solo lectura.</p>
      {d.analisis_ia ? <AnalysisBlock analisis={d.analisis_ia as Analisis} /> : null}
      <ReportCharts result={toResult(d, q.data.ratios as Row[])} />
      <DiagnosisResults result={toResult(d, q.data.ratios as Row[])} /></>;
  }
  return <><main className="page"><div className="wizard">{body}<LegalNotice /></div></main><AppFooter /></>;
}

export function SavedReport({ id }: { id: string }) {
  const fetchOne = useServerFn(getDiagnosis); const remove = useServerFn(deleteDiagnosis); const analyze = useServerFn(generateAnalysis);
  const qc = useQueryClient(); const navigate = useNavigate();
  const q = useQuery({ queryKey: ['diagnostico', id], queryFn: () => fetchOne({ data: { id } }) });
  const a = useMutation({ mutationFn: (force: boolean) => analyze({ data: { id, force } }), onSuccess: () => qc.invalidateQueries({ queryKey: ['diagnostico', id] }) });
  const d = q.data?.diagnostico as unknown as Diag | undefined;
  const needsAnalysis = !!d && !d.analisis_ia;
  useEffect(() => { if (needsAnalysis && a.isIdle) a.mutate(false); }, [needsAnalysis]); // eslint-disable-line react-hooks/exhaustive-deps
  const onDelete = async () => { if (!confirm('¿Eliminar este diagnóstico? Esta acción no se puede deshacer.')) return; await remove({ data: { id } }); await qc.invalidateQueries({ queryKey: ['diagnosticos'] }); navigate({ to: '/panel' }); };
  let body;
  if (q.isLoading) body = <div className="space-y-3"><Skeleton className="h-10 w-1/2" /><Skeleton className="h-32 w-full" /></div>;
  else if (q.isError || !q.data || !d) body = <Unavailable />;
  else {
    const result = toResult(d, q.data.ratios as Row[]);
    const analisis = (d.analisis_ia as Analisis | null) ?? (a.data ?? null);
    body = <><Link to="/panel" className="back-link no-print"><ArrowLeft size={15} />Mis diagnósticos</Link>
      <div className="page-heading"><Header d={d} /><div className="flex gap-2 flex-wrap no-print"><Button variant="outline" onClick={() => window.print()}><Download />Descargar PDF</Button><Button variant="outline" onClick={onDelete}><Trash2 />Eliminar</Button></div></div>
      <AnalysisBlock analisis={analisis} loading={a.isPending} error={a.isError ? (a.error instanceof Error ? a.error.message : 'No pudimos redactar el análisis.') : undefined} onRetry={() => a.mutate(true)} />
      <ReportCharts result={result} />
      <DiagnosisResults result={result} />
      <SharePanel id={id} d={d} /></>;
  }
  return <><main className="page"><div className="wizard">{body}<LegalNotice /></div></main><AppFooter /></>;
}
