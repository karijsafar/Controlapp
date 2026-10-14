import { createFileRoute } from '@tanstack/react-router';
import { AuthScreen } from '@/components/controlapp/auth';
import { pageHead } from '@/components/controlapp/meta';
export const Route = createFileRoute('/restablecer-contrasena')({
 head: () => pageHead('Restablecer contraseña', 'Elige una nueva contraseña para tu cuenta CONTROLAPP.'),
 component: Screen,
});
function Screen() { return <AuthScreen mode="restablecer"/>; }
