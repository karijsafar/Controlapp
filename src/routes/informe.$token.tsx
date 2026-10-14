import { createFileRoute } from '@tanstack/react-router';
import { ReportScreen } from '@/components/controlapp/report';
import { pageHead } from '@/components/controlapp/meta';
export const Route = createFileRoute('/informe/$token')({
 head: () => pageHead('Informe compartido', 'Consulta un diagnóstico financiero compartido en modo de solo lectura.'),
 component: Screen,
});
function Screen() { const { token } = Route.useParams(); return <ReportScreen token={token} />; }
