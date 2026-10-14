import { createFileRoute } from '@tanstack/react-router';
import { AuthScreen } from '@/components/controlapp/auth';
import { pageHead } from '@/components/controlapp/meta';
export const Route = createFileRoute('/registro')({
 head: () => pageHead('Crear cuenta', 'Crea tu cuenta para conocer la salud económica y financiera de tu empresa.'),
 component: Screen,
});
function Screen() { return <AuthScreen mode="registro"/>; }
