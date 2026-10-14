// Deterministic financial ratios and traffic-light rules (PRD section 7). No AI involved.
export type Rubro = 'comercio' | 'industria' | 'servicios' | 'gastronomia' | 'tecnologia';
export type Categoria = 'liquidez' | 'endeudamiento' | 'rentabilidad' | 'gestion';
export type Estado = 'verde' | 'amarillo' | 'rojo' | 'no_disponible';
export type Unidad = 'veces' | '%' | 'días' | 'meses';
export type Financials = Partial<Record<
  'ventas' | 'costo_ventas' | 'resultado_bruto' | 'gastos_operativos' | 'costo_personal' | 'resultado_operativo' | 'intereses' | 'resultado_neto' |
  'caja' | 'cuentas_por_cobrar' | 'inventario' | 'activo_corriente' | 'activo_fijo' | 'activo_total' | 'cuentas_por_pagar' | 'pasivo_corriente' | 'pasivo_total' | 'patrimonio_neto',
  number | null>>;

type RatioKey = 'liquidez_corriente' | 'prueba_acida' | 'endeudamiento' | 'cobertura_intereses' | 'margen_bruto' | 'margen_operativo' | 'margen_neto' | 'roe' | 'roa' |
  'dias_inventario' | 'dias_cobro' | 'dias_pago' | 'rotacion_activo_fijo' | 'ciclo_caja' | 'costo_personal_ventas' | 'costo_mercaderia_ventas' | 'meses_caja';

type R = [number | null, number | null, number | null, number | null, number | null]; // comercio, industria, servicios, gastronomia, tecnologia
const RUBROS: Rubro[] = ['comercio', 'industria', 'servicios', 'gastronomia', 'tecnologia'];
export const RATIO_DEFS: Record<RatioKey, { nombre: string; categoria: Categoria; tipo: 'min' | 'max'; unidad: Unidad; ref: R }> = {
  liquidez_corriente: { nombre: 'Liquidez corriente', categoria: 'liquidez', tipo: 'min', unidad: 'veces', ref: [1.5, 1.5, 1.5, 1.2, 1.5] },
  prueba_acida: { nombre: 'Prueba ácida', categoria: 'liquidez', tipo: 'min', unidad: 'veces', ref: [0.8, 0.8, 1, 0.8, 1] },
  meses_caja: { nombre: 'Meses de caja disponibles', categoria: 'liquidez', tipo: 'min', unidad: 'meses', ref: [null, null, null, null, 6] },
  endeudamiento: { nombre: 'Endeudamiento (pasivo ÷ PN)', categoria: 'endeudamiento', tipo: 'max', unidad: 'veces', ref: [1.5, 1.5, 1, 1.5, 1] },
  cobertura_intereses: { nombre: 'Cobertura de intereses', categoria: 'endeudamiento', tipo: 'min', unidad: 'veces', ref: [3, 3, 3, 3, 3] },
  margen_bruto: { nombre: 'Margen bruto', categoria: 'rentabilidad', tipo: 'min', unidad: '%', ref: [0.25, 0.3, 0.5, 0.6, 0.7] },
  margen_operativo: { nombre: 'Margen operativo', categoria: 'rentabilidad', tipo: 'min', unidad: '%', ref: [0.05, 0.08, 0.15, 0.1, 0.1] },
  margen_neto: { nombre: 'Margen neto', categoria: 'rentabilidad', tipo: 'min', unidad: '%', ref: [0.03, 0.05, 0.1, 0.05, 0.05] },
  roe: { nombre: 'ROE', categoria: 'rentabilidad', tipo: 'min', unidad: '%', ref: [0.15, 0.15, 0.15, 0.15, 0.15] },
  roa: { nombre: 'ROA', categoria: 'rentabilidad', tipo: 'min', unidad: '%', ref: [0.05, 0.05, 0.08, 0.05, 0.05] },
  dias_inventario: { nombre: 'Días de inventario', categoria: 'gestion', tipo: 'max', unidad: 'días', ref: [60, 90, null, 10, null] },
  dias_cobro: { nombre: 'Días de cobro', categoria: 'gestion', tipo: 'max', unidad: 'días', ref: [45, 60, 45, null, 45] },
  dias_pago: { nombre: 'Días de pago', categoria: 'gestion', tipo: 'min', unidad: 'días', ref: [30, 30, null, 30, null] },
  rotacion_activo_fijo: { nombre: 'Rotación del activo fijo', categoria: 'gestion', tipo: 'min', unidad: 'veces', ref: [null, 2, null, null, null] },
  ciclo_caja: { nombre: 'Ciclo de caja', categoria: 'gestion', tipo: 'max', unidad: 'días', ref: [null, 90, null, null, null] },
  costo_personal_ventas: { nombre: 'Costo de personal ÷ ventas', categoria: 'gestion', tipo: 'max', unidad: '%', ref: [null, null, 0.5, 0.3, null] },
  costo_mercaderia_ventas: { nombre: 'Costo de mercadería ÷ ventas', categoria: 'gestion', tipo: 'max', unidad: '%', ref: [null, null, null, 0.35, null] },
};

export type RatioResult = { ratio: RatioKey; nombre: string; categoria: Categoria; unidad: Unidad; valor: number | null; referencia: number; tipo_referencia: 'min' | 'max'; desvio_pct: number | null; estado: Estado; nota?: string | undefined };
export type DiagnosisResult = { ratios: RatioResult[]; semaforo_general: Estado; puntaje_general: number | null };

