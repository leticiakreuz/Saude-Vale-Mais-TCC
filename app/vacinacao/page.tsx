
"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  addDoc,
  collection,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";

import Header from "../../componentes/Header";
import Navigation from "../../componentes/Navigation";
import Footer from "../../componentes/Footer";
import { auth, db } from "../firebase";

type RegistroVacina = {
  id: string;
  vacina: string;
  dose: string;
  dataAplicacao: string;
  dataPrevista: string;
  lote: string;
  unidade: string;
  status: string;
};

const categorias = [
  "Crianças",
  "Adolescentes e jovens",
  "Adultos",
  "Idosos",
  "Gestantes",
] as const;

type Categoria = (typeof categorias)[number];

const orientacoes: Record<Categoria, string> = {
  Crianças:
    "Consulte as vacinas recomendadas desde o nascimento, as doses previstas para cada idade e os reforços indicados.",
  "Adolescentes e jovens":
    "Consulte as vacinas recomendadas para adolescentes e jovens, considerando as doses anteriores e a faixa etária.",
  Adultos:
    "Consulte as vacinas de rotina, os reforços e as recomendações aplicáveis ao seu histórico vacinal.",
  Idosos:
    "Consulte as recomendações de vacinação para pessoas com 60 anos ou mais.",
  Gestantes:
    "Consulte as vacinas recomendadas durante a gestação e converse com a equipe de saúde sobre seu histórico vacinal.",
};

function normalizar(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function obterStatus(registro: RegistroVacina): string {
  const status = normalizar(registro.status);

  if (
    status.includes("aplicada") ||
    status.includes("concluida") ||
    status.includes("administrada")
  ) {
    return "aplicada";
  }

  if (registro.dataPrevista) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const prevista = new Date(`${registro.dataPrevista}T00:00:00`);

    if (!Number.isNaN(prevista.getTime()) && prevista < hoje) {
      return "atrasada";
    }
  }

  if (status.includes("atrasada") || status.includes("atrasado")) {
    return "atrasada";
  }

  if (status.includes("pendente")) {
    return "pendente";
  }

  return "sem-confirmacao";
}

