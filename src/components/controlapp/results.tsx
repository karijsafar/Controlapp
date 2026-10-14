import { CheckCircle2, AlertTriangle, OctagonX, MinusCircle } from 'lucide-react';
import { formatRatio, type DiagnosisResult, type Estado, type Categoria } from '@/lib/diagnosis';

const labels: Record<Estado, string> = { verde: 'Saludable', amarillo: 'Crítico', rojo: 'En riesgo', no_disponible: 'No disponible' };
const icons = { verde: CheckCircle2, amarillo: AlertTriangle, rojo: OctagonX, no_disponible: MinusCircle };
const cats: [Categoria, string][] = [['liquidez', 'Liquidez'], ['endeudamiento', 'Endeudamiento'], ['rentabilidad', 'Rentabilidad'], ['gestion', 'Gestión']];

export function StatusBadge({ estado }: { estado: Estado }) {
  const Icon = icons[estado];
  return <span className={`status-badge status-${estado}`}><Icon size={14} />{labels[estado]}</span>;
}

export function DiagnosisResults({ result }: { result: DiagnosisResult }) {
  return <section className="results" aria-label="Resultado del cálculo">
    <div className="results-summary">
      <div><div className="eyebrow">SEMÁFORO GENERAL</div><StatusBadge estado={result.semaforo_general} /></div>
      <div className="results-score"><span className="stat-label">Indicadores en verde</span><strong>{result.puntaje_general === null ? '—' : `${Math.round(result.puntaje_general * 100)} %`}</strong></div>
    </div>
    {cats.map(([key, name]) => {
      const items = result.ratios.filter(r => r.categoria === key);
      if (!items.length) return null;
      return <div key={key} className="mb-6"><h3 className="question-title">{name}</h3><div className="ratio-grid">{items.map(r =>
        <div key={r.ratio} className="ratio-card">
          <div className="flex justify-between gap-2 items-start"><span className="ratio-name">{r.nombre}</span><StatusBadge estado={r.estado} /></div>
          <strong className="ratio-value">{r.valor === null ? '—' : formatRatio(r.valor, r.unidad)}</strong>
          <span className="field-note">Referencia {r.tipo_referencia === 'min' ? 'mínima' : 'máxima'}: {formatRatio(r.referencia, r.unidad)}</span>
          <span className="field-note">{r.nota ?? (r.desvio_pct === null ? '' : `Desvío: ${(r.desvio_pct * 100).toLocaleString('es-AR', { maximumFractionDigits: 1 })} %`)}</span>
        </div>)}</div></div>;
    })}
  </section>;
}
