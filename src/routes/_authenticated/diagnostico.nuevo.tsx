import { createFileRoute } from '@tanstack/react-router';
import { Wizard } from '@/components/controlapp/wizard';
import { pageHead } from '@/components/controlapp/meta';
export const Route = createFileRoute('/_authenticated/diagnostico/nuevo')({
 head: () => pageHead('Nuevo diagnóstico', 'Completa los datos de tu empresa, el cuestionario y tus estados financieros.'),
 component: Screen,
});
function Screen() { return <Wizard />; }
