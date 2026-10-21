
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
} from "firebase/firestore";
import { useRouter } from "next/navigation";

import Header from "../../componentes/Header";
import Navigation from "../../componentes/Navigation";
import Footer from "../../componentes/Footer";
import { auth, db } from "../firebase";

type IconName =
  | "calendar"
  | "pill"
  | "syringe"
  | "hospital"
  | "user"
  | "arrow"
  | "clock"
  | "shield"
  | "plus";

type AgendamentoResumo = {
  id: string;
  servico: string;
  medico: string;
  dia: string;
  horario: string;
  status: string;
};

const servicos = [
  {
    titulo: "Agendamentos",
    descricao: "Marque seus atendimentos e acompanhe suas consultas.",
    href: "/agendamentos",
    icone: "calendar" as IconName,
    fundo: "bg-[#E5F5FC]",
    cor: "text-[#007DB8]",
    etiqueta: "Consultas",
  },
  {
    titulo: "Medicamentos",
    descricao: "Consulte a disponibilidade dos medicamentos prescritos.",
    href: "/medicamentos",
    icone: "pill" as IconName,
    fundo: "bg-[#E8F8EE]",
    cor: "text-[#168447]",
    etiqueta: "Prescrições",
  },
  {
    titulo: "Vacinação",
    descricao: "Acesse sua carteira e acompanhe seus registros.",
    href: "/vacinacao",
    icone: "syringe" as IconName,
    fundo: "bg-[#EAF0FF]",
    cor: "text-[#4168B5]",
    etiqueta: "Carteira de vacinação",
  },
  {
    titulo: "Sobre o SUS",
    descricao: "Conheça os serviços e as informações do sistema público.",
    href: "/sobre-sus",
    icone: "hospital" as IconName,
    fundo: "bg-[#F0EAFE]",
    cor: "text-[#7251A8]",
    etiqueta: "Informações",
  },
];

function Icon({
  name,
  className = "",
}: {
  name: IconName;
  className?: string;
}) {
  const propriedades = {
    width: 24,
    height: 24,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": true as const,
  };

  switch (name) {
    case "calendar":
      return (
        <svg {...propriedades}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M16 3v4M8 3v4M3 10h18" />
          <path d="m9 15 2 2 4-4" />
        </svg>
      );

    case "pill":
      return (
        <svg {...propriedades}>
          <path d="M10.5 20.5a5 5 0 0 1-7-7l7-7a5 5 0 0 1 7 7l-7 7Z" />
          <path d="m8 8 8 8" />
        </svg>
      );

    case "syringe":
      return (
        <svg {...propriedades}>
          <path d="m18 2 4 4M17 7l-3-3M3 21l6-6" />
          <path d="m14 4 6 6M5 13l6 6M4 14l6-6 6 6-6 6-6-6Z" />
          <path d="m2 22 3-3" />
        </svg>
      );

    case "hospital":
      return (
        <svg {...propriedades}>
          <path d="M3 21V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v16" />
          <path d="M9 21v-5h6v5M9 8h6M12 5v6" />
          <path d="M3 21h18" />
        </svg>
      );

    case "user":
      return (
        <svg {...propriedades}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21v-2a8 8 0 0 1 16 0v2" />
        </svg>
      );

    case "arrow":
      return (
        <svg {...propriedades}>
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      );

    case "clock":
      return (
        <svg {...propriedades}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );

    case "shield":
      return (
        <svg {...propriedades}>
          <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );

    case "plus":
      return (
        <svg {...propriedades}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
  }
}

function obterDataLocal() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function formatarData(dataString: string) {
  const [ano, mes, dia] = dataString.split("-").map(Number);
  const data = new Date(ano, mes - 1, dia);

  return data.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).replace(/\.$/, "");
}

