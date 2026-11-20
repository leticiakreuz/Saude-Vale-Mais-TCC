import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Cabecalho from "@/componentes/publico/Cabecalho";
import Rodape from "@/componentes/publico/Rodape";
import Icone, { type NomeIcone } from "@/componentes/publico/Icone";

export const metadata: Metadata = {
  title: "Conheça o SUS | Saúde Vale+",
  description: "Entenda o SUS, conheça os serviços e seus direitos e saiba por onde começar na sua unidade de saúde.",
};

const fontes = [
  { titulo: "O Sistema Único de Saúde", url: "https://www.gov.br/saude/pt-br/sus" },
  { titulo: "Atenção Primária à Saúde", url: "https://www.gov.br/saude/pt-br/composicao/saps" },
  { titulo: "Carta dos Direitos e Deveres", url: "https://www.gov.br/saude/pt-br/centrais-de-conteudo/publicacoes/cartilhas/2019/cartas-dos-direitos-e-deveres-da-pessoa-usuaria-da-saude" },
];
const atalhos: { titulo: string; destino: string; icone: NomeIcone }[] = [
  { titulo: "Entenda o SUS", destino: "#entenda-sus", icone: "sus" },
  { titulo: "Por onde começar", destino: "#por-onde-comecar", icone: "casa" },
  { titulo: "Serviços e direitos", destino: "#servicos-rede", icone: "escudo" },
  { titulo: "Tire suas dúvidas", destino: "#duvidas", icone: "mensagem" },
];
const principios: { titulo: string; texto: string; icone: NomeIcone; cor: string }[] = [
  { titulo: "Universalidade", texto: "A saúde é um direito de todas as pessoas. O acesso ao sistema deve acolher a população sem discriminação.", icone: "pessoas", cor: "bg-sky-50 text-[#007DB8]" },
  { titulo: "Integralidade", texto: "O cuidado considera a pessoa como um todo, da prevenção ao tratamento e à recuperação.", icone: "escudo", cor: "bg-emerald-50 text-emerald-700" },
  { titulo: "Equidade", texto: "Necessidades diferentes recebem atenção para reduzir desigualdades no acesso à saúde.", icone: "pessoa", cor: "bg-indigo-50 text-indigo-700" },
];
const passos = [
  ["Localize sua unidade", "Procure a UBS de referência da sua região na rede municipal de saúde."],
  ["Confira o atendimento", "Pergunte sobre cadastro, documentos, horários e serviços disponíveis."],
  ["Conte com a equipe", "A equipe acompanha seu cuidado e orienta os encaminhamentos na rede."],
];
const servicos: { titulo: string; texto: string; icone: NomeIcone; cor: string }[] = [
  { titulo: "Consultas e prevenção", texto: "Acompanhamento da saúde e ações de prevenção na Atenção Primária.", icone: "estetoscopio", cor: "bg-sky-50 text-[#007DB8]" },
  { titulo: "Vacinação", texto: "Imunização conforme os programas e as orientações do serviço de saúde.", icone: "vacina", cor: "bg-indigo-50 text-indigo-700" },
  { titulo: "Medicamentos", texto: "Assistência farmacêutica conforme as listas e os critérios da rede.", icone: "medicamento", cor: "bg-emerald-50 text-emerald-700" },
  { titulo: "Cuidado especializado", texto: "Saúde bucal, atendimento especializado e hospitalar, conforme os fluxos da rede.", icone: "pessoas", cor: "bg-violet-50 text-violet-700" },
];
const perguntas = [
  ["Preciso pagar pelos serviços do SUS?", "Os serviços públicos do SUS são gratuitos para a pessoa usuária. Confira na unidade como acessar o atendimento de que precisa."],
  ["Posso ir diretamente a um especialista?", "Em geral, a equipe da Atenção Primária avalia a necessidade de encaminhamento. Os caminhos variam conforme o serviço e a organização local."],
  ["O que levo à UBS?", "Confirme com a unidade os documentos e as informações necessários para o cadastro e o atendimento que você procura."],
  ["O Saúde Vale+ é um sistema oficial do SUS?", "Não. É um projeto acadêmico de TCC, sem integração oficial com bases ou agendas do governo. Os registros de demonstração são fictícios."],
  ["A carteirinha do projeto substitui a carteira oficial?", "Não. Os registros e comprovantes deste projeto são demonstrativos. Para comprovação, consulte seus documentos e os canais oficiais da rede de saúde."],
];

function TituloSecao({ etiqueta, titulo, descricao }: { etiqueta: string; titulo: string; descricao?: string }) {
  return <div className="mx-auto max-w-2xl text-center">
    <p className="sv-eyebrow">{etiqueta}</p>
    <h2 className="sv-title">{titulo}</h2>
    {descricao && <p className="mt-4 text-base leading-7 text-slate-600">{descricao}</p>}
  </div>;
}

