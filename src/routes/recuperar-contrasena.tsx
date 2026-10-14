import { createFileRoute } from '@tanstack/react-router';
import { AuthScreen } from '@/components/controlapp/auth';
import { pageHead } from '@/components/controlapp/meta';
export const Route = createFileRoute('/recuperar-contrasena')({
 head: () => pageHead('Recuperar contraseña', 'Recupera el acceso a tu cuenta de CONTROLAPP.'),
 component: Screen,
});
function Screen() { return <AuthScreen mode="recuperar"/>; }
