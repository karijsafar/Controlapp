import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Plus, Files, CircleCheck, FilePenLine, Search, ShieldCheck, LockKeyhole, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { listDiagnoses } from '@/lib/diagnoses.functions';
import type { Estado } from '@/lib/diagnosis';
import { DiagnosisArt } from './logo';
import { AppFooter } from './shell';
import { StatusBadge } from './results';

const rubros: Record<string, string> = { comercio: 'Comercio', industria: 'Industria', servicios: 'Servicios', gastronomia: 'Gastronomía', tecnologia: 'Tecnología / SaaS' };
const fmtDate = (d: string) => d.slice(0, 10).split('-').reverse().join('/');

export function Panel() {
  const [tab, setTab] = useState('Todos'); const [search, setSearch] = useState('');
  const fetchList = useServerFn(listDiagnoses);
  const query = useQuery({ queryKey: ['diagnosticos'], queryFn: () => fetchList() });
  const all = query.data ?? [];
  const done = all.filter(d => d.estado === 'completado'), drafts = all.filter(d => d.estado !== 'completado');
  const base = tab === 'Completados' ? done : tab === 'Borradores' ? drafts : all;
  const items = base.filter(d => d.nombre_empresa.toLowerCase().includes(search.trim().toLowerCase()));
  const counts: Record<string, number> = { Todos: all.length, Completados: done.length, Borradores: drafts.length };
  return <><main className="page"><div className="page-heading"><div><div className="eyebrow"><span className="h-1.5 w-1.5 rounded-full bg-accent" />TU EMPRESA, EN PERSPECTIVA</div><h1>Mis diagnósticos</h1><p className="subtitle">El estado de tu empresa. Las decisiones que vienen.</p></div><Button asChild><Link to="/diagnostico/nuevo"><Plus />Nuevo diagnóstico</Link></Button></div>
    <section className="stat-grid" aria-label="Resumen de diagnósticos">{[{ label: 'Diagnósticos totales', icon: Files, kind: '', n: all.length }, { label: 'Completados', icon: CircleCheck, kind: 'success', n: done.length }, { label: 'En borrador', icon: FilePenLine, kind: 'draft', n: drafts.length }].map(({ label, icon: Icon, kind, n }) => <div className="stat" key={label}><div><p className="stat-label">{label}</p><p className="stat-number">{query.isLoading ? '–' : n}</p></div><span className={`stat-icon ${kind}`}><Icon size={20} /></span></div>)}</section>
    <div className="list-toolbar"><div className="tabs" aria-label="Filtrar diagnósticos">{['Todos', 'Completados', 'Borradores'].map(t => <Button key={t} variant="ghost" className="tab" data-active={tab === t} onClick={() => setTab(t)} aria-pressed={tab === t}>{t}<span className="tab-count">{counts[t]}</span></Button>)}</div><div className="search"><Search /><Input aria-label="Buscar empresa" placeholder="Buscar empresa…" value={search} onChange={e => setSearch(e.target.value)} /></div></div>
    <section className="diagnosis-list" aria-label="Lista de diagnósticos"><div className="table-head"><span>EMPRESA</span><span>PERÍODO</span><span>DIAGNÓSTICO</span><span>ESTADO</span></div>
      {query.isLoading ? <div className="p-6 space-y-3">{[0, 1, 2].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
        : query.isError ? <div className="empty"><h2>No pudimos cargar tus diagnósticos</h2><p>Revisa tu conexión e intenta de nuevo.</p><Button variant="outline" onClick={() => query.refetch()}>Reintentar</Button></div>
        : items.length ? items.map(d => <Link key={d.id} to="/diagnostico/$id" params={{ id: d.id }} className="diagnosis-row">
          <span><strong>{d.nombre_empresa}</strong><small>{rubros[d.rubro]}</small></span>
          <span>{d.meses_periodo} meses<small>Cierre {fmtDate(d.fecha_cierre_periodo)}</small></span>
          <span>{fmtDate(d.created_at)}<small>{d.puntaje_general === null ? '' : `${Math.round(Number(d.puntaje_general) * 100)} % en verde`}</small></span>
          <span>{d.semaforo_general ? <StatusBadge estado={d.semaforo_general as Estado} /> : <span className="field-note">Borrador</span>}</span>
        </Link>)
        : <div className="empty"><DiagnosisArt /><h2>{search ? 'No encontramos diagnósticos' : tab === 'Borradores' ? 'No tienes diagnósticos en borrador' : tab === 'Completados' ? 'Todavía no tienes diagnósticos completados' : 'Todavía no tienes diagnósticos'}</h2><p>{search ? `No hay resultados para «${search}».` : 'Cada buena decisión empieza con información clara. Da el primer paso con tu empresa.'}</p>{search ? <Button variant="outline" onClick={() => setSearch('')}>Limpiar búsqueda</Button> : <Button asChild><Link to="/diagnostico/nuevo"><Plus />Crear mi primer diagnóstico<ArrowUpRight /></Link></Button>}<span className="empty-foot"><LockKeyhole size={12} />Solo tú tienes acceso a tu información</span></div>}
    </section><div className="page-bottom"><span className="private-note"><ShieldCheck size={17} className="text-accent" />Tu información financiera es privada y confidencial.</span><span>Un período. Una visión más clara.</span></div></main><AppFooter /></>;
}
