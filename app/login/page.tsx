import EntrarFormulario from "@/componentes/EntrarFormulario";
export default async function Login({ searchParams }: { searchParams: Promise<{ area?: string }> }) {
  const { area } = await searchParams;
  return <EntrarFormulario profissional={area === "profissional"} />;
}
