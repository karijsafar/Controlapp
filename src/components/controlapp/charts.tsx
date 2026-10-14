import type { DiagnosisResult, Estado } from '@/lib/diagnosis';
import { formatRatio } from '@/lib/diagnosis';

const labels: Record<Estado, string> = { verde: 'Saludable', amarillo: 'Crítico', rojo: 'En riesgo', no_disponible: 'No disponible' };

// Pure presentation of already-computed results.
export function ReportCharts({ result }: { result: DiagnosisResult }) {
  const counts = (['verde', 'amarillo', 'rojo', 'no_disponible'] as Estado[]).map(e => ({ e, n: result.ratios.filter(r => r.estado === e).length }));
  const total = result.ratios.length || 1;
  const bars = result.ratios.filter(r => r.valor !== null);
  return <section className="charts" aria-label="Gráficos">
    <div className="chart-card">
      <h3 className="question-title">Distribución de indicadores</h3>
      <div className="stack-bar" role="img" aria-label={counts.map(c => `${labels[c.e]}: ${c.n}`).join(', ')}>
        {counts.filter(c => c.n).map(c => <span key={c.e} className={`seg seg-${c.e}`} style={{ width: `${(c.n / total) * 100}%` }} />)}
      </div>
      <ul className="legend">{counts.map(c => <li key={c.e}><span className={`dot seg-${c.e}`} />{labels[c.e]} · {c.n}</li>)}</ul>
    </div>
    <div className="chart-card">
      <h3 className="question-title">Valor frente a la referencia</h3>
      <p className="field-note mb-3">La línea marca la referencia del rubro.</p>
      <div className="vs-list">{bars.map(r => {
        const max = Math.max(Math.abs(r.valor!), Math.abs(r.referencia)) * 1.25 || 1;
        const w = Math.min(100, (Math.max(0, r.valor!) / max) * 100); const ref = (r.referencia / max) * 100;
        return <div key={r.ratio} className="vs-row">
          <span className="vs-name">{r.nombre}</span>
          <div className="vs-track"><span className={`vs-fill seg-${r.estado}`} style={{ width: `${w}%` }} /><span className="vs-ref" style={{ left: `${ref}%` }} /></div>
          <span className="vs-val">{formatRatio(r.valor!, r.unidad)}</span>
        </div>;
      })}</div>
    </div>
  </section>;
}
