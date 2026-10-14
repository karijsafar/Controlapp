import { createFileRoute } from "@tanstack/react-router";
import { Panel } from "@/components/controlapp/panel";
import { pageHead } from "@/components/controlapp/meta";
export const Route = createFileRoute("/")({
  head: () => pageHead("Mis diagnósticos", "Consulta los diagnósticos de tu empresa y comienza una nueva evaluación financiera."),
  component: Panel,
});
