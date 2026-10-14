import { createFileRoute } from '@tanstack/react-router';
import { SavedReport } from '@/components/controlapp/report';
import { pageHead } from '@/components/controlapp/meta';
export const Route = createFileRoute('/_authenticated/diagnostico/$id')({
 head: () => pageHead('Informe financiero', 'Consulta el informe de salud económica y financiera de tu empresa.'),
 component: Screen,
});
function Screen() { const { id } = Route.useParams(); return <SavedReport id={id} />; }
