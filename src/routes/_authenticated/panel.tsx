import { createFileRoute } from '@tanstack/react-router';
import { Panel } from '@/components/controlapp/panel';
import { pageHead } from '@/components/controlapp/meta';
export const Route = createFileRoute('/_authenticated/panel')({
 head: () => pageHead('Mis diagnósticos', 'Consulta y organiza los diagnósticos financieros de tu empresa.'),
 component: Screen,
});
function Screen() { return <Panel />; }
