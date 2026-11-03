import Protegido from "@/componentes/profissional/Protegido";
import Administracao from "@/componentes/profissional/Administracao";
import { abaAdministracao } from "@/lib/profissionais/abasAdministracao";
export const dynamic = "force-dynamic";
export default async function Pagina({ searchParams }: { searchParams: Promise<{ aba?: string | string[] }> }) {
  const parametros = await searchParams;
  const aba = abaAdministracao(parametros.aba);
  return <Protegido cargo="administracao">{p => <Administracao aba={aba} unidade={p.unidadeReferencia} />}</Protegido>;
}
