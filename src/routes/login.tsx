import { createFileRoute } from '@tanstack/react-router';
import { AuthScreen } from '@/components/controlapp/auth';
import { pageHead } from '@/components/controlapp/meta';
export const Route = createFileRoute('/login')({
 validateSearch: (s: Record<string, unknown>): { redirect?: string | undefined } => ({ redirect: typeof s['redirect'] === 'string' ? s['redirect'] : undefined }),
 head: () => pageHead('Iniciar sesión', 'Accede a tu cuenta de CONTROLAPP y tus diagnósticos financieros.'),
 component: Screen,
});
function Screen() { const { redirect } = Route.useSearch(); return <AuthScreen mode="login" redirect={redirect}/>; }
