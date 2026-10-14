import { describe, it, expect } from 'vitest';
import { calculateDiagnosis, stateFromDeviation } from '@/lib/diagnosis';
describe('diagnosis', () => {
  it('deviation thresholds', () => { expect(stateFromDeviation(0)).toBe('verde'); expect(stateFromDeviation(0.2)).toBe('amarillo'); expect(stateFromDeviation(0.21)).toBe('rojo'); });
  it('commerce ratios', () => {
    const r = calculateDiagnosis('comercio', { ventas: 1000, costo_ventas: 600, resultado_bruto: 400, resultado_operativo: 100, intereses: 0, resultado_neto: 60, activo_corriente: 300, pasivo_corriente: 150, inventario: 50, cuentas_por_cobrar: 100, cuentas_por_pagar: 80, pasivo_total: 200, patrimonio_neto: 200, activo_total: 400 }, 12);
    const get = (k: string) => r.ratios.find(x => x.ratio === k)!;
    expect(get('liquidez_corriente').valor).toBe(2);
    expect(get('cobertura_intereses').estado).toBe('verde');
    expect(get('roe').valor).toBeCloseTo(0.3);
    expect(get('dias_cobro').valor).toBeCloseTo(36.48);
    expect(r.ratios.some(x => x.ratio === 'rotacion_activo_fijo')).toBe(false);
  });
  it('negative equity and missing data', () => {
    const r = calculateDiagnosis('tecnologia', { ventas: 100, patrimonio_neto: -5, pasivo_total: 50, resultado_neto: -10, caja: 30 }, 6);
    const get = (k: string) => r.ratios.find(x => x.ratio === k)!;
    expect(get('endeudamiento').estado).toBe('rojo'); expect(get('roe').estado).toBe('rojo');
    expect(get('meses_caja').valor).toBe(18); expect(get('liquidez_corriente').estado).toBe('no_disponible');
    expect(r.semaforo_general).toBe('rojo');
  });
});
