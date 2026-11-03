import Protegido from "@/componentes/profissional/Protegido";
import Recepcao from "@/componentes/profissional/Recepcao";
export const dynamic = "force-dynamic";
export default function Pagina() { return <Protegido cargo="recepcao">{() => <Recepcao />}</Protegido>; }
