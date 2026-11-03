import Link from "next/link";
import Image from "next/image";
const links = [["/#servicos", "Serviços"], ["/#como-funciona", "Como funciona"], ["/sobre-sus", "Conheça o SUS"]];
export default function Cabecalho({ profissional = false }: { profissional?: boolean }) {
  const login = profissional ? "/login?area=profissional" : "/login";
  return <>
    <a href="#conteudo" className="pular-conteudo">Pular para o conteúdo</a>
    <header className="bg-[#0A5C83] text-white"><div className="sv-container flex min-h-24 flex-wrap items-center justify-between gap-4 py-3">
      <Link href="/" aria-label="Saúde Vale+, início" className="flex shrink-0 items-center"><Image src="/imagens/logo-saude-vale-mais-1.png" alt="Saúde Vale+" width={1024} height={512} preload className="h-16 w-auto object-contain sm:h-20" /></Link>
      <nav aria-label="Navegação principal" className="hidden items-center gap-7 text-sm font-semibold lg:flex">{links.map(([url, nome]) => <Link key={url} href={url} className="hover:text-sky-200">{nome}</Link>)}</nav>
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/profissional" className="hidden rounded-lg border border-white/60 px-3 py-3 text-sm font-bold hover:bg-white/15 sm:inline-flex">Sou profissional</Link>
        <Link href={login} className="hidden rounded-lg px-2 py-3 text-sm font-bold hover:bg-white/15 sm:inline-flex">Entrar</Link>
        <Link href="/cadastro" className="rounded-xl bg-white px-4 py-3 text-sm font-bold text-[#005F8F] hover:bg-sky-50">Criar conta</Link>
        <details className="relative lg:hidden"><summary className="cursor-pointer rounded-lg border border-white/70 px-3 py-3 text-sm font-bold">Menu</summary><nav aria-label="Menu para celular" className="absolute right-0 z-30 mt-3 w-60 rounded-2xl border border-slate-200 bg-white p-3 text-slate-800 shadow-xl">{[...links, [login, "Entrar"], ["/profissional", "Área profissional"]].map(([url, nome]) => <Link key={url} href={url} className="block rounded-lg px-4 py-3 text-sm font-semibold hover:bg-sky-50">{nome}</Link>)}</nav></details>
      </div>
    </div></header>
  </>;
}