const ok = (n: number | null | undefined): n is number => typeof n === 'number' && Number.isFinite(n);
const div = (a: number | null | undefined, b: number | null | undefined) => (ok(a) && ok(b) && b !== 0 ? a / b : null);

export function rubroFromAnswer(answer: string | undefined): Rubro | null {
  const map: Record<string, Rubro> = { Comercio: 'comercio', Industria: 'industria', Servicios: 'servicios', 'Gastronomía': 'gastronomia', 'Tecnología / SaaS': 'tecnologia' };
  return answer ? map[answer] ?? null : null;
}

export function stateFromDeviation(desvio: number): Estado {
  if (desvio <= 0) return 'verde';
  return desvio <= 0.2 ? 'amarillo' : 'rojo';
}

export function calculateDiagnosis(rubro: Rubro, f: Financials, mesesPeriodo: number): DiagnosisResult {
  const dias = mesesPeriodo * 30.4, anual = 12 / mesesPeriodo;
  const neto = f.resultado_neto, pn = f.patrimonio_neto;
  const annualNet = ok(neto) ? neto * anual : null;
  const dInv = div(f.inventario, f.costo_ventas), dCob = div(f.cuentas_por_cobrar, f.ventas), dPag = div(f.cuentas_por_pagar, f.costo_ventas);
  const values: Record<RatioKey, number | null> = {
    liquidez_corriente: div(f.activo_corriente, f.pasivo_corriente),
    prueba_acida: ok(f.activo_corriente) ? div(f.activo_corriente - (ok(f.inventario) ? f.inventario : 0), f.pasivo_corriente) : null,
    endeudamiento: div(f.pasivo_total, pn),
    cobertura_intereses: div(f.resultado_operativo, f.intereses),
    margen_bruto: div(f.resultado_bruto, f.ventas),
    margen_operativo: div(f.resultado_operativo, f.ventas),
    margen_neto: div(neto, f.ventas),
    roe: div(annualNet, pn),
    roa: div(annualNet, f.activo_total),
    dias_inventario: dInv === null ? null : dInv * dias,
    dias_cobro: dCob === null ? null : dCob * dias,
    dias_pago: dPag === null ? null : dPag * dias,
    rotacion_activo_fijo: div(ok(f.ventas) ? f.ventas * anual : null, f.activo_fijo),
    ciclo_caja: dInv !== null && dCob !== null && dPag !== null ? (dInv + dCob - dPag) * dias : null,
    costo_personal_ventas: div(f.costo_personal, f.ventas),
    costo_mercaderia_ventas: div(f.costo_ventas, f.ventas),
    meses_caja: ok(neto) && neto < 0 ? div(f.caja, -neto / mesesPeriodo) : null,
  };
  const idx = RUBROS.indexOf(rubro);
  const ratios: RatioResult[] = [];
  for (const [key, def] of Object.entries(RATIO_DEFS) as [RatioKey, (typeof RATIO_DEFS)[RatioKey]][]) {
    const referencia = def.ref[idx];
    if (referencia === null || referencia === undefined) continue;
    const base = { ratio: key, nombre: def.nombre, categoria: def.categoria, unidad: def.unidad, referencia, tipo_referencia: def.tipo };
    let valor = values[key];
    // Special rules from the PRD
    if (key === 'cobertura_intereses' && (f.intereses === 0 || f.intereses == null)) { ratios.push({ ...base, valor: null, desvio_pct: null, estado: 'verde', nota: 'Sin deuda financiera' }); continue; }
    if (key === 'meses_caja' && ok(neto) && neto >= 0) { ratios.push({ ...base, valor: null, desvio_pct: null, estado: 'verde', nota: 'La empresa genera ganancias' }); continue; }
    if ((key === 'endeudamiento' || key === 'roe') && ok(pn) && pn <= 0) { ratios.push({ ...base, valor: null, desvio_pct: null, estado: 'rojo', nota: 'Patrimonio neto negativo o nulo' }); continue; }
    if (valor === null) { ratios.push({ ...base, valor: null, desvio_pct: null, estado: 'no_disponible', nota: 'Dato no disponible en los archivos' }); continue; }
    const desvio = def.tipo === 'min' ? (referencia - valor) / referencia : (valor - referencia) / referencia;
    ratios.push({ ...base, valor, desvio_pct: desvio, estado: stateFromDeviation(desvio) });
    valor = null;
  }
  const available = ratios.filter(r => r.estado !== 'no_disponible');
  if (!available.length) return { ratios, semaforo_general: 'no_disponible', puntaje_general: null };
  const greens = available.filter(r => r.estado === 'verde').length, reds = available.filter(r => r.estado === 'rojo').length;
  const puntaje = greens / available.length;
  const semaforo_general: Estado = reds / available.length >= 0.3 ? 'rojo' : puntaje >= 0.7 && reds === 0 ? 'verde' : 'amarillo';
  return { ratios, semaforo_general, puntaje_general: puntaje };
}

export function formatRatio(value: number, unidad: Unidad) {
  const n = (x: number, d = 2) => x.toLocaleString('es-AR', { maximumFractionDigits: d, minimumFractionDigits: 0 });
  if (unidad === '%') return `${n(value * 100, 1)} %`;
  if (unidad === 'días') return `${n(value, 0)} días`;
  if (unidad === 'meses') return `${n(value, 1)} meses`;
  return `${n(value)} veces`;
}
