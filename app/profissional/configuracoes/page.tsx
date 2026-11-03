import Protegido from "@/componentes/profissional/Protegido";
import ConfiguracoesAcessibilidade from "@/componentes/ConfiguracoesAcessibilidade";
export const dynamic = "force-dynamic";
export default function Configuracoes() {
  return <Protegido>{() => <ConfiguracoesAcessibilidade />}</Protegido>;
}
