import { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { Logo, DiagnosisArt } from './logo';

const safePath = (p?: string) => (p && p.startsWith('/') && !p.startsWith('//') ? p : '/panel');
const translate = (msg: string) => {
  if (/invalid login/i.test(msg)) return 'Email o contraseña incorrectos.';
  if (/not confirmed/i.test(msg)) return 'Confirma tu email antes de iniciar sesión. Revisa tu bandeja de entrada.';
  if (/already registered/i.test(msg)) return 'Ya existe una cuenta con ese email.';
  if (/not allowed|invalid.*email|email.*invalid/i.test(msg)) return 'Ese email no es válido. Usa una dirección real.';
  if (/rate limit/i.test(msg)) return 'Demasiados intentos. Espera unos minutos.';
  if (/weak|pwned|leaked/i.test(msg)) return 'Esa contraseña es poco segura. Elige otra.';
  return 'No pudimos completar la operación. Intenta de nuevo.';
};

export function AuthScreen({ mode, redirect }: { mode: 'login' | 'registro' | 'recuperar' | 'restablecer'; redirect?: string | undefined }) {
  const navigate = useNavigate();
  const [message, setMessage] = useState(''); const [success, setSuccess] = useState(''); const [busy, setBusy] = useState(false);
  const title = { login: 'Bienvenido de nuevo', registro: 'Crea tu cuenta', recuperar: 'Recupera tu contraseña', restablecer: 'Elige una nueva contraseña' }[mode];
  const action = { login: 'Iniciar sesión', registro: 'Crear cuenta', recuperar: 'Enviar enlace', restablecer: 'Guardar contraseña' }[mode];

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setMessage(''); setSuccess('');
    const data = new FormData(e.currentTarget);
    const email = String(data.get('email') ?? ''), password = String(data.get('password') ?? '');
    if ((mode === 'registro' || mode === 'restablecer') && password !== data.get('confirmation')) { setMessage('Las contraseñas no coinciden.'); return; }
    setBusy(true);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: safePath(redirect) });
      } else if (mode === 'registro') {
        const { data: res, error } = await supabase.auth.signUp({ email: email.trim().toLowerCase(), password, options: { emailRedirectTo: `${window.location.origin}/confirmar`, data: { nombre: String(data.get('name') ?? '') } } });
        if (error) throw error;
        if (res.user && res.user.identities?.length === 0) { setMessage('Ya existe una cuenta con ese email. Inicia sesión o recupera tu contraseña.'); return; }
        if (res.session) navigate({ to: '/panel' }); else setSuccess(`Te enviamos un email a ${email} para confirmar tu cuenta. Revisa también la carpeta de spam.`);
      } else if (mode === 'recuperar') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/restablecer-contrasena` });
        if (error) throw error;
        setSuccess('Si el email está registrado, recibirás un enlace para restablecer tu contraseña.');
      } else {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        setSuccess('Contraseña actualizada.'); navigate({ to: '/panel' });
      }
    } catch (err) { setMessage(translate(err instanceof Error ? err.message : '')); }
    finally { setBusy(false); }
  };

  const google = async () => {
    setMessage('');
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + safePath(redirect) } });
    if (error) setMessage('No pudimos iniciar sesión con Google.');
  };

  return <main className="auth-page"><section className="auth-brand"><Logo variant="dark" /><DiagnosisArt /><h1>Tu empresa.<br />Una mirada más clara.</h1><p>Entiende dónde estás hoy y toma tus próximas decisiones con confianza.</p><span className="flex items-center gap-2 text-xs"><ShieldCheck size={17} />Tu información, siempre privada.</span></section>
    <section className="auth-content"><h1>{title}</h1><p className="subtitle">{mode === 'registro' ? 'El primer paso para conocer la salud de tu empresa.' : mode === 'login' ? 'Accede a tus diagnósticos financieros.' : mode === 'recuperar' ? 'Ingresa el email asociado a tu cuenta.' : 'Usa al menos 8 caracteres.'}</p>
      {(mode === 'login' || mode === 'registro') && <><Button type="button" variant="outline" className="w-full mt-6" onClick={google}>Continuar con Google</Button><p className="field-note text-center my-4">o con tu email</p></>}
      <form className="auth-form" onSubmit={onSubmit}>
        {mode === 'registro' && <div className="field"><label htmlFor="name">Nombre</label><Input id="name" name="name" autoComplete="name" required placeholder="Tu nombre" /></div>}
        {mode !== 'restablecer' && <div className="field"><label htmlFor="email">Email</label><Input id="email" name="email" type="email" autoComplete="email" placeholder="nombre@empresa.com" required /></div>}
        {mode !== 'recuperar' && <div className="field"><label htmlFor="password">Contraseña</label><Input id="password" name="password" type="password" minLength={8} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required placeholder="Mínimo 8 caracteres" /></div>}
        {(mode === 'registro' || mode === 'restablecer') && <div className="field"><label htmlFor="confirmation">Confirmar contraseña</label><Input id="confirmation" name="confirmation" type="password" minLength={8} autoComplete="new-password" required /></div>}
        {mode === 'login' && <div className="auth-recovery"><Link className="text-link" to="/recuperar-contrasena">¿Olvidaste tu contraseña?</Link></div>}
        {message && <p role="alert" className="error-note">{message}</p>}
        {success && <p role="status" className="notice">{success}</p>}
        <Button type="submit" disabled={busy}>{busy ? <Loader2 className="animate-spin" /> : null}{action}<ArrowRight /></Button>
      </form>
      <p className="auth-links">{mode === 'login' ? <>¿No tienes cuenta? <Link className="text-link" to="/registro">Regístrate</Link></> : <>¿Ya tienes cuenta? <Link className="text-link" to="/login">Inicia sesión</Link></>}</p></section></main>;
}
