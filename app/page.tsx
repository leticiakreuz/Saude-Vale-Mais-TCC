import Image from "next/image";
import Header from "../componentes/Header";
import Navigation from "../componentes/Navigation";
import Footer from "../componentes/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-[#111827]">
      <Header />
      <Navigation />

      {/* APRESENTAÇÃO PRINCIPAL */}
      <section
        id="inicio"
        className="relative overflow-hidden bg-white px-6 py-14 sm:py-20 lg:px-8 lg:py-24"
      >
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-10">
          {/* TEXTO DE APRESENTAÇÃO */}
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#8ED3F5]/70 bg-[#F5F7FA] px-4 py-2">
              <span className="h-2 w-2 rounded-full bg-[#22C55E]" />
              <span className="font-[family-name:var(--font-inter)] text-xs font-bold text-[#005F8F] sm:text-sm">
                Saúde pública mais acessível
              </span>
            </div>

            <h1 className="mt-7 font-[family-name:var(--font-inter)] text-4xl font-extrabold leading-[1.12] tracking-tight text-[#111827] sm:text-5xl lg:text-6xl">
              Sua saúde merece
              <span className="block text-[#007DB8]">
                mais praticidade.
              </span>
              <span className="mt-1 block">
                Cuidado mais perto.
              </span>
            </h1>

            <p className="mt-6 max-w-lg font-[family-name:var(--font-roboto)] text-base leading-7 text-[#111827]/65 sm:text-lg sm:leading-8">
              Consulte informações, acompanhe seus serviços e organize seus
              cuidados de saúde em um só lugar com o Saúde Vale+.
            </p>

            {/* BOTÕES PRINCIPAIS */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#servicos"
                className="inline-flex items-center justify-center gap-3 rounded-xl bg-[#007DB8] px-6 py-3.5 font-[family-name:var(--font-inter)] text-sm font-bold text-white shadow-lg shadow-[#007DB8]/15 transition hover:-translate-y-0.5 hover:bg-[#005F8F]"
              >
                Conhecer serviços
                <span aria-hidden="true">→</span>
              </a>

              <a
                href="/cadastro"
                className="inline-flex items-center justify-center rounded-xl border border-[#007DB8] bg-[#007DB8] px-6 py-3.5 font-[family-name:var(--font-inter)] text-sm font-bold text-white transition hover:border-[#005F8F] hover:bg-[#005F8F]"
              >
                Criar minha conta
              </a>
            </div>

            {/* BENEFÍCIOS */}
            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 border-t border-[#D1D5DB] pt-6">
              <span className="inline-flex items-center gap-2 font-[family-name:var(--font-roboto)] text-sm text-[#111827]/70">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#22C55E]/15 text-xs font-bold text-[#16803D]">
                  ✓
                </span>
                Fácil de utilizar
              </span>

              <span className="inline-flex items-center gap-2 font-[family-name:var(--font-roboto)] text-sm text-[#111827]/70">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#22C55E]/15 text-xs font-bold text-[#16803D]">
                  ✓
                </span>
                Informações organizadas
              </span>
            </div>
          </div>

          {/* BANNER SAÚDE VALE+ DESTACADO */}
          <div className="relative mx-auto w-full max-w-2xl lg:scale-105">
            <div className="overflow-hidden rounded-[2rem] border border-[#D1D5DB] bg-white p-2 shadow-2xl shadow-[#005F8F]/15 sm:p-3">
              <Image
                src="/imagens/saude-vale-poster-ajustado.png"
                alt="Banner Saúde Vale+: a saúde ainda mais perto de você"
                width={1248}
                height={1248}
                priority
                sizes="(max-width: 1024px) 100vw, 55vw"
                className="h-auto w-full rounded-[1.5rem] object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      {/* SERVIÇOS */}
      <section
        id="servicos"
        className="bg-white px-6 py-16 sm:py-20 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-10">
            <span className="font-[family-name:var(--font-inter)] text-sm font-bold uppercase tracking-widest text-[#007DB8]">
              Serviços
            </span>

            <h2 className="mt-3 font-[family-name:var(--font-inter)] text-3xl font-bold tracking-tight text-[#111827] sm:text-4xl">
              Tudo em um só lugar
            </h2>

            <p className="mt-3 font-[family-name:var(--font-roboto)] text-base text-[#111827]/65">
              Cuidado e informação para você.
            </p>
          </div>

          {/* CARTÕES INFORMATIVOS */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-8 border-y border-[#D1D5DB] py-8 md:grid-cols-4">
            {/* CONSULTAS */}
            <article className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#8ED3F5]/25 text-[#007DB8]">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 3v18M3 12h18"
                  />
                  <circle cx="12" cy="12" r="9" />
                </svg>
              </div>

              <div>
                <h3 className="font-[family-name:var(--font-inter)] text-sm font-bold text-[#005F8F] sm:text-base">
                  Consultas
                </h3>
                <p className="mt-1 text-sm leading-5 text-[#111827]/60">
                  Informações sobre atendimentos.
                </p>
              </div>
            </article>

            {/* MEDICAMENTOS */}
            <article className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#22C55E]/10 text-[#16803D]">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m9 3 12 12a4 4 0 0 1-6 6L3 9a4 4 0 0 1 6-6Z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m7 7 4-4M5 11l4-4"
                  />
                </svg>
              </div>

              <div>
                <h3 className="font-[family-name:var(--font-inter)] text-sm font-bold text-[#005F8F] sm:text-base">
                  Medicamentos
                </h3>
                <p className="mt-1 text-sm leading-5 text-[#111827]/60">
                  Situação dos medicamentos prescritos.
                </p>
              </div>
            </article>

            {/* VACINAÇÃO */}
            <article className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#8ED3F5]/25 text-[#007DB8]">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <rect x="5" y="3" width="14" height="18" rx="2" />
                  <path d="M9 3v4h6V3m-6 9h6m-6 4h4" />
                </svg>
              </div>

              <div>
                <h3 className="font-[family-name:var(--font-inter)] text-sm font-bold text-[#005F8F] sm:text-base">
                  Vacinação
                </h3>
                <p className="mt-1 text-sm leading-5 text-[#111827]/60">
                  Vacinas que precisam de atenção.
                </p>
              </div>
            </article>

            {/* SOBRE O SUS */}
            <article className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#22C55E]/10 text-[#16803D]">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 21h18M5 21V7l7-4 7 4v14M9 10h.01M15 10h.01M9 14h.01M15 14h.01M10 21v-4h4v4"
                  />
                </svg>
              </div>

              <div>
                <h3 className="font-[family-name:var(--font-inter)] text-sm font-bold text-[#005F8F] sm:text-base">
                  Sobre o SUS
                </h3>
                <p className="mt-1 text-sm leading-5 text-[#111827]/60">
                  Conheça o sistema público de saúde.
                </p>
              </div>
            </article>
          </div>

          {/* TELECONSULTA */}
          <article className="mt-10 grid overflow-hidden rounded-3xl bg-[#F5F7FA] md:grid-cols-2">
            <div className="relative min-h-[260px] sm:min-h-[340px]">
              <Image
                src="/imagens/teleconsulta.png"
                alt="Médica realizando atendimento por meio digital"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            </div>

            <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-14">
              <span className="font-[family-name:var(--font-inter)] text-xs font-bold uppercase tracking-widest text-[#007DB8]">
                Cuidado digital
              </span>

              <h3 className="mt-3 font-[family-name:var(--font-inter)] text-2xl font-bold tracking-tight text-[#005F8F] sm:text-3xl">
                Teleconsulta
              </h3>

              <p className="mt-4 max-w-md font-[family-name:var(--font-roboto)] leading-7 text-[#111827]/65">
                Mais praticidade para receber orientações de saúde por
                videochamada, conforme a disponibilidade do serviço.
              </p>

              <div className="mt-6 h-1 w-12 rounded-full bg-[#22C55E]" />
            </div>
          </article>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section
        id="como-funciona"
        className="bg-white px-6 py-16 sm:py-20 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <span className="font-[family-name:var(--font-inter)] text-sm font-bold uppercase tracking-[0.18em] text-[#007DB8]">
                Como funciona
              </span>

              <h2 className="mt-3 font-[family-name:var(--font-inter)] text-3xl font-extrabold leading-tight tracking-tight text-[#111827] sm:text-4xl">
                Cuidar da sua saúde pode ser
                <span className="text-[#007DB8]"> mais simples.</span>
              </h2>

              <p className="mt-4 max-w-xl font-[family-name:var(--font-roboto)] leading-7 text-[#111827]/65">
                Seus principais serviços de saúde reunidos em uma experiência
                simples, acessível e organizada.
              </p>
            </div>

            <a
              href="/cadastro"
              className="inline-flex w-fit items-center justify-center gap-2 rounded-xl bg-[#007DB8] px-5 py-3 font-[family-name:var(--font-inter)] text-sm font-bold text-white transition hover:bg-[#005F8F]"
            >
              Começar agora <span aria-hidden="true">→</span>
            </a>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {/* ETAPA 1 */}
            <article className="group relative overflow-hidden rounded-3xl border border-[#D1D5DB] bg-[#F5F7FA] p-7 transition duration-300 hover:-translate-y-1 hover:border-[#8ED3F5] hover:shadow-lg sm:p-8">
              <div className="flex items-start justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#007DB8] shadow-sm">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-7 w-7"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="8" r="4" />
                    <path d="M5 21v-2a7 7 0 0 1 14 0v2" />
                  </svg>
                </div>
                <span className="font-[family-name:var(--font-inter)] text-4xl font-extrabold text-[#007DB8]/20">
                  01
                </span>
              </div>

              <h3 className="mt-7 font-[family-name:var(--font-inter)] text-xl font-extrabold text-[#005F8F]">
                Crie sua conta
              </h3>

              <p className="mt-3 font-[family-name:var(--font-roboto)] text-sm leading-6 text-[#111827]/65">
                Cadastre seus dados para acessar sua área pessoal do Saúde Vale+.
              </p>

              <div className="mt-7 h-1 w-12 rounded-full bg-[#22C55E] transition-all duration-300 group-hover:w-20" />
            </article>

            {/* ETAPA 2 */}
            <article className="group relative overflow-hidden rounded-3xl border border-[#D1D5DB] bg-white p-7 transition duration-300 hover:-translate-y-1 hover:border-[#8ED3F5] hover:shadow-lg sm:p-8">
              <div className="flex items-start justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#8ED3F5]/30 text-[#007DB8]">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-7 w-7"
                    aria-hidden="true"
                  >
                    <rect x="3" y="5" width="18" height="16" rx="3" />
                    <path d="M16 3v4M8 3v4M3 10h18" />
                    <path d="m8 15 2.5 2.5L16 12" />
                  </svg>
                </div>

                <span className="font-[family-name:var(--font-inter)] text-4xl font-extrabold text-[#007DB8]/20">
                  02
                </span>
              </div>

              <h3 className="mt-7 font-[family-name:var(--font-inter)] text-xl font-extrabold text-[#005F8F]">
                Escolha um serviço
              </h3>

              <p className="mt-3 font-[family-name:var(--font-roboto)] text-sm leading-6 text-[#111827]/65">
                Acesse os agendamentos, consulte medicamentos e acompanhe a vacinação.
              </p>

              <div className="mt-7 h-1 w-12 rounded-full bg-[#007DB8] transition-all duration-300 group-hover:w-20" />
            </article>

            {/* ETAPA 3 */}
            <article className="group relative overflow-hidden rounded-3xl border border-[#D1D5DB] bg-[#F5F7FA] p-7 transition duration-300 hover:-translate-y-1 hover:border-[#8ED3F5] hover:shadow-lg sm:p-8">
              <div className="flex items-start justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#007DB8] shadow-sm">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-7 w-7"
                    aria-hidden="true"
                  >
                    <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                </div>

                <span className="font-[family-name:var(--font-inter)] text-4xl font-extrabold text-[#007DB8]/20">
                  03
                </span>
              </div>

              <h3 className="mt-7 font-[family-name:var(--font-inter)] text-xl font-extrabold text-[#005F8F]">
                Acompanhe seus dados
              </h3>

              <p className="mt-3 font-[family-name:var(--font-roboto)] text-sm leading-6 text-[#111827]/65">
                Consulte as informações disponíveis na sua conta com praticidade.
              </p>

              <div className="mt-7 h-1 w-12 rounded-full bg-[#22C55E] transition-all duration-300 group-hover:w-20" />
            </article>
          </div>
        </div>
      </section>

      {/* SOBRE O PROJETO */}
      <section
        id="sobre"
        className="bg-[#F5F7FA] px-6 py-16 sm:py-20 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 max-w-2xl">
            <span className="font-[family-name:var(--font-inter)] text-sm font-bold uppercase tracking-[0.18em] text-[#007DB8]">
              Saúde Vale+
            </span>

            <h2 className="mt-3 font-[family-name:var(--font-inter)] text-3xl font-extrabold leading-tight tracking-tight text-[#111827] sm:text-4xl">
              Cuidado que aproxima.
              <span className="block text-[#007DB8]">
                Saúde mais perto de você.
              </span>
            </h2>

            <p className="mt-4 font-[family-name:var(--font-roboto)] leading-7 text-[#111827]/65">
              Pessoas, saúde e comunidade em um só lugar.
            </p>
          </div>

          {/* GALERIA DE IMAGENS */}
          <div className="grid gap-5 md:grid-cols-3">
            {/* EQUIPE DE SAÚDE */}
            <article className="group relative min-h-[280px] overflow-hidden rounded-3xl bg-[#D1D5DB] shadow-sm">
              <Image
                src="/imagens/equipe-saude.png"
                alt="Equipe de profissionais da saúde"
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover transition duration-500 group-hover:scale-105"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-[#111827]/85 via-[#111827]/15 to-transparent" />

              <div className="absolute inset-x-0 bottom-0 p-6">
                <h3 className="font-[family-name:var(--font-inter)] text-xl font-extrabold text-white">
                  Quem cuida de você
                </h3>
                <p className="mt-2 font-[family-name:var(--font-roboto)] text-sm text-white/85">
                  Profissionais ao seu lado.
                </p>
              </div>
            </article>

            {/* SAÚDE BUCAL */}
            <article className="group relative min-h-[280px] overflow-hidden rounded-3xl bg-[#D1D5DB] shadow-sm">
              <Image
                src="/imagens/saude-bucal.png"
                alt="Profissional realizando atendimento odontológico infantil"
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover transition duration-500 group-hover:scale-105"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-[#111827]/85 via-[#111827]/10 to-transparent" />

              <div className="absolute inset-x-0 bottom-0 p-6">
                <h3 className="font-[family-name:var(--font-inter)] text-xl font-extrabold text-white">
                  Saúde bucal
                </h3>
                <p className="mt-2 font-[family-name:var(--font-roboto)] text-sm text-white/85">
                  Cuidado que começa com prevenção.
                </p>
              </div>
            </article>

            {/* CUIDADO EM TODAS AS IDADES */}
            <article className="group relative min-h-[280px] overflow-hidden rounded-3xl bg-[#D1D5DB] shadow-sm">
              <Image
                src="/imagens/cuidado-em-todas-as-idades.png"
                alt="Profissional de saúde atendendo uma pessoa idosa"
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover transition duration-500 group-hover:scale-105"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-[#111827]/85 via-[#111827]/10 to-transparent" />

              <div className="absolute inset-x-0 bottom-0 p-6">
                <h3 className="font-[family-name:var(--font-inter)] text-xl font-extrabold text-white">
                  Cuidado em todas as idades
                </h3>
                <p className="mt-2 font-[family-name:var(--font-roboto)] text-sm text-white/85">
                  Atenção humana em cada fase da vida.
                </p>
              </div>
            </article>
          </div>

          {/* BLUMENAU ALÉM DO TEMPO */}
          <article className="group relative mt-6 min-h-[340px] overflow-hidden rounded-3xl bg-[#005F8F] shadow-sm sm:min-h-[400px]">
            <Image
              src="/imagens/blumenau-alem-do-tempo.png"
              alt="Arquitetura tradicional e paisagem urbana de Blumenau"
              fill
              sizes="(max-width: 768px) 100vw, 1200px"
              className="object-cover transition duration-700 group-hover:scale-[1.02]"
            />

            <div className="absolute inset-0 bg-gradient-to-r from-[#062C3D]/85 via-[#062C3D]/45 to-transparent" />

            <div className="relative z-10 flex min-h-[340px] max-w-2xl flex-col justify-end p-7 sm:min-h-[400px] sm:p-12">
              <span className="font-[family-name:var(--font-inter)] text-sm font-bold uppercase tracking-[0.18em] text-[#8ED3F5]">
                Nossa cidade
              </span>

              <h2 className="mt-3 font-[family-name:var(--font-inter)] text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
                Blumenau além do tempo
              </h2>

              <p className="mt-4 max-w-lg font-[family-name:var(--font-roboto)] text-base leading-7 text-white/90 sm:text-lg">
                Tradição, comunidade e cuidado que atravessam gerações.
              </p>

              <div className="mt-6 h-1 w-16 rounded-full bg-[#22C55E]" />
            </div>
          </article>
        </div>
      </section>

      {/* CHAMADA FINAL */}
      <section className="bg-white px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-[2rem] bg-[#005F8F] px-8 py-12 sm:px-12 lg:px-14">
          <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
            <div className="max-w-2xl">
              <h2 className="font-[family-name:var(--font-inter)] text-3xl font-extrabold text-white">
                Saúde mais acessível para você.
              </h2>

              <p className="mt-3 font-[family-name:var(--font-roboto)] leading-7 text-white/75">
                Crie sua conta e conheça o Saúde Vale+.
              </p>
            </div>

            <a
              href="/cadastro"
              className="rounded-xl bg-[#22C55E] px-6 py-3.5 font-[family-name:var(--font-inter)] font-bold text-[#111827] transition hover:bg-white"
            >
              Criar minha conta
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}