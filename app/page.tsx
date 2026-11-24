import Image from "next/image";
import Link from "next/link";
import Cabecalho from "@/componentes/publico/Cabecalho";
import Rodape from "@/componentes/publico/Rodape";
import Icone, { type NomeIcone } from "@/componentes/publico/Icone";

const servicos: { nome: string; descricao: string; url: string; icone: NomeIcone; cor: string }[] = [
  { nome: "Agendamentos", descricao: "Consulte horários e acompanhe suas consultas na unidade de referência.", url: "/agendamentos", icone: "agenda", cor: "bg-sky-50 text-[#007DB8]" },
  { nome: "Medicamentos", descricao: "Veja os medicamentos vinculados à sua conta e a situação de retirada.", url: "/medicamentos", icone: "medicamento", cor: "bg-green-50 text-green-700" },
  { nome: "Vacinação", descricao: "Acompanhe sua carteirinha e os registros cadastrados pela equipe.", url: "/vacinacao", icone: "vacina", cor: "bg-sky-50 text-[#007DB8]" },
  { nome: "Informações do SUS", descricao: "Entenda os serviços, seus direitos e por onde começar a buscar atendimento.", url: "/sobre-sus", icone: "sus", cor: "bg-green-50 text-green-700" },
];
export default function Home() {
  return <div className="sv-public"><Cabecalho /><main id="conteudo">
    <section className="relative overflow-hidden bg-[#EFF8FC]"><div className="sv-container grid items-center gap-12 py-14 lg:grid-cols-[1.05fr_1fr] lg:py-20">
      <div><p className="sv-eyebrow">Mais perto de você</p><h1 className="mt-5 text-4xl font-extrabold leading-[1.12] tracking-tight sm:text-5xl xl:text-6xl">Seu cuidado,<br /><span className="text-[#007DB8]">mais simples.</span><br />Sua saúde, mais perto.</h1><p className="mt-6 max-w-lg text-lg leading-8 text-slate-600">Organize consultas, acompanhe medicamentos e veja sua vacinação. O Saúde Vale+ reúne seus próximos passos em um só lugar.</p><div className="mt-8 flex flex-col gap-3 sm:flex-row"><Link href="/cadastro" className="sv-button">Criar uma conta <Icone nome="seta" className="h-5 w-5" /></Link></div><p className="mt-6 text-sm text-slate-600">Já tem uma conta? <Link href="/login" className="font-bold text-[#005F8F] underline underline-offset-4">Entre aqui</Link></p></div>
      <div className="sv-decorative relative pb-9 lg:pl-6"><div className="absolute inset-3 rounded-[3rem] bg-[#8ED3F5]/40" /><div className="relative overflow-hidden rounded-[2rem] bg-white"><Image src="/imagens/acolhimento-realista.png" alt="Profissional de saúde acolhendo uma senhora e seu acompanhante em uma unidade de saúde" width={1402} height={1122} sizes="(max-width: 1024px) 100vw, 48vw" preload className="aspect-[1.18] w-full object-cover" /><div className="p-6"><p className="text-xs font-bold uppercase tracking-widest text-[#007DB8]">Saúde Vale+</p><p className="mt-2 text-xl font-bold text-[#005F8F]">O cuidado começa com o acesso.</p></div></div></div>
    </div></section>
    <section id="servicos" className="sv-section pb-8!"><div className="sv-container"><div className="text-center"><p className="sv-eyebrow">O que você precisa hoje?</p><h2 className="sv-title">Seu cuidado em um só lugar</h2></div><div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{servicos.map(s => <Link key={s.nome} href={s.url} className="group rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-[#007DB8] hover:shadow-lg hover:shadow-sky-950/5"><span className={`inline-flex rounded-xl p-3 ${s.cor}`}><Icone nome={s.icone} /></span><h3 className="mt-5 text-lg font-bold">{s.nome}</h3><p className="mt-3 text-sm leading-6 text-slate-600">{s.descricao}</p><span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#005F8F]">Acessar <Icone nome="seta" className="h-4 w-4" /></span></Link>)}</div></div></section>
    <section id="como-funciona" className="sv-section bg-[#F5F7FA] py-14! lg:py-16!">
      <div className="sv-container">
        <div className="text-center"><p className="sv-eyebrow">Um passo de cada vez</p><h2 className="sv-title">É fácil começar</h2></div>
        <ol className="mt-10 grid gap-10 md:grid-cols-3 lg:gap-12">
          {[["Crie sua conta", "Informe nome e CPF e crie seu acesso com e-mail e senha."], ["Complete seu perfil", "Depois de entrar, preencha seus dados e confira a UBS vinculada ao seu endereço em Blumenau."], ["Acompanhe seus serviços", "Com o perfil completo, escolha o que precisa e consulte suas informações."]].map(([titulo, texto], i) => <li key={titulo} className="border-t-2 border-[#8ED3F5] pt-6"><span className="text-3xl font-extrabold text-[#007DB8]">0{i + 1}</span><h3 className="mt-5 text-xl font-bold">{titulo}</h3><p className="mt-4 max-w-sm leading-7 text-slate-600">{texto}</p></li>)}
        </ol>
        <Link href="/cadastro" className="sv-button mt-10">Quero criar minha conta <Icone nome="seta" className="h-5 w-5" /></Link>
      </div>
    </section>
  </main><Rodape /></div>;
}