export default function DashboardPage() {
  const router = useRouter();

  const [nomeUsuario, setNomeUsuario] = useState("Usuário");
  const [carregando, setCarregando] = useState(true);
  const [agendamentos, setAgendamentos] = useState<AgendamentoResumo[]>([]);
  const [carregandoAgendamentos, setCarregandoAgendamentos] =
    useState(true);
  const [erroAgendamentos, setErroAgendamentos] = useState(false);

  useEffect(() => {
    let ativo = true;
    let cancelarAgendamentos: (() => void) | undefined;

    const cancelarAuth = onAuthStateChanged(auth, (user) => {
      cancelarAgendamentos?.();
      cancelarAgendamentos = undefined;

      if (!user) {
        router.replace("/login");
        return;
      }

      setCarregando(true);
      setCarregandoAgendamentos(true);
      setErroAgendamentos(false);

      const nomePadrao =
        user.displayName ||
        user.email?.split("@")[0] ||
        "Usuário";

      setNomeUsuario(nomePadrao);

      const buscarPerfil = async () => {
        try {
          const referencia = doc(db, "usuarios", user.uid);
          const resultado = await getDoc(referencia);

          if (!ativo) return;

          if (resultado.exists()) {
            const dados = resultado.data();

            if (
              typeof dados.nome === "string" &&
              dados.nome.trim()
            ) {
              setNomeUsuario(dados.nome.trim());
            }
          }
        } catch (error) {
          console.error("Erro ao carregar o perfil:", error);
        } finally {
          if (ativo) setCarregando(false);
        }
      };

      void buscarPerfil();

      const referenciaAgendamentos = collection(
        db,
        "usuarios",
        user.uid,
        "agendamentos"
      );

      cancelarAgendamentos = onSnapshot(
        referenciaAgendamentos,
        (resultado) => {
          if (!ativo) return;

          const hoje = obterDataLocal();

          const lista = resultado.docs
            .map((item) => {
              const dados = item.data();

              return {
                id: item.id,
                servico:
                  typeof dados.servico === "string"
                    ? dados.servico
                    : "Atendimento",
                medico:
                  typeof dados.medico === "string"
                    ? dados.medico
                    : "Profissional não informado",
                dia:
                  typeof dados.dia === "string"
                    ? dados.dia
                    : "",
                horario:
                  typeof dados.horario === "string"
                    ? dados.horario
                    : "",
                status:
                  typeof dados.status === "string"
                    ? dados.status
                    : "agendado",
              };
            })
            .filter(
              (item) =>
                item.dia >= hoje &&
                item.dia.length > 0 &&
                item.status.toLowerCase() !== "cancelado"
            )
            .sort((a, b) => {
              const dataA = `${a.dia} ${a.horario}`;
              const dataB = `${b.dia} ${b.horario}`;
              return dataA.localeCompare(dataB);
            });

          setAgendamentos(lista);
          setCarregandoAgendamentos(false);
        },
        (error) => {
          console.error("Erro ao carregar agendamentos:", error);

          if (!ativo) return;

          setAgendamentos([]);
          setErroAgendamentos(true);
          setCarregandoAgendamentos(false);
        }
      );
    });

    return () => {
      ativo = false;
      cancelarAuth();
      cancelarAgendamentos?.();
    };
  }, [router]);

  const primeiroNome = nomeUsuario.trim().split(/\s+/)[0] || "Usuário";

  const iniciais = nomeUsuario
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join("")
    .toUpperCase();

  const proximosAgendamentos = agendamentos.slice(0, 3);

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <Header />
      <Navigation />

      <main className="mx-auto max-w-7xl px-4 pb-12 pt-7 sm:px-6 sm:pt-9 lg:px-8 lg:pb-16">
        {/* BOAS-VINDAS */}
        <section className="relative overflow-hidden rounded-[28px] bg-[#005F8F] shadow-sm">
          <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-[#007DB8]/70" />
          <div className="pointer-events-none absolute -bottom-32 right-40 h-64 w-64 rounded-full border-[36px] border-white/5" />

          <div className="relative grid items-center gap-8 p-6 sm:p-9 lg:grid-cols-[1fr_auto] lg:p-11">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5">
                <span className="h-2 w-2 rounded-full bg-[#22C55E]" />
                <span className="font-[family-name:var(--font-inter)] text-xs font-semibold text-white/90">
                  SUA ÁREA DO PACIENTE
                </span>
              </div>

              <p className="mt-6 font-[family-name:var(--font-roboto)] text-sm text-white/75">
                Que bom ter você por aqui!
              </p>

              <h1 className="mt-2 font-[family-name:var(--font-inter)] text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
                Olá, {carregando ? "..." : primeiroNome}!
              </h1>

              <p className="mt-4 max-w-xl font-[family-name:var(--font-roboto)] text-sm leading-6 text-white/80 sm:text-base sm:leading-7">
                Sua saúde merece atenção. Acesse seus serviços, acompanhe
                seus atendimentos e encontre as principais informações
                em um só lugar.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/agendamentos"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-[family-name:var(--font-inter)] text-sm font-bold text-[#005F8F] shadow-sm transition hover:bg-[#EAF7FC]"
                >
                  <Icon name="calendar" className="h-5 w-5" />
                  Agendar atendimento
                </Link>

                <Link
                  href="/perfil"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-5 py-3 font-[family-name:var(--font-inter)] text-sm font-bold text-white transition hover:bg-white/10"
                >
                  <Icon name="user" className="h-5 w-5" />
                  Meu perfil
                </Link>
              </div>
            </div>

            <div className="hidden min-w-[230px] lg:block">
              <div className="rounded-3xl border border-white/20 bg-white/10 p-6 backdrop-blur-sm">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#007DB8]">
                  <Icon name="plus" className="h-9 w-9" />
                </div>

                <p className="mt-5 font-[family-name:var(--font-inter)] text-xl font-extrabold text-white">
                  Saúde Vale+
                </p>

                <p className="mt-2 font-[family-name:var(--font-roboto)] text-sm leading-6 text-white/75">
                  Saúde pública mais acessível, organizada e perto de você.
                </p>

                <div className="mt-5 flex items-center gap-2 text-white/90">
                  <Icon name="shield" className="h-4 w-4" />
                  <span className="font-[family-name:var(--font-inter)] text-xs font-medium">
                    Sua área de saúde
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SERVIÇOS */}
        <section className="mt-10 sm:mt-12">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="font-[family-name:var(--font-inter)] text-xs font-bold uppercase tracking-[0.16em] text-[#007DB8]">
                Acesso rápido
              </p>

              <h2 className="mt-2 font-[family-name:var(--font-inter)] text-2xl font-extrabold tracking-tight text-[#111827] sm:text-3xl">
                Como podemos ajudar?
              </h2>

              <p className="mt-2 font-[family-name:var(--font-roboto)] text-sm leading-6 text-[#111827]/60">
                Escolha um serviço para continuar.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {servicos.map((servico) => (
              <Link
                key={servico.titulo}
                href={servico.href}
                className="group flex min-h-[245px] flex-col rounded-3xl border border-[#E1E6EB] bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-[#8ED3F5] hover:shadow-lg sm:p-6"
              >
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl ${servico.fundo} ${servico.cor}`}
                  >
                    <Icon name={servico.icone} className="h-6 w-6" />
                  </div>

                  <span className="rounded-full bg-[#F5F7FA] px-2.5 py-1 font-[family-name:var(--font-inter)] text-[10px] font-semibold text-[#111827]/55">
                    {servico.etiqueta}
                  </span>
                </div>

                <h3 className="mt-5 font-[family-name:var(--font-inter)] text-lg font-extrabold text-[#005F8F]">
                  {servico.titulo}
                </h3>

                <p className="mt-2 flex-1 font-[family-name:var(--font-roboto)] text-sm leading-6 text-[#111827]/60">
                  {servico.descricao}
                </p>

                <div className="mt-5 flex items-center justify-between border-t border-[#EEF1F4] pt-4">
                  <span className="font-[family-name:var(--font-inter)] text-sm font-bold text-[#007DB8]">
                    Acessar serviço
                  </span>

                  <span className="flex h-8 w-8 items-center justify-center rounded-full text-[#007DB8] transition group-hover:bg-[#E5F5FC]">
                    <Icon name="arrow" className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* PRÓXIMOS AGENDAMENTOS E PERFIL */}
        <section className="mt-10 grid items-start gap-6 lg:mt-12 lg:grid-cols-[1.4fr_0.8fr]">
          <div className="rounded-3xl border border-[#E1E6EB] bg-white p-5 shadow-sm sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-[family-name:var(--font-inter)] text-xs font-bold uppercase tracking-[0.14em] text-[#007DB8]">
                  Organização
                </p>

                <h2 className="mt-2 font-[family-name:var(--font-inter)] text-xl font-extrabold text-[#111827] sm:text-2xl">
                  Próximos agendamentos
                </h2>

                <p className="mt-2 font-[family-name:var(--font-roboto)] text-sm text-[#111827]/60">
                  Acompanhe os seus próximos atendimentos.
                </p>
              </div>

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#E5F5FC] text-[#007DB8]">
                <Icon name="clock" className="h-5 w-5" />
              </div>
            </div>

            {carregandoAgendamentos ? (
              <div className="mt-6 space-y-3" aria-label="Carregando agendamentos">
                <div className="h-20 animate-pulse rounded-2xl bg-[#F5F7FA]" />
                <div className="h-20 animate-pulse rounded-2xl bg-[#F5F7FA]" />
              </div>
            ) : erroAgendamentos ? (
              <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="font-[family-name:var(--font-roboto)] text-sm leading-6 text-amber-900">
                  Não foi possível carregar seus agendamentos agora.
                  Acesse a página de agendamentos para tentar novamente.
                </p>

                <Link
                  href="/agendamentos"
                  className="mt-3 inline-flex items-center gap-2 font-[family-name:var(--font-inter)] text-sm font-bold text-[#005F8F]"
                >
                  Ver agendamentos
                  <Icon name="arrow" className="h-4 w-4" />
                </Link>
              </div>
            ) : proximosAgendamentos.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-[#D1D5DB] bg-[#F9FBFC] px-5 py-8 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E5F5FC] text-[#007DB8]">
                  <Icon name="calendar" className="h-6 w-6" />
                </div>

                <h3 className="mt-4 font-[family-name:var(--font-inter)] text-base font-bold text-[#111827]">
                  Nenhuma consulta futura
                </h3>

                <p className="mx-auto mt-2 max-w-sm font-[family-name:var(--font-roboto)] text-sm leading-6 text-[#111827]/60">
                  Quando você tiver um atendimento marcado, ele aparecerá
                  aqui.
                </p>

                <Link
                  href="/agendamentos"
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#007DB8] px-4 py-3 font-[family-name:var(--font-inter)] text-sm font-bold text-white transition hover:bg-[#005F8F]"
                >
                  Agendar consulta
                  <Icon name="arrow" className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                {proximosAgendamentos.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-3 rounded-2xl border border-[#E8EDF1] p-4 transition hover:border-[#8ED3F5] sm:flex-row sm:items-center"
                  >
                    <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-[#E5F5FC] text-[#005F8F]">
                      <span className="font-[family-name:var(--font-inter)] text-lg font-extrabold leading-none">
                        {item.dia.split("-")[2]}
                      </span>
                      <span className="mt-1 font-[family-name:var(--font-inter)] text-[10px] font-bold uppercase">
                        {new Date(
                          Number(item.dia.split("-")[0]),
                          Number(item.dia.split("-")[1]) - 1,
                          Number(item.dia.split("-")[2])
                        ).toLocaleDateString("pt-BR", {
                          month: "short",
                        }).replace(".", "")}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-[family-name:var(--font-inter)] text-sm font-extrabold text-[#111827]">
                        {item.servico}
                      </p>

                      <p className="mt-1 truncate font-[family-name:var(--font-roboto)] text-xs text-[#111827]/60">
                        {item.medico}
                      </p>

                      <p className="mt-1 font-[family-name:var(--font-roboto)] text-xs text-[#111827]/60">
                        {formatarData(item.dia)}
                        {item.horario ? ` · ${item.horario}` : ""}
                      </p>
                    </div>

                    <span className="w-fit rounded-full bg-[#E8F8EE] px-3 py-1 font-[family-name:var(--font-inter)] text-[11px] font-bold text-[#168447]">
                      Agendado
                    </span>
                  </div>
                ))}

                <Link
                  href="/agendamentos"
                  className="inline-flex items-center gap-2 pt-2 font-[family-name:var(--font-inter)] text-sm font-bold text-[#007DB8] transition hover:text-[#005F8F]"
                >
                  Ver todos os agendamentos
                  <Icon name="arrow" className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>

          <div className="space-y-5">
            {/* PERFIL */}
            <div className="rounded-3xl border border-[#E1E6EB] bg-white p-6 shadow-sm sm:p-7">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#E5F5FC] font-[family-name:var(--font-inter)] text-lg font-extrabold text-[#005F8F]">
                  {carregando ? "..." : iniciais}
                </div>

                <div className="min-w-0">
                  <p className="font-[family-name:var(--font-inter)] text-xs font-semibold uppercase tracking-wide text-[#007DB8]">
                    Minha conta
                  </p>

                  <h2 className="mt-1 truncate font-[family-name:var(--font-inter)] text-lg font-extrabold text-[#111827]">
                    {carregando ? "Carregando..." : nomeUsuario}
                  </h2>

                  <p className="mt-1 font-[family-name:var(--font-roboto)] text-xs text-[#111827]/55">
                    Área do paciente
                  </p>
                </div>
              </div>

              <div className="my-5 border-t border-[#EEF1F4]" />

              <p className="font-[family-name:var(--font-roboto)] text-sm leading-6 text-[#111827]/65">
                Mantenha suas informações pessoais atualizadas para facilitar
                o acesso aos serviços.
              </p>

              <Link
                href="/perfil"
                className="mt-5 flex w-full items-center justify-between rounded-xl border border-[#D1D5DB] px-4 py-3 font-[family-name:var(--font-inter)] text-sm font-bold text-[#005F8F] transition hover:border-[#007DB8] hover:bg-[#F5FAFD]"
              >
                Acessar meu perfil
                <Icon name="arrow" className="h-4 w-4" />
              </Link>
            </div>

            {/* INFORMAÇÃO */}
            <div className="overflow-hidden rounded-3xl bg-[#E5F5FC] p-6 sm:p-7">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#007DB8]">
                <Icon name="hospital" className="h-6 w-6" />
              </div>

              <h2 className="mt-4 font-[family-name:var(--font-inter)] text-lg font-extrabold text-[#005F8F]">
                Conheça seus direitos
              </h2>

              <p className="mt-2 font-[family-name:var(--font-roboto)] text-sm leading-6 text-[#005F8F]/80">
                Consulte informações sobre o SUS e conheça os serviços
                oferecidos pelo sistema público de saúde.
              </p>

              <Link
                href="/sobre-sus"
                className="mt-5 inline-flex items-center gap-2 font-[family-name:var(--font-inter)] text-sm font-extrabold text-[#005F8F] transition hover:text-[#007DB8]"
              >
                Saiba mais
                <Icon name="arrow" className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* RODAPÉ DA ÁREA PRINCIPAL */}
        <div className="mt-9 flex flex-col gap-2 border-t border-[#D1D5DB] pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-[family-name:var(--font-roboto)] text-xs text-[#111827]/50">
            Saúde Vale+ · Saúde mais perto de você.
          </p>

          <p className="font-[family-name:var(--font-roboto)] text-xs text-[#111827]/50">
            Em caso de emergência, procure um serviço de urgência.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}