import Link from "next/link";
import Icone, { type NomeIcone } from "@/componentes/publico/Icone";
import TelaSimples from "./TelaSimples";
const opcoes: [string, string, NomeIcone][] = [
  ["/agendamentos", "Consultas", "agenda"],
  ["/medicamentos", "Remédios", "medicamento"],
  ["/vacinacao", "Vacinas", "vacina"],
  ["/perfil", "Meu perfil", "pessoa"],
];
export default function InicioSimples() {
  return <TelaSimples titulo="O que você precisa?" icone="casa" voltar={null}><nav aria-label="Serviços no Modo Simples" className="grid gap-4 sm:grid-cols-2">{opcoes.map(([url, titulo, icone]) => <Link key={url} href={url} className="flex min-h-36 items-center gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-[#007DB8]"><span className="rounded-2xl bg-sky-50 p-5 text-[#007DB8]"><Icone nome={icone} className="h-12 w-12" /></span><span className="flex-1 text-2xl font-bold text-[#005F8F]">{titulo}</span><span aria-hidden="true" className="text-3xl text-[#005F8F]">›</span></Link>)}</nav></TelaSimples>;
}