export default function SobreSusPage() {
  return <div className="sv-public">
    <Cabecalho />
    <main id="conteudo">
      <section className="border-b border-sky-100 bg-[#EFF8FC]">
        <div className="sv-container pb-12 pt-6 sm:pb-16 sm:pt-8">
          <nav aria-label="Caminho da página" className="flex items-center gap-2 text-sm text-[#005F8F]">
            <Link href="/" className="rounded py-2 hover:underline">Início</Link><span aria-hidden="true">/</span><span aria-current="page">Conheça o SUS</span>
          </nav>
          <div className="mt-8 grid items-center gap-10 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
            <div className="text-center">
              <p className="sv-eyebrow">Informação que aproxima</p>
              <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight text-[#005F8F] sm:text-5xl">O SUS faz parte<br />da sua vida.</h1>
              <p className="mx-auto mt-5 max-w-lg text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">Entenda como a rede pública funciona e encontre caminhos para cuidar da sua saúde.</p>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <a href="#por-onde-comecar" className="sv-button">Por onde começar? <Icone nome="seta" className="h-4 w-4" /></a>
                <a href="#duvidas" className="sv-button sv-button-outline">Tirar uma dúvida</a>
              </div>
            </div>
            <div className="sv-decorative overflow-hidden rounded-3xl border border-white bg-white p-2 shadow-sm">
              <Image src="/imagens/conheca-sus-realista.png" alt="Profissional de saúde conversando com uma senhora durante um atendimento em uma unidade de saúde" width={1672} height={941} sizes="(max-width: 1024px) 100vw, 50vw" preload className="aspect-[16/10] w-full rounded-[1.15rem] object-cover" />
            </div>
          </div>
        </div>
      </section>

      <nav aria-label="Nesta página" className="sv-container py-8 sm:py-10">
        <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-white p-2 sm:gap-3 md:grid-cols-4">
          {atalhos.map(item => <a key={item.destino} href={item.destino} className="flex min-h-12 items-center justify-center gap-2 rounded-xl px-2 py-3 text-center text-xs font-bold text-[#005F8F] transition hover:bg-sky-50 sm:text-sm">
            <Icone nome={item.icone} className="h-5 w-5 shrink-0 text-[#007DB8]" />{item.titulo}
          </a>)}
        </div>
      </nav>

      <section id="entenda-sus" className="scroll-mt-8 pb-16 pt-6 sm:pb-20 sm:pt-8">
        <div className="sv-container">
          <div className="mx-auto max-w-3xl rounded-3xl border border-sky-200 bg-[#E8F5FC] px-6 py-8 text-center shadow-sm sm:px-10 sm:py-10">
            <p className="inline-flex items-center gap-2 rounded-full bg-[#005F8F] px-4 py-2 text-xs font-extrabold uppercase tracking-[0.12em] text-white"><Icone nome="sus" className="h-5 w-5" />O que é o SUS?</p>
            <h2 className="mt-5 text-balance text-3xl font-extrabold leading-tight tracking-tight text-[#005F8F] sm:text-4xl">Uma rede que cuida de pessoas</h2>
            <p className="mt-5 text-lg leading-8 text-slate-700">O Sistema Único de Saúde reúne serviços públicos que vão da prevenção ao tratamento. O cuidado conecta a atenção básica, os serviços especializados e os hospitais.</p>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {principios.map(item => <article key={item.titulo} className="rounded-2xl border border-slate-200 bg-white px-6 py-8 text-center sm:px-4 lg:px-7 lg:py-9">
              <span className={`mx-auto flex h-11 w-11 items-center justify-center rounded-2xl ${item.cor}`}><Icone nome={item.icone} className="h-6 w-6" /></span>
              <h3 className="mt-4 text-lg font-bold text-[#005F8F]">{item.titulo}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{item.texto}</p>
            </article>)}
          </div>
        </div>
      </section>

      <section id="por-onde-comecar" className="sv-container scroll-mt-8 pb-16 sm:pb-20">
        <div className="grid gap-10 overflow-hidden rounded-3xl bg-[#005F8F] px-6 py-9 text-white sm:p-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:p-12">
          <div className="self-center text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10"><Icone nome="casa" className="h-7 w-7" /></span>
            <p className="mt-5 text-xs font-bold uppercase tracking-[0.15em] text-sky-100">Por onde começar?</p>
            <h2 className="mt-3 text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">Sua UBS é um ponto de apoio.</h2>
            <p className="mt-4 text-sm leading-7 text-sky-100">Para os cuidados de rotina, a Unidade Básica de Saúde é uma referência próxima. A equipe acompanha sua saúde e ajuda a organizar o cuidado.</p>
            <a href={fontes[1].url} target="_blank" rel="noreferrer" className="mt-5 inline-flex min-h-11 items-center gap-2 py-2 text-sm font-bold text-white underline underline-offset-4">Entenda a Atenção Primária <span aria-hidden="true">↗</span></a>
          </div>
          <ol className="rounded-2xl border border-white/15 bg-white/10 px-5 sm:px-6">
            {passos.map(([titulo, texto], i) => <li key={titulo} className="flex gap-4 border-b border-white/15 py-6 last:border-0 sm:py-7">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-sm font-extrabold text-[#005F8F]">{i + 1}</span>
              <div className="min-w-0"><h3 className="text-base font-bold">{titulo}</h3><p className="mt-2 text-sm leading-6 text-sky-100">{texto}</p></div>
            </li>)}
          </ol>
        </div>
      </section>

      <section id="servicos-rede" className="scroll-mt-8 border-y border-slate-200/70 bg-white py-16 sm:py-20">
        <div className="sv-container">
          <TituloSecao etiqueta="Serviços da rede" titulo="O cuidado vai além da consulta" />
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {servicos.map(item => <article key={item.titulo} className="rounded-2xl border border-slate-200 bg-[#F5F7FA] p-6">
              <span className={`inline-flex rounded-xl p-3 ${item.cor}`}><Icone nome={item.icone} className="h-6 w-6" /></span>
              <h3 className="mt-4 text-base font-bold text-[#005F8F]">{item.titulo}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{item.texto}</p>
            </article>)}
          </div>
          <div className="mt-16 border-t border-slate-200 pt-12">
            <h2 className="text-center text-2xl font-extrabold tracking-tight text-[#005F8F]">Respeito em cada atendimento</h2>
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <article className="rounded-2xl border border-sky-100 bg-sky-50 p-5 sm:p-6">
                <h3 className="flex items-center gap-3 text-lg font-bold text-[#005F8F]"><Icone nome="escudo" className="h-6 w-6 shrink-0" />Seus direitos</h3>
                <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-600"><li>Atendimento acolhedor e sem discriminação.</li><li>Informações claras sobre seu cuidado.</li><li>Respeito à privacidade e às suas escolhas.</li></ul>
              </article>
              <article className="rounded-2xl border border-slate-200 bg-[#F5F7FA] p-6 sm:p-6">
                <h3 className="flex items-center gap-3 text-lg font-bold text-[#005F8F]"><Icone nome="pessoas" className="h-6 w-6 shrink-0" />Sua participação</h3>
                <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-600"><li>Informe seus dados e necessidades corretamente.</li><li>Respeite as pessoas e a organização do serviço.</li><li>Avise se não puder comparecer ao atendimento.</li></ul>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section id="duvidas" className="scroll-mt-8 py-16 sm:py-20">
        <div className="sv-container">
          <TituloSecao etiqueta="Informação ao seu alcance" titulo="Ainda tem alguma dúvida?" />
          <div className="mt-10 grid items-start gap-8 lg:grid-cols-[1.45fr_1fr] lg:gap-12">
            <div className="space-y-4">
              {perguntas.map(([pergunta, resposta]) => <details key={pergunta} className="group rounded-2xl border border-slate-200 bg-white open:border-sky-300">
                <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 p-6 text-sm font-bold text-[#005F8F] [&::-webkit-details-marker]:hidden">
                  {pergunta}<Icone nome="seta" className="h-4 w-4 shrink-0 rotate-90 transition-transform group-open:-rotate-90" />
                </summary>
                <p className="px-6 pb-6 text-sm leading-7 text-slate-600">{resposta}</p>
              </details>)}
            </div>
            <aside id="fontes" className="scroll-mt-6 rounded-2xl border border-sky-100 bg-[#EFF8FC] p-5 sm:p-6">
              <span className="inline-flex rounded-xl bg-white p-3 text-[#007DB8]"><Icone nome="escudo" className="h-6 w-6" /></span>
              <h3 className="mt-4 text-xl font-extrabold text-[#005F8F]">Informação de fonte segura</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">Aprofunde sua leitura nos canais do Ministério da Saúde.</p>
              <ul className="mt-4 divide-y divide-sky-200">
                {fontes.map(fonte => <li key={fonte.url}><a href={fonte.url} target="_blank" rel="noreferrer" className="flex min-h-14 items-center justify-between gap-4 py-3 text-sm font-bold text-[#005F8F] hover:underline">{fonte.titulo}<span aria-hidden="true">↗</span></a></li>)}
              </ul>
              <p className="mt-4 text-xs leading-5 text-slate-500">Conteúdo educativo. Fontes consultadas em 20 de novembro de 2026.</p>
            </aside>
          </div>
        </div>
      </section>
    </main>
    <Rodape />
  </div>;
}
