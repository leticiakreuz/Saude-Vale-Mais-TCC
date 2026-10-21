"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import Header from "../../componentes/Header";
import Navigation from "../../componentes/Navigation";
import Footer from "../../componentes/Footer";
import { auth, db } from "../firebase";

type Periodo = "Manhã" | "Tarde";
type Etapa = "carregando" | "perfil" | "agendar" | "consultas";

type Perfil = {
  nome?: string;
  email?: string;
  cpf?: string;
  telefone?: string;
  dataNascimento?: string;
  cartaoSus?: string;
  cep?: string;
  rua?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  unidadeReferencia?: string;
};

type Agendamento = {
  id: string;
  userId?: string;
  servico: string;
  periodo: Periodo;
  medico: string;
  profissao?: string;
  dia: string;
  horario: string;
  status: string;
};

const servicosPorPeriodo: Record<Periodo, string[]> = {
  Manhã: [
    "Consulta médica",
    "Pediatria",
    "Odontologia",
    "Consulta de retorno",
    "Renovação de receita",
  ],
  Tarde: ["Odontologia", "Renovação de receita"],
};

const profissionaisPorProfissao: Record<string, string[]> = {
  "Clínico geral": ["Dr. Rafael Martins", "Dra. Juliana Costa"],
  Pediatra: ["Dra. Mariana Alves", "Dr. Felipe Rocha"],
  Dentista: ["Dra. Camila Souza", "Dr. Bruno Lima"],
};

const profissoesPorPeriodo: Record<Periodo, string[]> = {
  Manhã: ["Clínico geral", "Pediatra", "Dentista"],
  Tarde: ["Dentista"],
};

const horariosPorPeriodo: Record<Periodo, string[]> = {
  Manhã: ["07:30", "08:30", "10:30", "11:30"],
  Tarde: ["13:30", "14:30", "16:00"],
};

function gerarDias(): string[] {
  const dias: string[] = [];
  const hoje = new Date();

  for (let i = 0; i < 21; i++) {
    const data = new Date(
      hoje.getFullYear(),
      hoje.getMonth(),
      hoje.getDate() + i
    );

    if (data.getDay() === 0 || data.getDay() === 6) continue;

    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const dia = String(data.getDate()).padStart(2, "0");
    dias.push(`${ano}-${mes}-${dia}`);
  }

  return dias;
}

