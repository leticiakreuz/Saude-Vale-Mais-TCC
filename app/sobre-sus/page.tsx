import Image from "next/image";
import Link from "next/link";

import Header from "../../componentes/Header";
import Navigation from "../../componentes/Navigation";
import Footer from "../../componentes/Footer";

export default function SobreSusPage() {
  return (
    <div className="min-h-screen bg-white text-[#111827]">
      <Header />
      <Navigation />

      <main>
        {/* INTRODUÇÃO */}
        <section className="bg-[#F5F7FA] px-6 py-14 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto mt-10 max-w-4xl text-center">
              <span className="font-[family-name:var(--font-inter)] text-sm font-bold uppercase tracking-[0.18em] text-[#007DB8]">
                Sistema Único de Saúde
              </span>

              <h1 className="mt-3 font-[family-name:var(--font-inter)] text-3xl font-extrabold leading-tight tracking-tight text-[#005F8F] sm:text-5xl">
                Conheça o SUS
              </h1>

              <p className="mt-5 font-[family-name:var(--font-roboto)] text-base leading-8 text-[#111827]/70 sm:text-lg">
                Um sistema público criado para promover saúde, prevenir
                doenças e oferecer atendimento à população brasileira.
              </p>
            </div>
          </div>
        </section>

        {/* O QUE É O SUS */}
        <section className="px-6 py-14 sm:py-20 lg:px-8">
          <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <span className="font-[family-name:var(--font-inter)] text-sm font-bold uppercase tracking-widest text-[#007DB8]">
                Entenda o sistema
              </span>

              <h2 className="mt-3 font-[family-name:var(--font-inter)] text-2xl font-extrabold leading-tight text-[#111827] sm:text-4xl">
                O que é o Sistema Único de Saúde?
              </h2>

              <p className="mt-5 font-[family-name:var(--font-roboto)] text-base leading-8 text-[#111827]/70">
                O SUS é o sistema público de saúde do Brasil. Ele garante
                o acesso à saúde como um direito de todos e envolve ações
                e serviços oferecidos em diferentes níveis de atendimento.
              </p>

              <p className="mt-4 font-[family-name:var(--font-roboto)] text-base leading-8 text-[#111827]/70">
                Seu trabalho vai muito além de consultas médicas. Inclui
                vacinação, prevenção de doenças, acompanhamento de saúde,
                exames, tratamentos, vigilância sanitária e atendimento
                hospitalar, conforme a necessidade de cada pessoa.
              </p>

              <p className="mt-4 font-[family-name:var(--font-roboto)] text-base leading-8 text-[#111827]/70">
                O objetivo é cuidar da população, promover qualidade de
                vida e ampliar o acesso aos serviços de saúde.
              </p>
            </div>

            <div className="rounded-3xl border border-[#D1D5DB] bg-[#F5F7FA] p-6 sm:p-8">
              <h3 className="font-[family-name:var(--font-inter)] text-xl font-extrabold text-[#005F8F]">
                O SUS está presente em diferentes momentos da vida
              </h3>

              <div className="mt-6 space-y-5">
                <div className="flex gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#8ED3F5]/35 text-xl">
                    🩺
                  </div>

                  <div>
                    <h4 className="font-[family-name:var(--font-inter)] font-bold text-[#111827]">
                      Prevenção e acompanhamento
                    </h4>

                    <p className="mt-1 font-[family-name:var(--font-roboto)] text-sm leading-6 text-[#111827]/65">
                      Consultas, orientações de saúde, vacinação e
                      acompanhamento contínuo.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#22C55E]/10 text-xl">
                    🧪
                  </div>

                  <div>
                    <h4 className="font-[family-name:var(--font-inter)] font-bold text-[#111827]">
                      Exames e tratamentos
                    </h4>

                    <p className="mt-1 font-[family-name:var(--font-roboto)] text-sm leading-6 text-[#111827]/65">
                      Recursos para investigar problemas de saúde e
                      realizar os tratamentos indicados.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#8ED3F5]/35 text-xl">
                    🏥
                  </div>

                  <div>
                    <h4 className="font-[family-name:var(--font-inter)] font-bold text-[#111827]">
                      Atendimento especializado
                    </h4>

                    <p className="mt-1 font-[family-name:var(--font-roboto)] text-sm leading-6 text-[#111827]/65">
                      Serviços especializados e hospitalares quando
                      necessários, conforme os fluxos de atendimento.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PRINCÍPIOS DO SUS */}
        <section className="bg-[#F5F7FA] px-6 py-14 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <span className="font-[family-name:var(--font-inter)] text-sm font-bold uppercase tracking-widest text-[#007DB8]">
                Os princípios
              </span>

              <h2 className="mt-3 font-[family-name:var(--font-inter)] text-2xl font-extrabold text-[#111827] sm:text-4xl">
                Saúde como direito de todos
              </h2>

              <p className="mt-4 font-[family-name:var(--font-roboto)] leading-7 text-[#111827]/70">
                O SUS é orientado por princípios que buscam garantir
                acesso, cuidado integral e atenção às necessidades
                de cada pessoa.
              </p>
            </div>

            <div className="mt-9 grid gap-5 md:grid-cols-3">
              <article className="rounded-3xl border border-[#D1D5DB] bg-white p-6 sm:p-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#8ED3F5]/30 text-2xl">
                  🌎
                </div>

                <h3 className="mt-5 font-[family-name:var(--font-inter)] text-xl font-extrabold text-[#005F8F]">
                  Universalidade
                </h3>

                <p className="mt-3 font-[family-name:var(--font-roboto)] text-sm leading-7 text-[#111827]/70">
                  Todas as pessoas têm direito ao acesso às ações e aos
                  serviços do SUS, sem discriminação por características
                  pessoais ou sociais.
                </p>
              </article>

              <article className="rounded-3xl border border-[#D1D5DB] bg-white p-6 sm:p-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#22C55E]/10 text-2xl">
                  ⚖️
                </div>

                <h3 className="mt-5 font-[family-name:var(--font-inter)] text-xl font-extrabold text-[#005F8F]">
                  Equidade
                </h3>

                <p className="mt-3 font-[family-name:var(--font-roboto)] text-sm leading-7 text-[#111827]/70">
                  Reconhece que as pessoas possuem necessidades diferentes.
                  Busca reduzir desigualdades e direcionar atenção a quem
                  mais precisa.
                </p>
              </article>

              <article className="rounded-3xl border border-[#D1D5DB] bg-white p-6 sm:p-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#8ED3F5]/30 text-2xl">
                  💙
                </div>

                <h3 className="mt-5 font-[family-name:var(--font-inter)] text-xl font-extrabold text-[#005F8F]">
                  Integralidade
                </h3>

                <p className="mt-3 font-[family-name:var(--font-roboto)] text-sm leading-7 text-[#111827]/70">
                  Considera a pessoa como um todo, integrando promoção
                  da saúde, prevenção, tratamento e reabilitação.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* MAIS MÉDICOS */}
        <section className="px-6 py-14 sm:py-20 lg:px-8">
          <div className="mx-auto grid max-w-7xl items-center gap-8 lg:grid-cols-2 lg:gap-14">
            <div className="overflow-hidden rounded-3xl border border-[#D1D5DB] bg-[#F5F7FA]">
              <Image
                src="/imagens/mais-medicos.png"
                alt="Campanha Mais Médicos para o Brasil"
                width={512}
                height={512}
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="h-auto w-full object-contain"
              />
            </div>

            <div>
              <span className="font-[family-name:var(--font-inter)] text-sm font-bold uppercase tracking-widest text-[#007DB8]">
                Mais acesso à saúde
              </span>

              <h2 className="mt-3 font-[family-name:var(--font-inter)] text-2xl font-extrabold text-[#005F8F] sm:text-4xl">
                Programa Mais Médicos
              </h2>

              <p className="mt-5 font-[family-name:var(--font-roboto)] leading-8 text-[#111827]/70">
                O Programa Mais Médicos busca ampliar a presença de
                profissionais médicos na atenção primária, especialmente
                em regiões com maior necessidade de atendimento.
              </p>

              <p className="mt-4 font-[family-name:var(--font-roboto)] leading-8 text-[#111827]/70">
                Além de contribuir para a assistência à população,
                o programa inclui ações de formação e qualificação
                profissional. A proposta é fortalecer o cuidado próximo
                das comunidades.
              </p>

              <a
                href="https://www.gov.br/saude/pt-br/composicao/sgtes/mais-medicos/saiba-mais/saiba-mais"
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex items-center gap-2 font-[family-name:var(--font-inter)] text-sm font-bold text-[#007DB8] transition hover:text-[#005F8F]"
              >
                Saiba mais no Ministério da Saúde
                <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>
        </section>

        {/* PROFISSIONAIS DO SUS */}
        <section className="bg-[#F5F7FA] px-6 py-14 sm:py-20 lg:px-8">
          <div className="mx-auto grid max-w-7xl items-center gap-9 lg:grid-cols-2 lg:gap-14">
            <div>
              <span className="font-[family-name:var(--font-inter)] text-sm font-bold uppercase tracking-widest text-[#007DB8]">
                Trabalho em equipe
              </span>

              <h2 className="mt-3 font-[family-name:var(--font-inter)] text-2xl font-extrabold text-[#005F8F] sm:text-4xl">
                Quem faz o SUS acontecer?
              </h2>

              <p className="mt-5 font-[family-name:var(--font-roboto)] leading-8 text-[#111827]/70">
                O funcionamento do SUS depende de profissionais de
                diferentes áreas, como medicina, enfermagem, odontologia,
                farmácia e outras especialidades.
              </p>

              <p className="mt-4 font-[family-name:var(--font-roboto)] leading-8 text-[#111827]/70">
                Esses profissionais trabalham em conjunto para orientar
                pacientes, prevenir doenças, realizar atendimentos e
                acompanhar as necessidades de saúde da comunidade.
              </p>

              <p className="mt-4 font-[family-name:var(--font-roboto)] leading-8 text-[#111827]/70">
                O acolhimento, o respeito e a comunicação ajudam a
                construir uma relação de confiança entre os cidadãos
                e as equipes de saúde.
              </p>
            </div>

            <div className="relative min-h-[300px] overflow-hidden rounded-3xl sm:min-h-[420px]">
              <Image
                src="/imagens/equipe-sus.png"
                alt="Profissionais da saúde trabalhando em equipe"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </div>
        </section>

        {/* ATENDIMENTO HOSPITALAR */}
        <section className="px-6 py-14 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid overflow-hidden rounded-3xl border border-[#D1D5DB] bg-white lg:grid-cols-2">
              <div className="relative min-h-[280px] sm:min-h-[400px]">
                <Image
                  src="/imagens/cirurgia-sus.png"
                  alt="Equipe cirúrgica realizando um procedimento hospitalar"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>

              <div className="flex flex-col justify-center bg-[#F5F7FA] p-6 sm:p-10 lg:p-12">
                <span className="font-[family-name:var(--font-inter)] text-sm font-bold uppercase tracking-widest text-[#007DB8]">
                  Cuidado especializado
                </span>

                <h2 className="mt-3 font-[family-name:var(--font-inter)] text-2xl font-extrabold text-[#005F8F] sm:text-3xl">
                  Do atendimento básico ao hospitalar
                </h2>

                <p className="mt-5 font-[family-name:var(--font-roboto)] leading-8 text-[#111827]/70">
                  O cuidado pode começar na Unidade Básica de Saúde e,
                  quando necessário, continuar em serviços especializados
                  e hospitais.
                </p>

                <p className="mt-4 font-[family-name:var(--font-roboto)] leading-8 text-[#111827]/70">
                  Exames, acompanhamento especializado, procedimentos
                  e cirurgias fazem parte dos serviços de saúde disponíveis
                  no sistema, conforme indicação clínica e organização
                  da rede de atendimento.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* COMO ACESSAR */}
        <section className="bg-[#F5F7FA] px-6 py-14 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-3xl text-center">
              <span className="font-[family-name:var(--font-inter)] text-sm font-bold uppercase tracking-widest text-[#007DB8]">
                Para o cidadão
              </span>

              <h2 className="mt-3 font-[family-name:var(--font-inter)] text-2xl font-extrabold text-[#111827] sm:text-4xl">
                Como procurar atendimento?
              </h2>

              <p className="mt-4 font-[family-name:var(--font-roboto)] leading-7 text-[#111827]/70">
                Conhecer os caminhos de acesso ajuda você a encontrar
                o serviço mais adequado para sua necessidade.
              </p>
            </div>

            <div className="mt-9 grid gap-5 md:grid-cols-3">
              <article className="rounded-2xl border border-[#D1D5DB] bg-white p-6">
                <h3 className="font-[family-name:var(--font-inter)] font-extrabold text-[#005F8F]">
                  Unidade Básica de Saúde
                </h3>

                <p className="mt-3 font-[family-name:var(--font-roboto)] text-sm leading-7 text-[#111827]/70">
                  Procure a UBS de referência para orientações, consultas
                  de atenção primária, prevenção e acompanhamento.
                </p>
              </article>

              <article className="rounded-2xl border border-[#D1D5DB] bg-white p-6">
                <h3 className="font-[family-name:var(--font-inter)] font-extrabold text-[#005F8F]">
                  Vacinação
                </h3>

                <p className="mt-3 font-[family-name:var(--font-roboto)] text-sm leading-7 text-[#111827]/70">
                  Consulte a unidade de saúde sobre vacinas disponíveis,
                  calendário de vacinação e atualização de registros.
                </p>
              </article>

              <article className="rounded-2xl border border-[#D1D5DB] bg-white p-6">
                <h3 className="font-[family-name:var(--font-inter)] font-extrabold text-[#005F8F]">
                  Atendimento especializado
                </h3>

                <p className="mt-3 font-[family-name:var(--font-roboto)] text-sm leading-7 text-[#111827]/70">
                  Quando necessário, a equipe de saúde orienta sobre os
                  encaminhamentos e os próximos passos do atendimento.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* ENCERRAMENTO */}
        <section className="px-6 py-14 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-7xl rounded-3xl bg-[#005F8F] p-7 text-white sm:p-10 lg:p-12">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <h2 className="font-[family-name:var(--font-inter)] text-2xl font-extrabold sm:text-3xl">
                  Informação também é cuidado.
                </h2>

                <p className="mt-4 font-[family-name:var(--font-roboto)] leading-7 text-white/85">
                  Conhecer seus direitos e saber onde buscar atendimento
                  são passos importantes para cuidar da sua saúde e da
                  sua família.
                </p>
              </div>

              <Link
                href="/agendamentos"
                className="inline-flex w-fit shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 font-[family-name:var(--font-inter)] text-sm font-bold text-[#005F8F] transition hover:bg-[#8ED3F5]"
              >
                Ir para agendamentos
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>

          <div className="mx-auto mt-6 max-w-7xl text-center">
            <a
              href="https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/s/sus"
              target="_blank"
              rel="noreferrer"
              className="font-[family-name:var(--font-inter)] text-sm font-bold text-[#007DB8] hover:text-[#005F8F]"
            >
              Consulte também as informações oficiais do Ministério da Saúde ↗
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}