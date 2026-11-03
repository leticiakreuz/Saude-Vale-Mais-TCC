import Link from "next/link";
import Image from "next/image";
import AcoesConta from "./AcoesConta";
const links = [["/#servicos", "Serviços"], ["/#como-funciona", "Como funciona"], ["/sobre-sus", "Conheça o SUS"]];
export default function Cabecalho({ profissional = false }: { profissional?: boolean }) {
  const login = profissional ? "/login?area=profissional" : "/login";
  return <>
    <a href="#conteudo" className="pular-conteudo">Pular para o conteúdo</a>
    <header className="bg-[#0A5C83] text-white"><div className="sv-container flex min-h-24 flex-wrap items-center justify-between gap-4 py-3">
      <Link href="/" aria-label="Saúde Vale+, início" className="flex shrink-0 items-center"><Image src="/imagens/logo-saude-vale-mais-1.png" alt="Saúde Vale+" width={1024} height={512} preload className="h-14 w-auto object-contain sm:h-20" /></Link>
      <nav aria-label="Navegação principal" className="hidden items-center gap-7 text-sm font-semibold lg:flex">{links.map(([url, nome]) => <Link key={url} href={url} className="hover:text-sky-200">{nome}</Link>)}</nav>
      <AcoesConta login={login} />
    </div></header>
  </>;
}