function formatarData(dataString: string): string {
  if (!dataString) return "";
  const [ano, mes, dia] = dataString.split("-").map(Number);

  return new Date(ano, mes - 1, dia).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatarDiaCurto(dataString: string): { semana: string; data: string } {
  const [ano, mes, dia] = dataString.split("-").map(Number);
  const data = new Date(ano, mes - 1, dia);

  return {
    semana: data.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", ""),
    data: `${String(dia).padStart(2, "0")}/${String(mes).padStart(2, "0")}`,
  };
}

const camposObrigatoriosPerfil: (keyof Perfil)[] = [
  "nome",
  "cpf",
  "telefone",
  "dataNascimento",
  "cartaoSus",
  "cep",
  "rua",
  "numero",
  "bairro",
  "cidade",
];

function perfilEstaCompleto(perfil: Perfil): boolean {
  const todosPreenchidos = camposObrigatoriosPerfil.every((campo) =>
    String(perfil[campo] ?? "").trim().length > 0
  );
  const cepValido = String(perfil.cep ?? "").replace(/\D/g, "").length === 8;
  return todosPreenchidos && cepValido;
}

function profissaoDoServico(servico: string): string {
  if (servico === "Pediatria") return "Pediatra";
  if (servico === "Odontologia") return "Dentista";
  return "Clínico geral";
}

export default function AgendamentosPage() {
  const router = useRouter();

  const [usuario, setUsuario] = useState<User | null>(null);
  const [perfil, setPerfil] = useState<Perfil>({});
  const [etapa, setEtapa] = useState<Etapa>("carregando");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  const [servico, setServico] = useState("Consulta médica");
  const [periodo, setPeriodo] = useState<Periodo>("Manhã");
  const [profissao, setProfissao] = useState("Clínico geral");
  const [medico, setMedico] = useState("");
  const [diaSelecionado, setDiaSelecionado] = useState("");
  const [horarioSelecionado, setHorarioSelecionado] = useState("");

  const dias = useMemo(() => gerarDias(), []);
  const servicosDisponiveis = servicosPorPeriodo[periodo];
  const horariosDisponiveis = horariosPorPeriodo[periodo];
  const profissoesDisponiveis = profissoesPorPeriodo[periodo];
  const profissionaisDisponiveis = profissionaisPorProfissao[profissao] ?? [];

  useEffect(() => {
    let ativo = true;
    let cancelarAgendamentos: (() => void) | undefined;

    const cancelarAuth = onAuthStateChanged(auth, async (user) => {
      cancelarAgendamentos?.();
      cancelarAgendamentos = undefined;

      if (!user) {
        if (!ativo) return;
        setUsuario(null);
        setAgendamentos([]);
        setCarregando(false);
        router.replace("/entrar");
        return;
      }

      if (!ativo) return;
      setCarregando(true);
      setErro("");

      try {
        const resultadoPerfil = await getDoc(doc(db, "usuarios", user.uid));
        if (!ativo) return;

        const dadosPerfil: Perfil = resultadoPerfil.exists()
          ? (resultadoPerfil.data() as Perfil)
          : {};

        const perfilCarregado: Perfil = {
          ...dadosPerfil,
          email: user.email ?? dadosPerfil.email ?? "",
          nome: dadosPerfil.nome ?? user.displayName ?? "",
        };

        setUsuario(user);
        setPerfil(perfilCarregado);
        setEtapa(perfilEstaCompleto(perfilCarregado) ? "agendar" : "perfil");

        cancelarAgendamentos = onSnapshot(
          collection(db, "usuarios", user.uid, "agendamentos"),
          (resultado) => {
            if (!ativo) return;
            setAgendamentos(
              resultado.docs.map((item) => ({
                id: item.id,
                ...(item.data() as Omit<Agendamento, "id">),
              }))
            );
            setCarregando(false);
          },
          (erroFirebase) => {
            console.error("Erro ao carregar agendamentos:", erroFirebase);
            if (!ativo) return;
            setErro("Não foi possível carregar seus agendamentos. Verifique as permissões do Firestore.");
            setCarregando(false);
          }
        );
      } catch (erroFirebase) {
        console.error("Erro ao carregar perfil:", erroFirebase);
        if (!ativo) return;
        setErro("Não foi possível carregar seus dados.");
        setCarregando(false);
      }
    });

    return () => {
      ativo = false;
      cancelarAuth();
      cancelarAgendamentos?.();
    };
  }, [router]);

  const atualizarPerfil = (campo: keyof Perfil, valor: string) => {
    setPerfil((anterior) => ({ ...anterior, [campo]: valor }));
  };

  const salvarPerfil = async () => {
    setErro("");
    setMensagem("");

    if (!usuario) {
      router.replace("/entrar");
      return;
    }

    const faltando = camposObrigatoriosPerfil.some(
      (campo) => !String(perfil[campo] ?? "").trim()
    );

    if (faltando) {
      setErro("Preencha todos os campos obrigatórios do perfil.");
      return;
    }

    if (String(perfil.cep ?? "").replace(/\D/g, "").length !== 8) {
      setErro("Informe um CEP válido com oito números.");
      return;
    }

    try {
      setSalvando(true);
      await setDoc(
        doc(db, "usuarios", usuario.uid),
        {
          ...perfil,
          uid: usuario.uid,
          email: usuario.email ?? "",
          perfilAtualizadoEm: serverTimestamp(),
        },
        { merge: true }
      );
      setMensagem("Seus dados foram salvos.");
      setEtapa("agendar");
    } catch (erroFirebase) {
      console.error("Erro ao salvar perfil:", erroFirebase);
      setErro("Não foi possível salvar seus dados. Verifique as regras do Firestore.");
    } finally {
      setSalvando(false);
    }
  };

  const selecionarPeriodo = (novoPeriodo: Periodo) => {
    const servicos = servicosPorPeriodo[novoPeriodo];
    const servicoInicial = servicos[0];
    const profissaoInicial = profissaoDoServico(servicoInicial);
    const profissoes = profissoesPorPeriodo[novoPeriodo];

    setPeriodo(novoPeriodo);
    setServico(servicoInicial);
    setProfissao(
      profissoes.includes(profissaoInicial) ? profissaoInicial : profissoes[0]
    );
    setMedico("");
    setDiaSelecionado("");
    setHorarioSelecionado("");
    setMensagem("");
    setErro("");
  };

  const selecionarServico = (novoServico: string) => {
    const novaProfissao = profissaoDoServico(novoServico);
    setServico(novoServico);
    setProfissao(
      profissoesDisponiveis.includes(novaProfissao)
        ? novaProfissao
        : profissoesDisponiveis[0]
    );
    setMedico("");
    setHorarioSelecionado("");
    setErro("");
  };

  const horarioOcupado = (horario: string) =>
    agendamentos.some(
      (item) =>
        item.dia === diaSelecionado &&
        item.periodo === periodo &&
        item.horario === horario &&
        item.medico === medico.trim() &&
        item.status !== "cancelado"
    );

  const diaTemHorario = (dia: string) => {
    if (!medico) return true;
    return horariosDisponiveis.some(
      (horario) =>
        !agendamentos.some(
          (item) =>
            item.dia === dia &&
            item.periodo === periodo &&
            item.horario === horario &&
            item.medico === medico &&
            item.status !== "cancelado"
        )
    );
  };

  const agendar = async () => {
    setErro("");
    setMensagem("");

    if (!usuario) {
      router.replace("/entrar");
      return;
    }

    if (!servico || !profissao || !medico.trim() || !diaSelecionado || !horarioSelecionado) {
      setErro("Selecione o atendimento, a especialidade, o profissional, o dia e o horário.");
      return;
    }

    if (horarioOcupado(horarioSelecionado)) {
      setErro("Esse horário já está ocupado. Escolha outro.");
      return;
    }

    const [ano, mes, dia] = diaSelecionado.split("-").map(Number);
    const data = new Date(ano, mes - 1, dia);
    if (data.getDay() === 0 || data.getDay() === 6) {
      setErro("Os agendamentos devem ser feitos em dias úteis.");
      return;
    }

    try {
      setSalvando(true);
      await addDoc(collection(db, "usuarios", usuario.uid, "agendamentos"), {
        userId: usuario.uid,
        servico,
        periodo,
        medico: medico.trim(),
        profissao: profissao.trim(),
        dia: diaSelecionado,
        horario: horarioSelecionado,
        unidadeReferencia: perfil.unidadeReferencia ?? "",
        status: "agendado",
        criadoEm: serverTimestamp(),
      });
      setMensagem("Solicitação de agendamento registrada.");
      setHorarioSelecionado("");
    } catch (erroFirebase) {
      console.error("Erro ao salvar agendamento:", erroFirebase);
      setErro("Não foi possível registrar o agendamento. Confira sua conexão e as regras do Firestore.");
    } finally {
      setSalvando(false);
    }
  };

  const cancelarAgendamento = async (id: string) => {
    if (!usuario) return;
    setErro("");
    setMensagem("");

    try {
      await deleteDoc(doc(db, "usuarios", usuario.uid, "agendamentos", id));
      setMensagem("Agendamento removido.");
    } catch (erroFirebase) {
      console.error("Erro ao cancelar agendamento:", erroFirebase);
      setErro("Não foi possível cancelar o agendamento.");
    }
  };

  const campoClasse =
    "mt-1 w-full rounded-xl border border-[#D1D5DB] bg-white px-4 py-3 text-sm text-[#111827] outline-none focus:border-[#007DB8] focus:ring-2 focus:ring-[#8ED3F5]/50";
  const labelClasse = "block text-sm font-bold text-[#111827]";
  const agendamentosAtivos = agendamentos.filter((item) => item.status !== "cancelado");

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <Header />
      <Navigation />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="mb-7">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#007DB8]">
            Saúde Vale+
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#005F8F] sm:text-4xl">
            Agendamentos
          </h1>
          <p className="mt-2 text-sm text-[#111827]/65 sm:text-base">
            Escolha o período, o atendimento, o profissional e o melhor horário disponível.
          </p>
        </div>

        {(mensagem || erro) && (
          <div
            role={erro ? "alert" : "status"}
            className={`mb-5 rounded-xl border px-4 py-3 text-sm ${erro ? "border-red-200 bg-red-50 text-red-700" : "border-green-200 bg-green-50 text-green-700"
              }`}
          >
            {erro || mensagem}
          </div>
        )}

        {carregando || etapa === "carregando" ? (
          <section className="rounded-3xl border border-[#D1D5DB] bg-white p-8">
            Carregando seus dados e agendamentos...
          </section>
        ) : etapa === "perfil" ? (
          <section className="rounded-3xl border border-[#D1D5DB] bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-2xl font-extrabold text-[#005F8F]">Complete seus dados</h2>
            <p className="mt-2 text-sm leading-6 text-[#111827]/65">
              Precisamos destas informações para continuar. Depois de salvar, você poderá alterar seus dados pela página Perfil.
            </p>

            <div className="mt-7 grid gap-5 sm:grid-cols-2">
              {(
                [
                  ["nome", "Nome completo"],
                  ["cpf", "CPF"],
                  ["telefone", "Telefone"],
                  ["dataNascimento", "Data de nascimento"],
                  ["cartaoSus", "Cartão SUS"],
                  ["cep", "CEP"],
                  ["rua", "Rua ou avenida"],
                  ["numero", "Número"],
                  ["bairro", "Bairro"],
                  ["cidade", "Cidade"],
                ] as [keyof Perfil, string][]
              ).map(([campo, titulo]) => (
                <div key={campo}>
                  <label className={labelClasse}>{titulo} *</label>
                  <input
                    type={campo === "dataNascimento" ? "date" : "text"}
                    className={campoClasse}
                    value={String(perfil[campo] ?? "")}
                    onChange={(e) => atualizarPerfil(campo, e.target.value)}
                    inputMode={["cpf", "telefone", "cartaoSus", "cep"].includes(campo) ? "numeric" : undefined}
                  />
                </div>
              ))}
              <div>
                <label className={labelClasse}>E-mail</label>
                <input className={`${campoClasse} bg-[#F5F7FA]`} value={usuario?.email ?? ""} readOnly />
              </div>
              <div>
                <label className={labelClasse}>Unidade de referência</label>
                <input className={`${campoClasse} bg-[#F5F7FA]`} value={perfil.unidadeReferencia ?? ""} readOnly placeholder="A confirmar" />
              </div>
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={salvarPerfil}
                disabled={salvando}
                className="rounded-xl bg-[#007DB8] px-6 py-3 text-sm font-bold text-white hover:bg-[#005F8F] disabled:opacity-50"
              >
                {salvando ? "Salvando..." : "Salvar e continuar"}
              </button>
              <button
                type="button"
                onClick={() => setEtapa("agendar")}
                className="rounded-xl border border-[#D1D5DB] px-6 py-3 text-sm font-bold text-[#005F8F] hover:border-[#007DB8]"
              >
                Continuar sem alterar
              </button>
              <button
                type="button"
                onClick={() => router.push("/perfil")}
                className="rounded-xl border border-[#D1D5DB] px-6 py-3 text-sm font-bold text-[#005F8F] hover:border-[#007DB8]"
              >
                Abrir meu perfil
              </button>
            </div>
          </section>
        ) : etapa === "agendar" ? (
          <div className="grid items-start gap-5 lg:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.45fr)]">
            <section className="rounded-3xl border border-[#D1D5DB] bg-white p-5 shadow-sm sm:p-6">
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#007DB8]">Atendimento</p>
              <h2 className="mt-2 text-xl font-extrabold text-[#111827]">O que você precisa?</h2>

              <div className="mt-5">
                <label className={labelClasse}>Período</label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {(["Manhã", "Tarde"] as Periodo[]).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => selecionarPeriodo(item)}
                      className={`rounded-xl border px-4 py-3 text-sm font-bold transition ${periodo === item
                        ? "border-[#007DB8] bg-[#E8F5FC] text-[#005F8F] ring-1 ring-[#007DB8]"
                        : "border-[#D1D5DB] bg-white text-[#374151] hover:border-[#007DB8]"
                        }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              {periodo === "Tarde" && (
                <p className="mt-3 rounded-xl bg-[#F5F7FA] p-3 text-xs leading-5 text-[#374151]">
                  Gestantes que estiverem passando mal devem procurar a unidade pela manhã para orientação. Em uma emergência, procure atendimento de urgência.
                </p>
              )}

              <div className="mt-5">
                <label className={labelClasse}>Tipo de atendimento</label>
                <select className={campoClasse} value={servico} onChange={(e) => selecionarServico(e.target.value)}>
                  {servicosDisponiveis.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>

              <div className="mt-5">
                <div className="flex items-center justify-between gap-2">
                  <label className={labelClasse}>Profissional</label>
                  <span className="text-xs text-[#6B7280]">{profissionaisDisponiveis.length} encontrados</span>
                </div>
                <div className="mt-2 space-y-2">
                  {profissionaisDisponiveis.map((item) => {
                    const selecionado = medico === item;
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => {
                          setMedico(item);
                          setHorarioSelecionado("");
                          setErro("");
                        }}
                        className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${selecionado
                          ? "border-[#007DB8] bg-[#E8F5FC] ring-1 ring-[#007DB8]"
                          : "border-[#D1D5DB] bg-white hover:border-[#8ED3F5]"
                          }`}
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E8F5FC] text-xs font-extrabold text-[#005F8F]">
                          {item.split(" ").map((parte) => parte[0]).slice(0, 2).join("")}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-bold text-[#111827]">{item}</span>
                          <span className="mt-0.5 block text-xs text-[#6B7280]">{profissao}</span>
                        </span>
                        {selecionado && <span className="text-sm font-extrabold text-[#007DB8]">✓</span>}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-3 text-xs leading-5 text-[#6B7280]">
                  Os profissionais são exemplos demonstrativos; a lista oficial deverá ser cadastrada pela unidade de saúde.
                </p>
              </div>
            </section>

            <div className="space-y-5">
              <section className="rounded-3xl bg-[#005F8F] p-5 text-white shadow-sm sm:p-6">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/75">Seu atendimento</p>
                <h2 className="mt-2 text-xl font-extrabold">
                  {medico || "Selecione um profissional"}
                </h2>
                <p className="mt-1 text-sm text-white/80">
                  {medico ? profissao : "Depois de escolher o profissional, os dias e horários disponíveis aparecerão aqui."}
                </p>
              </section>

              <section className="rounded-3xl border border-[#D1D5DB] bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#007DB8]">Calendário</p>
                    <h2 className="mt-1 text-xl font-extrabold text-[#111827]">Escolha o dia</h2>
                  </div>
                  <p className="text-xs text-[#6B7280]">Próximos dias úteis</p>
                </div>

                {!medico ? (
                  <p className="mt-5 rounded-xl bg-[#F5F7FA] p-4 text-sm text-[#6B7280]">
                    Selecione um profissional para consultar os dias disponíveis.
                  </p>
                ) : (
                  <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
                    {dias.map((dia) => {
                      const curto = formatarDiaCurto(dia);
                      const disponivel = diaTemHorario(dia);
                      const selecionado = diaSelecionado === dia;
                      return (
                        <button
                          key={dia}
                          type="button"
                          disabled={!disponivel}
                          onClick={() => {
                            setDiaSelecionado(dia);
                            setHorarioSelecionado("");
                            setErro("");
                          }}
                          className={`min-h-[78px] rounded-2xl border p-3 text-left transition ${selecionado
                            ? "border-green-600 bg-green-600 text-white ring-2 ring-green-200"
                            : disponivel
                              ? "border-green-200 bg-green-50 text-[#166534] hover:border-green-400"
                              : "cursor-not-allowed border-red-200 bg-red-50 text-red-600"
                            }`}
                        >
                          <span className="block text-xs font-semibold capitalize">{curto.semana}</span>
                          <span className="mt-1 block text-lg font-extrabold">{curto.data}</span>
                          <span className={`mt-1 block text-[10px] ${selecionado ? "text-white/85" : ""}`}>
                            {disponivel ? "Horários livres" : "Sem horários"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>

              <section className="rounded-3xl border border-[#D1D5DB] bg-white p-5 shadow-sm sm:p-6">
                <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#007DB8]">Horários</p>
                <h2 className="mt-1 text-xl font-extrabold text-[#111827]">Escolha um horário</h2>

                {!medico || !diaSelecionado ? (
                  <p className="mt-4 rounded-xl bg-[#F5F7FA] p-4 text-sm text-[#6B7280]">
                    Selecione um profissional e um dia para visualizar os horários.
                  </p>
                ) : (
                  <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {horariosDisponiveis.map((horario) => {
                      const ocupado = horarioOcupado(horario);
                      const selecionado = horarioSelecionado === horario;
                      return (
                        <button
                          key={horario}
                          type="button"
                          disabled={ocupado}
                          onClick={() => setHorarioSelecionado(horario)}
                          className={`rounded-xl border px-3 py-3 text-sm font-extrabold transition ${ocupado
                            ? "cursor-not-allowed border-red-200 bg-red-50 text-red-500"
                            : selecionado
                              ? "border-[#007DB8] bg-[#007DB8] text-white"
                              : "border-green-200 bg-green-50 text-green-800 hover:border-green-400"
                            }`}
                        >
                          <span className="block">{horario}</span>
                          <span className="mt-1 block text-[10px] font-medium">
                            {ocupado ? "Ocupado" : selecionado ? "Selecionado" : "Disponível"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>

              <section className="rounded-3xl border border-[#D1D5DB] bg-white p-5 shadow-sm sm:p-6">
                <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#007DB8]">Resumo</p>
                <h2 className="mt-1 text-xl font-extrabold text-[#111827]">Seu agendamento</h2>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {[
                    ["Atendimento", servico || "Não selecionado"],
                    ["Profissional", medico || "Não selecionado"],
                    ["Data", diaSelecionado ? formatarData(diaSelecionado) : "Não selecionada"],
                    ["Horário", horarioSelecionado || "Não selecionado"],
                  ].map(([titulo, valor]) => (
                    <div key={titulo} className="rounded-xl bg-[#F5F7FA] p-3">
                      <p className="text-[11px] font-semibold text-[#6B7280]">{titulo}</p>
                      <p className="mt-1 text-sm font-bold text-[#111827]">{valor}</p>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={agendar}
                  disabled={salvando}
                  className="mt-5 w-full rounded-xl bg-[#007DB8] px-5 py-3.5 text-sm font-extrabold text-white transition hover:bg-[#005F8F] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {salvando ? "Registrando..." : "Confirmar agendamento"}
                </button>
              </section>

              <button
                type="button"
                onClick={() => setEtapa("consultas")}
                className="text-sm font-bold text-[#007DB8] hover:underline"
              >
                Minhas consultas →
              </button>
            </div>
          </div>
        ) : (
          <section className="rounded-3xl border border-[#D1D5DB] bg-white p-6 shadow-sm sm:p-8">
            <button
              type="button"
              onClick={() => setEtapa("agendar")}
              className="mb-5 text-sm font-bold text-[#007DB8] hover:underline"
            >
              ← Voltar ao agendamento
            </button>

            <h2 className="text-2xl font-extrabold text-[#005F8F]">Minhas consultas</h2>
            <div className="mt-6 space-y-4">
              {agendamentosAtivos.length === 0 ? (
                <div className="rounded-xl bg-[#F5F7FA] p-5 text-sm text-[#111827]/65">
                  Você ainda não possui agendamentos registrados.
                </div>
              ) : (
                agendamentosAtivos.map((item) => (
                  <article key={item.id} className="rounded-2xl border border-[#D1D5DB] bg-white p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-extrabold text-[#005F8F]">{item.servico}</h3>
                        <p className="mt-1 text-sm text-[#111827]/65">
                          {item.medico}{item.profissao ? ` · ${item.profissao}` : ""}
                        </p>
                        <p className="mt-2 text-sm text-[#111827]/65">{formatarData(item.dia)} às {item.horario}</p>
                        <p className="mt-2 text-xs text-[#111827]/60">Período: {item.periodo} · Situação: {item.status}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => cancelarAgendamento(item.id)}
                        className="rounded-lg border border-red-200 px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50"
                      >
                        Cancelar agendamento
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