function formatarData(data: string) {
  if (!data) return "—";

  const partes = data.split("-");
  if (partes.length === 3) {
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  return data;
}

function Icone({
  tipo,
  tamanho = 20,
}: {
  tipo: "vacina" | "calendario" | "check" | "alerta" | "arquivo";
  tamanho?: number;
}) {
  const propriedades = {
    width: tamanho,
    height: tamanho,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };

  if (tipo === "vacina") {
    return (
      <svg {...propriedades}>
        <path d="m14 4 6 6M17 1l6 6M12 6l6 6M5 13l6 6M3 21l4-4M8 10l6 6M4 14l6-6 6 6-6 6z" />
      </svg>
    );
  }

  if (tipo === "calendario") {
    return (
      <svg {...propriedades}>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18" />
      </svg>
    );
  }

  if (tipo === "check") {
    return (
      <svg {...propriedades}>
        <circle cx="12" cy="12" r="9" />
        <path d="m8 12 3 3 5-6" />
      </svg>
    );
  }

  if (tipo === "alerta") {
    return (
      <svg {...propriedades}>
        <path d="M12 3 2.5 20h19L12 3z" />
        <path d="M12 9v4M12 16h.01" />
      </svg>
    );
  }

  return (
    <svg {...propriedades}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M8 13h8M8 17h8" />
    </svg>
  );
}

export default function VacinacaoPage() {
  const [usuario, setUsuario] = useState<User | null>(null);
  const [registros, setRegistros] = useState<RegistroVacina[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [categoria, setCategoria] = useState<Categoria>("Crianças");
  const [secao, setSecao] = useState<"carteirinha" | "calendario">(
    "carteirinha"
  );

  const [vacina, setVacina] = useState("");
  const [dose, setDose] = useState("1ª dose");
  const [dataAplicacao, setDataAplicacao] = useState("");
  const [dataPrevista, setDataPrevista] = useState("");
  const [lote, setLote] = useState("");
  const [unidade, setUnidade] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  useEffect(() => {
    const cancelarAuth = onAuthStateChanged(auth, (user) => {
      setUsuario(user);

      if (!user) {
        setRegistros([]);
        setCarregando(false);
        return;
      }

      setCarregando(true);

      const referencia = collection(db, "usuarios", user.uid, "vacinacao");

      const cancelarRegistros = onSnapshot(
        referencia,
        (snapshot) => {
          const lista = snapshot.docs.map((documento) => {
            const dados = documento.data();

            return {
              id: documento.id,
              vacina: String(dados.vacina ?? dados.nome ?? ""),
              dose: String(dados.dose ?? ""),
              dataAplicacao: String(
                dados.dataAplicacao ?? dados.data ?? ""
              ),
              dataPrevista: String(dados.dataPrevista ?? ""),
              lote: String(dados.lote ?? ""),
              unidade: String(dados.unidade ?? ""),
              status: String(dados.status ?? ""),
            };
          });

          setRegistros(lista);
          setErro("");
          setCarregando(false);
        },
        () => {
          setErro(
            "Não foi possível carregar sua carteirinha. Verifique sua conexão e as permissões do Firebase."
          );
          setCarregando(false);
        }
      );

      // A inscrição dos registros é encerrada quando o usuário muda.
      return cancelarRegistros;
    });

    return () => cancelarAuth();
  }, []);

  const vacinas = useMemo(() => {
    const grupos = new Map<string, RegistroVacina[]>();

    registros.forEach((registro) => {
      if (!registro.vacina.trim()) return;

      const chave = normalizar(registro.vacina);
      const grupo = grupos.get(chave) ?? [];
      grupo.push(registro);
      grupos.set(chave, grupo);
    });

    return Array.from(grupos.values())
      .map((grupo) =>
        grupo.sort((a, b) =>
          a.dose.localeCompare(b.dose, "pt-BR", {
            numeric: true,
          })
        )
      )
      .sort((a, b) =>
        a[0].vacina.localeCompare(b[0].vacina, "pt-BR")
      );
  }, [registros]);

  const atrasadas = registros.filter(
    (registro) => obterStatus(registro) === "atrasada"
  );

  const aplicadas = registros.filter(
    (registro) => obterStatus(registro) === "aplicada"
  );

  async function salvarRegistro(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    if (!usuario) {
      setErro("Entre na sua conta para registrar uma vacinação.");
      return;
    }

    if (!vacina.trim()) {
      setErro("Informe o nome da vacina.");
      return;
    }

    if (!dataAplicacao && !dataPrevista) {
      setErro("Informe a data de aplicação ou a data prevista.");
      return;
    }

    setSalvando(true);
    setErro("");

    try {
      await addDoc(
        collection(db, "usuarios", usuario.uid, "vacinacao"),
        {
          vacina: vacina.trim(),
          dose,
          dataAplicacao,
          dataPrevista,
          lote: lote.trim(),
          unidade: unidade.trim(),
          status: dataAplicacao ? "aplicada" : "pendente",
          criadoEm: serverTimestamp(),
        }
      );

      setVacina("");
      setDose("1ª dose");
      setDataAplicacao("");
      setDataPrevista("");
      setLote("");
      setUnidade("");
      setMostrarFormulario(false);
    } catch {
      setErro(
        "Não foi possível salvar o registro. Confira as regras do Firestore."
      );
    } finally {
      setSalvando(false);
    }
  }

  const statusVisual = (registro: RegistroVacina) => {
    const status = obterStatus(registro);

    if (status === "aplicada") {
      return {
        classe: "border-green-300 bg-green-50 text-green-800",
        texto: "Aplicada",
      };
    }

    if (status === "atrasada") {
      return {
        classe: "border-red-300 bg-red-50 text-red-800",
        texto: "Atrasada",
      };
    }

    if (status === "pendente") {
      return {
        classe: "border-amber-300 bg-amber-50 text-amber-800",
        texto: "Pendente",
      };
    }

    return {
      classe: "border-gray-300 bg-gray-50 text-gray-600",
      texto: "Sem confirmação",
    };
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#111827]">
      <Header />
      <Navigation />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-7">
          <Link
            href="/dashboard"
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-[#005F8F] hover:underline"
          >
            ← Voltar ao painel
          </Link>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-[#007DB8]">
                <Icone tipo="vacina" tamanho={25} />
                <span className="text-sm font-semibold uppercase tracking-wide">
                  Saúde Vale+ · Saúde preventiva
                </span>
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-[#005F8F] sm:text-4xl">
                Minha Carteirinha de Vacinação
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600 sm:text-base">
                Consulte os registros das suas doses e veja as orientações do
                calendário de vacinação.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setSecao("carteirinha");
                setMostrarFormulario((valor) => !valor);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#005F8F] px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-[#004b70]"
            >
              <span className="text-xl leading-none">+</span>
              Registrar vacinação
            </button>
          </div>
        </div>

        {!usuario && !carregando && (
          <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900">
            Entre na sua conta para consultar e registrar suas vacinas.
            <Link href="/login" className="ml-2 font-bold underline">
              Entrar
            </Link>
          </div>
        )}

        {erro && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            {erro}
          </div>
        )}

        <section className="mb-7 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Doses registradas</span>
              <span className="rounded-lg bg-blue-50 p-2 text-[#007DB8]">
                <Icone tipo="vacina" />
              </span>
            </div>
            <p className="mt-3 text-3xl font-bold text-[#005F8F]">
              {carregando ? "—" : aplicadas.length}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Registros identificados como aplicados
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Doses atrasadas</span>
              <span className="rounded-lg bg-red-50 p-2 text-red-700">
                <Icone tipo="alerta" />
              </span>
            </div>
            <p className="mt-3 text-3xl font-bold text-red-700">
              {carregando ? "—" : atrasadas.length}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Verifique com a unidade de saúde
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Vacinas registradas</span>
              <span className="rounded-lg bg-green-50 p-2 text-green-700">
                <Icone tipo="check" />
              </span>
            </div>
            <p className="mt-3 text-3xl font-bold text-[#005F8F]">
              {carregando ? "—" : vacinas.length}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Tipos de vacina na carteirinha
            </p>
          </div>
        </section>

        <div className="mb-6 flex flex-wrap gap-2 rounded-xl border border-gray-200 bg-white p-2">
          <button
            type="button"
            onClick={() => setSecao("carteirinha")}
            className={`rounded-lg px-4 py-3 text-sm font-semibold transition ${secao === "carteirinha"
                ? "bg-[#005F8F] text-white"
                : "text-gray-600 hover:bg-gray-100"
              }`}
          >
            <span className="inline-flex items-center gap-2">
              <Icone tipo="arquivo" tamanho={18} />
              Minha carteirinha
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSecao("calendario")}
            className={`rounded-lg px-4 py-3 text-sm font-semibold transition ${secao === "calendario"
                ? "bg-[#005F8F] text-white"
                : "text-gray-600 hover:bg-gray-100"
              }`}
          >
            <span className="inline-flex items-center gap-2">
              <Icone tipo="calendario" tamanho={18} />
              Calendário de vacinação
            </span>
          </button>
        </div>

        {secao === "carteirinha" && (
          <>
            {mostrarFormulario && usuario && (
              <section className="mb-7 rounded-2xl border border-blue-200 bg-white p-5 shadow-sm sm:p-7">
                <div className="mb-5">
                  <h2 className="text-xl font-bold text-[#005F8F]">
                    Registrar uma dose
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Informe os dados que constam no registro de vacinação.
                  </p>
                </div>

                <form onSubmit={salvarRegistro} className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <label className="text-sm font-medium text-gray-700">
                      Nome da vacina *
                      <input
                        required
                        value={vacina}
                        onChange={(e) => setVacina(e.target.value)}
                        placeholder="Ex.: Hepatite B"
                        className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-3 font-normal outline-none focus:border-[#007DB8] focus:ring-2 focus:ring-blue-100"
                      />
                    </label>

                    <label className="text-sm font-medium text-gray-700">
                      Dose *
                      <select
                        value={dose}
                        onChange={(e) => setDose(e.target.value)}
                        className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-3 font-normal outline-none focus:border-[#007DB8]"
                      >
                        <option>Única</option>
                        <option>1ª dose</option>
                        <option>2ª dose</option>
                        <option>3ª dose</option>
                        <option>1º reforço</option>
                        <option>2º reforço</option>
                        <option>Outra dose</option>
                      </select>
                    </label>

                    <label className="text-sm font-medium text-gray-700">
                      Data de aplicação
                      <input
                        type="date"
                        value={dataAplicacao}
                        onChange={(e) => setDataAplicacao(e.target.value)}
                        className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-3 font-normal outline-none focus:border-[#007DB8]"
                      />
                    </label>

                    <label className="text-sm font-medium text-gray-700">
                      Data prevista
                      <input
                        type="date"
                        value={dataPrevista}
                        onChange={(e) => setDataPrevista(e.target.value)}
                        className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-3 font-normal outline-none focus:border-[#007DB8]"
                      />
                    </label>

                    <label className="text-sm font-medium text-gray-700">
                      Lote (se disponível)
                      <input
                        value={lote}
                        onChange={(e) => setLote(e.target.value)}
                        placeholder="Número do lote"
                        className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-3 font-normal outline-none focus:border-[#007DB8]"
                      />
                    </label>

                    <label className="text-sm font-medium text-gray-700">
                      Unidade de saúde
                      <input
                        value={unidade}
                        onChange={(e) => setUnidade(e.target.value)}
                        placeholder="Nome da unidade"
                        className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-3 font-normal outline-none focus:border-[#007DB8]"
                      />
                    </label>
                  </div>

                  <p className="text-xs leading-5 text-gray-500">
                    Preencha a data de aplicação somente quando a dose tiver
                    sido efetivamente aplicada. Este formulário registra
                    informações fornecidas pelo usuário; não substitui a
                    confirmação de um profissional de saúde.
                  </p>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="submit"
                      disabled={salvando}
                      className="rounded-lg bg-[#005F8F] px-5 py-3 font-semibold text-white hover:bg-[#004b70] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {salvando ? "Salvando..." : "Salvar registro"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setMostrarFormulario(false)}
                      className="rounded-lg border border-gray-300 px-5 py-3 font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </section>
            )}

            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="bg-[#005F8F] p-5 text-white sm:p-7">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-white/15 p-3">
                    <Icone tipo="arquivo" tamanho={30} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold sm:text-2xl">
                      Carteira de vacinação
                    </h2>
                    <p className="mt-1 text-sm text-blue-100">
                      Registro individual de doses
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 border-t border-white/20 pt-5 sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-blue-100">Nome do cidadão</p>
                    <p className="mt-1 font-semibold">
                      {usuario?.displayName || "Nome não cadastrado"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-100">E-mail da conta</p>
                    <p className="mt-1 break-all font-semibold">
                      {usuario?.email || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-100">Identificação</p>
                    <p className="mt-1 font-semibold">
                      Dados da conta Saúde Vale+
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-6">
                <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-[#005F8F]">
                      Registro das doses
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Cada espaço representa uma dose registrada.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3 text-xs">
                    <span className="flex items-center gap-1.5 text-green-800">
                      <span className="h-3 w-3 rounded-sm border border-green-400 bg-green-100" />
                      Aplicada
                    </span>
                    <span className="flex items-center gap-1.5 text-red-800">
                      <span className="h-3 w-3 rounded-sm border border-red-400 bg-red-100" />
                      Atrasada
                    </span>
                    <span className="flex items-center gap-1.5 text-amber-800">
                      <span className="h-3 w-3 rounded-sm border border-amber-400 bg-amber-100" />
                      Pendente
                    </span>
                  </div>
                </div>

                {carregando ? (
                  <div className="rounded-xl border border-gray-200 p-10 text-center text-gray-500">
                    Carregando sua carteirinha...
                  </div>
                ) : vacinas.length === 0 ? (
                  <div className="rounded-xl border-2 border-dashed border-gray-300 px-5 py-12 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-[#007DB8]">
                      <Icone tipo="vacina" tamanho={28} />
                    </div>
                    <h4 className="text-lg font-bold text-gray-800">
                      Nenhuma vacinação registrada
                    </h4>
                    <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-gray-600">
                      Quando houver registros no sistema, cada vacina e suas
                      doses aparecerão nos espaços desta carteirinha. Não
                      consideramos a ausência de registros como atraso.
                    </p>
                    {usuario && (
                      <button
                        type="button"
                        onClick={() => setMostrarFormulario(true)}
                        className="mt-5 rounded-lg bg-[#005F8F] px-5 py-3 font-semibold text-white hover:bg-[#004b70]"
                      >
                        Registrar uma dose
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-gray-300">
                    <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                      <thead>
                        <tr className="bg-[#E8F4FA] text-[#005F8F]">
                          <th className="border border-gray-300 px-3 py-3 font-bold">
                            Vacina
                          </th>
                          <th className="border border-gray-300 px-3 py-3 font-bold">
                            1ª dose
                          </th>
                          <th className="border border-gray-300 px-3 py-3 font-bold">
                            2ª dose
                          </th>
                          <th className="border border-gray-300 px-3 py-3 font-bold">
                            3ª dose
                          </th>
                          <th className="border border-gray-300 px-3 py-3 font-bold">
                            Reforço / outras
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {vacinas.map((grupo) => (
                          <tr key={grupo[0].id} className="align-top">
                            <th className="border border-gray-300 bg-gray-50 px-3 py-4 font-semibold text-gray-800">
                              {grupo[0].vacina}
                            </th>

                            {[0, 1, 2, 3].map((indice) => {
                              const registro = grupo[indice];

                              if (!registro) {
                                return (
                                  <td
                                    key={indice}
                                    className="border border-gray-300 p-2"
                                  >
                                    <div className="flex min-h-24 items-center justify-center rounded-md border border-dashed border-gray-200 text-center text-xs text-gray-400">
                                      Sem registro
                                    </div>
                                  </td>
                                );
                              }

                              const visual = statusVisual(registro);

                              return (
                                <td
                                  key={registro.id}
                                  className="border border-gray-300 p-2"
                                >
                                  <div
                                    className={`min-h-24 rounded-md border p-2 ${visual.classe}`}
                                  >
                                    <p className="font-bold">
                                      {registro.dose || `Dose ${indice + 1}`}
                                    </p>
                                    <p className="mt-2 text-xs">
                                      {registro.dataAplicacao
                                        ? formatarData(registro.dataAplicacao)
                                        : registro.dataPrevista
                                          ? `Prevista: ${formatarData(registro.dataPrevista)}`
                                          : "Data não informada"}
                                    </p>
                                    <p className="mt-2 text-xs font-bold">
                                      {visual.texto}
                                    </p>
                                    {registro.unidade && (
                                      <p className="mt-1 break-words text-xs">
                                        {registro.unidade}
                                      </p>
                                    )}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <p className="mt-4 text-xs leading-5 text-gray-500">
                  Os espaços sem registro não significam necessariamente que
                  uma dose esteja pendente. A situação vacinal precisa ser
                  conferida com o histórico completo e o calendário aplicável.
                </p>
              </div>
            </section>

            <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-blue-50 p-2 text-[#007DB8]">
                  <Icone tipo="alerta" tamanho={22} />
                </div>
                <div>
                  <h3 className="font-bold text-[#005F8F]">
                    Atenção às doses atrasadas
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-gray-600">
                    Se houver uma dose identificada como atrasada, procure sua
                    unidade de saúde para confirmar a situação e receber
                    orientação. Não reinicie o esquema vacinal por conta
                    própria.
                  </p>
                </div>
              </div>
            </section>
          </>
        )}

        {secao === "calendario" && (
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-6">
              <div className="mb-2 flex items-center gap-2 text-[#007DB8]">
                <Icone tipo="calendario" tamanho={25} />
                <span className="text-sm font-semibold">
                  Orientação por fase da vida
                </span>
              </div>
              <h2 className="text-2xl font-bold text-[#005F8F]">
                Calendário de Vacinação
              </h2>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Escolha uma categoria para consultar as orientações. As
                recomendações dependem da idade, do histórico vacinal e de
                condições individuais.
              </p>
            </div>

            <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {categorias.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCategoria(item)}
                  className={`rounded-xl border px-3 py-4 text-sm font-semibold transition ${categoria === item
                      ? "border-[#005F8F] bg-[#005F8F] text-white"
                      : "border-gray-200 bg-white text-gray-700 hover:border-[#8ED3F5] hover:bg-blue-50"
                    }`}
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="rounded-xl border border-blue-200 bg-[#F0F8FC] p-5 sm:p-6">
              <h3 className="text-xl font-bold text-[#005F8F]">
                {categoria}
              </h3>
              <p className="mt-3 text-sm leading-6 text-gray-700">
                {orientacoes[categoria]}
              </p>

              <a
                href="https://www.gov.br/saude/pt-br/vacinacao/calendario"
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#005F8F] px-4 py-3 text-sm font-semibold text-white hover:bg-[#004b70]"
              >
                Consultar calendário oficial
                <span aria-hidden="true">↗</span>
              </a>
            </div>

            <p className="mt-5 text-xs leading-5 text-gray-500">
              O calendário oficial pode mudar. Consulte as orientações
              atualizadas do Ministério da Saúde e confirme com um profissional
              quais doses são indicadas para cada pessoa. Esta página ainda não
              importa automaticamente o calendário oficial nem determina
              todas as doses recomendadas individualmente.
            </p>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
