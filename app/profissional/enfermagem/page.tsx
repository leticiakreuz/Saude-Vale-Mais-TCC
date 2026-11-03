import Protegido from "@/componentes/profissional/Protegido";
import Clinica from "@/componentes/profissional/Clinica";
export const dynamic = "force-dynamic";
export default function Pagina() { return <Protegido cargo="enfermagem">{p => <Clinica profissional={p} />}</Protegido>; }
