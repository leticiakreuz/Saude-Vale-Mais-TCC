import Cabecalho from "@/componentes/publico/Cabecalho";
import Rodape from "@/componentes/publico/Rodape";
import ConfiguracoesAcessibilidade from "@/componentes/ConfiguracoesAcessibilidade";
export default function Configuracoes() {
  return <div className="sv-public"><Cabecalho /><main id="conteudo" className="sv-container py-12"><ConfiguracoesAcessibilidade /></main><Rodape /></div>;
}
