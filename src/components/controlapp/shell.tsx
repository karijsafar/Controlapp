import { Link, useLocation, useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { ClipboardList, UserRound, LogIn, UserPlus, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useSessionUser } from '@/lib/use-session';
import { Logo } from './logo';
export function AppHeader() {
 const { pathname } = useLocation(); const navigate = useNavigate(); const queryClient = useQueryClient();
 const { user } = useSessionUser();
 const isAuth = ['/login','/registro','/recuperar-contrasena','/restablecer-contrasena'].includes(pathname);
 const signOut = async () => { await queryClient.cancelQueries(); queryClient.clear(); await supabase.auth.signOut(); navigate({ to: '/login', replace: true }); };
 return <header className="site-header"><div className="header-inner"><Link to="/" className="no-underline"><Logo/></Link><nav className="header-nav" aria-label="Navegación principal">{!isAuth && user && <Link to="/panel" className="nav-current"><ClipboardList size={17}/>Mis diagnósticos</Link>}<DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" className="user-button" aria-label="Mi cuenta"><UserRound size={18}/></Button></DropdownMenuTrigger><DropdownMenuContent align="end">{user ? <><DropdownMenuLabel className="font-normal text-xs text-muted-foreground">{user.email}</DropdownMenuLabel><DropdownMenuSeparator/><DropdownMenuItem asChild><Link to="/panel"><ClipboardList/>Mis diagnósticos</Link></DropdownMenuItem><DropdownMenuItem onSelect={signOut}><LogOut/>Cerrar sesión</DropdownMenuItem></> : <><DropdownMenuItem asChild><Link to="/login"><LogIn/>Iniciar sesión</Link></DropdownMenuItem><DropdownMenuItem asChild><Link to="/registro"><UserPlus/>Crear cuenta</Link></DropdownMenuItem></>}</DropdownMenuContent></DropdownMenu></nav></div></header>;
}
export function AppFooter() { return <footer className="site-footer"><span className="footer-brand">CONTROLAPP</span><span>Claridad para decidir. Control para crecer.</span><span>© 2026 CONTROLAPP</span></footer>; }
export function LegalNotice() { return <div className="legal"><p>Este informe es un diagnóstico orientativo generado automáticamente a partir de la información proporcionada. No constituye asesoramiento contable, financiero ni impositivo. Te recomendamos consultar con un contador antes de tomar decisiones.</p><p className="mt-2">En contextos de inflación alta, los indicadores calculados con valores nominales pueden verse distorsionados.</p></div>; }
