import Link from "next/link";
import type { ReactNode } from "react";
import { autorizarPagina, ErroAcesso } from "@/lib/profissionais/autorizacao";
import type { Cargo, Profissional } from "@/lib/profissionais/modelos";
import Estrutura from "./Estrutura";
export default async function Protegido({ cargo, children }: { cargo?: Cargo; children: (profissional: Profissional) => ReactNode }) {
  try { const profissional = await autorizarPagina(cargo); return <Estrutura profissional={profissional}>{children(profissional)}</Estrutura>; }
  catch (erro) { return <main className="sv-public mx-auto max-w-lg p-8 py-20"><h1 className="text-3xl font-bold text-[#005F8F]">Acesso profissional protegido</h1><p role="alert" className="mt-5 leading-7">{erro instanceof ErroAcesso ? erro.message : "Não foi possível validar o acesso. Confira a configuração do servidor."}</p><Link href="/profissional" className="sv-button mt-6">Verificar minha conta</Link><Link href="/login?area=profissional" className="mt-5 block text-[#005F8F] underline">Entrar novamente</Link></main>; }
}
