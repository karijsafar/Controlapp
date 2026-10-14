import { useEffect, useState } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Logo } from '@/components/controlapp/logo';
import { pageHead } from '@/components/controlapp/meta';

export const Route = createFileRoute('/confirmar')({
  head: () => pageHead('Confirmar cuenta', 'Confirmación de tu cuenta de CONTROLAPP.'),
  component: Confirmar,
});

function Confirmar() {
  const navigate = useNavigate();
  const [state, setState] = useState<'cargando' | 'ok' | 'error'>('cargando');
  const [detail, setDetail] = useState('');

  useEffect(() => {
    let done = false;
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const query = new URLSearchParams(window.location.search);
    const err = hash.get('error_description') ?? query.get('error_description');
    if (err) {
      setDetail(/expired|invalid/i.test(err) ? 'El enlace venció o ya fue usado. Inicia sesión; si tu cuenta no está confirmada, regístrate de nuevo para recibir otro enlace.' : 'No pudimos confirmar tu cuenta con este enlace.');
      setState('error'); return;
    }
    const finish = () => { if (done) return; done = true; setState('ok'); setTimeout(() => navigate({ to: '/panel' }), 1200); };
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => { if (session) finish(); });
    (async () => {
      const code = query.get('code');
      if (code) await supabase.auth.exchangeCodeForSession(code).catch(() => null);
      const { data } = await supabase.auth.getSession();
      if (data.session) finish();
      else setTimeout(() => { if (!done) { setDetail('No encontramos una sesión activa. Tu cuenta puede estar confirmada: inicia sesión para continuar.'); setState('error'); } }, 4000);
    })();
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  return <main className="auth-page"><section className="auth-content" style={{ margin: '0 auto', textAlign: 'center' }}>
    <div className="flex justify-center mb-6"><Logo /></div>
    {state === 'cargando' && <><Loader2 className="animate-spin mx-auto" /><h1>Confirmando tu cuenta…</h1></>}
    {state === 'ok' && <><CheckCircle2 className="mx-auto" /><h1>¡Cuenta confirmada!</h1><p className="subtitle">Te llevamos a tus diagnósticos.</p></>}
    {state === 'error' && <><AlertTriangle className="mx-auto" /><h1>No pudimos confirmar</h1><p role="alert" className="subtitle">{detail}</p>
      <Button asChild className="mt-6"><Link to="/login">Ir a iniciar sesión</Link></Button></>}
  </section></main>;
}
