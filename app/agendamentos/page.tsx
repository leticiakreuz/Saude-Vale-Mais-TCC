"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
    collection,
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

// ============================================================
// TIPOS
// ============================================================

type Periodo = "Manhã" | "Tarde";

type Etapa =
    | "carregando"
    | "perfil"
    | "inicio"
    | "atendimento"
    | "calendario"
    | "resumo"
    | "consultas"
    | "historico";

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
    unidadeReferencia?: string;
    reservaId?: string;
};

// ============================================================
// CONFIGURAÇÕES DEMONSTRATIVAS
// ============================================================

const servicosPorPeriodo: Record<Periodo, string[]> = {
    Manhã: [
        "Consulta médica",
        "Pediatria",
        "Odontologia",
        "Consulta de retorno",
        "Renovação de receita",
    ],
    Tarde: [
        "Odontologia",
        "Renovação de receita",
    ],
};

const profissionaisPorProfissao: Record<string, string[]> = {
    "Clínico geral": [
        "Dr. Rafael Martins",
        "Dra. Juliana Costa",
    ],
    Pediatra: [
        "Dra. Mariana Alves",
        "Dr. Felipe Rocha",
    ],
    Dentista: [
        "Dra. Camila Souza",
        "Dr. Bruno Lima",
    ],
};

const profissoesPorPeriodo: Record<Periodo, string[]> = {
    Manhã: [
        "Clínico geral",
        "Pediatra",
        "Dentista",
    ],
    Tarde: [
        "Dentista",
        "Clínico geral",
    ],
};

const horariosPorPeriodo: Record<Periodo, string[]> = {
    Manhã: [
        "07:30",
        "08:30",
        "10:30",
        "11:30",
    ],
    Tarde: [
        "13:30",
        "14:30",
        "16:00",
    ],
};

// ============================================================
// FUNÇÕES AUXILIARES
// ============================================================

function gerarDias(): string[] {
    const dias: string[] = [];
    const hoje = new Date();

    for (let i = 0; i < 21; i++) {
        const data = new Date(
            hoje.getFullYear(),
            hoje.getMonth(),
            hoje.getDate() + i
        );

        if (data.getDay() === 0 || data.getDay() === 6) {
            continue;
        }

        const ano = data.getFullYear();
        const mes = String(data.getMonth() + 1).padStart(2, "0");
        const dia = String(data.getDate()).padStart(2, "0");

        dias.push(`${ano}-${mes}-${dia}`);
    }

    return dias;
}

function formatarData(dataString: string): string {
    if (!dataString) {
        return "";
    }

    const [ano, mes, dia] = dataString.split("-").map(Number);

    return new Date(
        ano,
        mes - 1,
        dia
    ).toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}

function formatarDiaCurto(
    dataString: string
): {
    semana: string;
    data: string;
} {
    const [ano, mes, dia] = dataString.split("-").map(Number);

    const data = new Date(
        ano,
        mes - 1,
        dia
    );

    return {
        semana: data
            .toLocaleDateString("pt-BR", {
                weekday: "short",
            })
            .replace(".", ""),

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
    const todosPreenchidos = camposObrigatoriosPerfil.every(
        (campo) =>
            String(perfil[campo] ?? "").trim().length > 0
    );

    const cepValido =
        String(perfil.cep ?? "")
            .replace(/\D/g, "")
            .length === 8;

    return todosPreenchidos && cepValido;
}

function profissaoDoServico(servico: string): string {
    if (servico === "Pediatria") {
        return "Pediatra";
    }

    if (servico === "Odontologia") {
        return "Dentista";
    }

    return "Clínico geral";
}

function agendamentoEstaAtivo(
    status: string | undefined
): boolean {
    const statusNormalizado = String(status ?? "")
        .trim()
        .toLocaleLowerCase("pt-BR");

    return ![
        "cancelado",
        "concluido",
        "concluído",
        "finalizado",
    ].includes(statusNormalizado);
}

function agendamentoEstaNoHistorico(
    status: string | undefined
): boolean {
    return !agendamentoEstaAtivo(status);
}

function statusParaExibicao(status: string): string {
    const normalizado = String(status ?? "")
        .trim()
        .toLocaleLowerCase("pt-BR");

    if (normalizado === "cancelado") {
        return "Cancelada";
    }

    if (
        normalizado === "concluido" ||
        normalizado === "concluído" ||
        normalizado === "finalizado"
    ) {
        return "Concluída";
    }

    if (normalizado === "agendado") {
        return "Agendada";
    }

    return status || "Não informado";
}

// ============================================================
// PÁGINA
// ============================================================

export default function AgendamentosPage() {
    const router = useRouter();

    // ----------------------------------------------------------
    // ESTADOS GERAIS
    // ----------------------------------------------------------

    const [usuario, setUsuario] = useState<User | null>(null);

    const [perfil, setPerfil] = useState<Perfil>({});

    const [etapa, setEtapa] = useState<Etapa>("carregando");

    const [carregando, setCarregando] = useState(true);

    const [salvando, setSalvando] = useState(false);

    const [agendamentos, setAgendamentos] = useState<
        Agendamento[]
    >([]);

    const [mensagem, setMensagem] = useState("");

    const [erro, setErro] = useState("");

    const temporizadorRedirecionamento = useRef<
        ReturnType<typeof setTimeout> | null
    >(null);

    // ----------------------------------------------------------
    // ESTADOS DO AGENDAMENTO
    // ----------------------------------------------------------

    const [servico, setServico] = useState("Consulta médica");

    const [periodo, setPeriodo] = useState<Periodo>("Manhã");

    const [profissao, setProfissao] = useState("Clínico geral");

    const [medico, setMedico] = useState("");

    const [diaSelecionado, setDiaSelecionado] = useState("");

    const [horarioSelecionado, setHorarioSelecionado] =
        useState("");
    const [horariosOcupados, setHorariosOcupados] = useState<string[]>([]);
    const [consultandoHorarios, setConsultandoHorarios] = useState(false);
    const [falhaDisponibilidade, setFalhaDisponibilidade] = useState(false);
    const consultaDisponibilidadeId = useRef(0);

    // ----------------------------------------------------------
    // DADOS CALCULADOS
    // ----------------------------------------------------------

    const dias = useMemo(() => gerarDias(), []);

    const servicosDisponiveis = servicosPorPeriodo[periodo];

    const horariosDisponiveis = horariosPorPeriodo[periodo];

    const profissoesDisponiveis = profissoesPorPeriodo[periodo];

    const profissionaisDisponiveis =
        profissionaisPorProfissao[profissao] ?? [];

    const agendamentosAtivos = useMemo(() => {
        return agendamentos
            .filter((item) => agendamentoEstaAtivo(item.status))
            .sort((a, b) => {
                const dataA = `${a.dia} ${a.horario}`;
                const dataB = `${b.dia} ${b.horario}`;

                return dataA.localeCompare(dataB);
            });
    }, [agendamentos]);

    const agendamentosHistorico = useMemo(() => {
        return agendamentos
            .filter((item) =>
                agendamentoEstaNoHistorico(item.status)
            )
            .sort((a, b) => {
                const dataA = `${a.dia} ${a.horario}`;
                const dataB = `${b.dia} ${b.horario}`;

                return dataB.localeCompare(dataA);
            });
    }, [agendamentos]);

    // ----------------------------------------------------------
    // TEMPORIZADORES
    // ----------------------------------------------------------

    useEffect(() => {
        if (!mensagem && !erro) {
            return;
        }

        const temporizador = window.setTimeout(() => {
            setMensagem("");
            setErro("");
        }, 5000);

        return () => {
            window.clearTimeout(temporizador);
        };
    }, [mensagem, erro]);

    useEffect(() => {
        return () => {
            if (temporizadorRedirecionamento.current) {
                clearTimeout(temporizadorRedirecionamento.current);
            }
        };
    }, []);

    // ----------------------------------------------------------
    // AUTENTICAÇÃO E FIRESTORE
    // ----------------------------------------------------------

    useEffect(() => {
        let ativo = true;

        let cancelarAgendamentos:
            | (() => void)
            | undefined;

        const cancelarAuth = onAuthStateChanged(
            auth,
            async (user) => {
                cancelarAgendamentos?.();
                cancelarAgendamentos = undefined;

                if (!user) {
                    if (!ativo) {
                        return;
                    }

                    setUsuario(null);
                    setAgendamentos([]);
                    setCarregando(false);

                    router.replace("/entrar");
                    return;
                }

                if (!ativo) {
                    return;
                }

                setCarregando(true);
                setErro("");

                try {
                    const resultadoPerfil = await getDoc(
                        doc(db, "usuarios", user.uid)
                    );

                    if (!ativo) {
                        return;
                    }

                    const dadosPerfil: Perfil =
                        resultadoPerfil.exists()
                            ? (resultadoPerfil.data() as Perfil)
                            : {};

                    const perfilCarregado: Perfil = {
                        ...dadosPerfil,
                        email:
                            user.email ??
                            dadosPerfil.email ??
                            "",
                        nome:
                            dadosPerfil.nome ??
                            user.displayName ??
                            "",
                    };

                    setUsuario(user);
                    setPerfil(perfilCarregado);

                    setEtapa(
                        perfilEstaCompleto(perfilCarregado)
                            ? "inicio"
                            : "perfil"
                    );

                    cancelarAgendamentos = onSnapshot(
                        collection(
                            db,
                            "usuarios",
                            user.uid,
                            "agendamentos"
                        ),
                        (resultado) => {
                            if (!ativo) {
                                return;
                            }

                            const lista: Agendamento[] =
                                resultado.docs.map((item) => ({
                                    ...(item.data() as Omit<
                                        Agendamento,
                                        "id"
                                    >),
                                    id: item.id,
                                }));

                            setAgendamentos(lista);
                            setCarregando(false);
                        },
                        (erroFirebase) => {
                            console.error(
                                "Erro ao carregar agendamentos:",
                                erroFirebase
                            );

                            if (!ativo) {
                                return;
                            }

                            setErro(
                                "Não foi possível carregar seus agendamentos. Verifique as permissões do Firestore."
                            );

                            setCarregando(false);
                        }
                    );
                } catch (erroFirebase) {
                    console.error(
                        "Erro ao carregar perfil:",
                        erroFirebase
                    );

                    if (!ativo) {
                        return;
                    }

                    setErro(
                        "Não foi possível carregar seus dados."
                    );

                    setCarregando(false);
                }
            }
        );

        return () => {
            ativo = false;

            cancelarAuth();
            cancelarAgendamentos?.();
        };
    }, [router]);

    // ----------------------------------------------------------
    // PERFIL
    // ----------------------------------------------------------

    const atualizarPerfil = (
        campo: keyof Perfil,
        valor: string
    ) => {
        setPerfil((anterior) => ({
            ...anterior,
            [campo]: valor,
        }));
    };

    const salvarPerfil = async () => {
        setErro("");
        setMensagem("");

        if (!usuario) {
            router.replace("/entrar");
            return;
        }

        const faltando = camposObrigatoriosPerfil.some(
            (campo) =>
                !String(perfil[campo] ?? "").trim()
        );

        if (faltando) {
            setErro(
                "Preencha todos os campos obrigatórios do perfil."
            );
            return;
        }

        const cepValido =
            String(perfil.cep ?? "")
                .replace(/\D/g, "")
                .length === 8;

        if (!cepValido) {
            setErro(
                "Informe um CEP válido com oito números."
            );
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
                {
                    merge: true,
                }
            );

            setMensagem("Seus dados foram salvos.");
            setEtapa("inicio");
        } catch (erroFirebase) {
            console.error(
                "Erro ao salvar perfil:",
                erroFirebase
            );

            setErro(
                "Não foi possível salvar seus dados. Verifique as regras do Firestore."
            );
        } finally {
            setSalvando(false);
        }
    };

    // ----------------------------------------------------------
    // SELEÇÃO DO ATENDIMENTO
    // ----------------------------------------------------------

    const selecionarPeriodo = (
        novoPeriodo: Periodo
    ) => {
        const servicos =
            servicosPorPeriodo[novoPeriodo];

        const servicoInicial = servicos[0];

        const profissaoInicial =
            profissaoDoServico(servicoInicial);

        const profissoes =
            profissoesPorPeriodo[novoPeriodo];

        setPeriodo(novoPeriodo);
        setServico(servicoInicial);

        setProfissao(
            profissoes.includes(profissaoInicial)
                ? profissaoInicial
                : profissoes[0]
        );

        setMedico("");
        setDiaSelecionado("");
        setHorarioSelecionado("");

        setMensagem("");
        setErro("");
    };

    const selecionarServico = (
        novoServico: string
    ) => {
        const novaProfissao =
            profissaoDoServico(novoServico);

        setServico(novoServico);

        setProfissao(
            profissoesDisponiveis.includes(novaProfissao)
                ? novaProfissao
                : profissoesDisponiveis[0]
        );

        setMedico("");
        setDiaSelecionado("");
        setHorarioSelecionado("");
        setErro("");
    };


    // ----------------------------------------------------------
    // DISPONIBILIDADE COMPARTILHADA DA UBS
    // ----------------------------------------------------------

    useEffect(() => {
        // Não apagar o horário quando avançar para o resumo.
        if (etapa !== "calendario") {
            return;
        }

        const id = ++consultaDisponibilidadeId.current;

        setHorariosOcupados([]);
        setHorarioSelecionado("");
        setFalhaDisponibilidade(false);

        if (!usuario || !medico || !diaSelecionado) {
            setConsultandoHorarios(false);
            return;
        }

        const controller = new AbortController();

        setConsultandoHorarios(true);

        const carregar = async () => {
            try {
                const token = await usuario.getIdToken();

                const parametros = new URLSearchParams({
                    medico,
                    dia: diaSelecionado,
                });

                const resposta = await fetch(
                    `/api/agendamentos/disponibilidade?${parametros}`,
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                        cache: "no-store",
                        signal: controller.signal,
                    }
                );

                if (!resposta.ok) {
                    const dadosErro = await resposta.json().catch(() => null);

                    throw new Error(
                        dadosErro?.erro ||
                        `Erro HTTP ${resposta.status} ao consultar horários.`
                    );
                }

                const dados = await resposta.json();

                if (
                    controller.signal.aborted ||
                    id !== consultaDisponibilidadeId.current
                ) {
                    return;
                }

                const ocupados: string[] =
                    Array.isArray(dados.horariosOcupados)
                        ? dados.horariosOcupados.filter(
                            (horario: unknown): horario is string =>
                                typeof horario === "string"
                        )
                        : [];

                setHorariosOcupados(ocupados);

                // Impede manter selecionado um horário ocupado.
                setHorarioSelecionado((anterior) =>
                    ocupados.includes(anterior) ? "" : anterior
                );

                setFalhaDisponibilidade(false);
            } catch (erroConsulta) {
                if (
                    controller.signal.aborted ||
                    id !== consultaDisponibilidadeId.current
                ) {
                    return;
                }

                console.error(
                    "Erro ao consultar disponibilidade:",
                    erroConsulta
                );

                setFalhaDisponibilidade(true);
            } finally {
                if (
                    !controller.signal.aborted &&
                    id === consultaDisponibilidadeId.current
                ) {
                    setConsultandoHorarios(false);
                }
            }
        };

        void carregar();

        return () => {
            controller.abort();
        };
    }, [usuario, medico, diaSelecionado, etapa]);

    // Verifica se o horário já está reservado.
    const horarioOcupado = (horario: string): boolean =>
        horariosOcupados.includes(horario);

    // Os horários são consultados quando a data é selecionada.
    // A disponibilidade de todos os dias ainda não é verificada.
    const diaTemHorario = (_dia: string): boolean => true;


    // ----------------------------------------------------------
    // CONFIRMAR AGENDAMENTO
    // ----------------------------------------------------------

    const agendar = async () => {
        setErro("");
        setMensagem("");

        if (!usuario) {
            router.replace("/entrar");
            return;
        }

        if (
            !servico ||
            !profissao ||
            !medico.trim() ||
            !diaSelecionado ||
            !horarioSelecionado
        ) {
            setErro(
                "Selecione o atendimento, a especialidade, o profissional, o dia e o horário."
            );
            return;
        }

        const unidadeReferencia = String(
            perfil.unidadeReferencia ?? ""
        ).trim();

        if (!unidadeReferencia) {
            setErro(
                "Não identificamos sua UBS de referência no cadastro. Atualize seu perfil ou entre em contato com a unidade de saúde antes de agendar."
            );
            return;
        }

        if (
            !servicosPorPeriodo[periodo].includes(servico) ||
            !profissoesPorPeriodo[periodo].includes(profissao) ||
            !profissionaisDisponiveis.includes(medico) ||
            !horariosPorPeriodo[periodo].includes(horarioSelecionado)
        ) {
            setErro(
                "A seleção do atendimento não é válida. Escolha novamente o serviço, o profissional e o horário."
            );
            return;
        }

        if (horarioOcupado(horarioSelecionado)) {
            setErro(
                "Esse horário já está reservado. Escolha outro."
            );
            return;
        }

        if (!dias.includes(diaSelecionado)) {
            setErro(
                "Escolha uma data disponível no calendário."
            );
            return;
        }

        if (consultandoHorarios || falhaDisponibilidade) {
            setErro("Aguarde a consulta dos horários disponíveis antes de confirmar.");
            return;
        }

        try {
            setSalvando(true);
            const token = await usuario.getIdToken();
            const resposta = await fetch("/api/agendamentos/reservar", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    servico,
                    periodo,
                    medico: medico.trim(),
                    dia: diaSelecionado,
                    horario: horarioSelecionado,
                }),
            });
            const dados = await resposta.json();
            if (!resposta.ok) {
                setErro(dados.erro || "Não foi possível confirmar a consulta.");
                setEtapa("calendario");
                return;
            }

            setMensagem(
                "Agendamento confirmado! Você será redirecionado à tela inicial."
            );

            setHorarioSelecionado("");

            if (
                temporizadorRedirecionamento.current
            ) {
                clearTimeout(
                    temporizadorRedirecionamento.current
                );
            }

            temporizadorRedirecionamento.current =
                setTimeout(() => {
                    router.push("/dashboard");
                }, 5000);
        } catch (erroFirebase) {
            console.error(
                "Erro ao salvar agendamento:",
                erroFirebase
            );

            setErro(
                "Não foi possível registrar o agendamento. Confira sua conexão e as regras do Firestore."
            );
        } finally {
            setSalvando(false);
        }
    };

    // ----------------------------------------------------------
    // CANCELAR AGENDAMENTO SEM EXCLUIR O HISTÓRICO
    // ----------------------------------------------------------

    const cancelarAgendamento = async (
        id: string
    ) => {
        if (!usuario) {
            router.replace("/entrar");
            return;
        }

        setErro("");
        setMensagem("");

        try {
            setSalvando(true);
            const token = await usuario.getIdToken();
            const resposta = await fetch("/api/agendamentos/cancelar", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ agendamentoId: id }),
            });
            const tipoConteudo = resposta.headers.get("content-type") || "";

            if (!tipoConteudo.includes("application/json")) {
                throw new Error(
                    `A API de cancelamento retornou um erro HTTP ${resposta.status}. Verifique o terminal do Next.js.`
                );
            }

            const dados = await resposta.json();
            if (!resposta.ok) {
                setErro(dados.erro || "Não foi possível cancelar o agendamento.");
                return;
            }

            setMensagem(
                "Agendamento cancelado com sucesso. O registro foi mantido no histórico."
            );
        } catch (erroFirebase) {
            console.error(
                "Erro ao cancelar agendamento:",
                erroFirebase
            );

            setErro(
                "Não foi possível cancelar o agendamento. Verifique sua conexão e as permissões do Firestore."
            );
        } finally {
            setSalvando(false);
        }
    };

    // ----------------------------------------------------------
    // ESTILOS REUTILIZÁVEIS
    // ----------------------------------------------------------

    const campoClasse =
        "mt-1 w-full rounded-xl border border-[#D1D5DB] bg-white px-4 py-3 text-sm text-[#111827] outline-none focus:border-[#007DB8] focus:ring-2 focus:ring-[#8ED3F5]/50";

    const labelClasse =
        "block text-sm font-bold text-[#111827]";

    const botaoPrimario =
        "rounded-xl bg-[#007DB8] px-6 py-3 text-sm font-extrabold text-white transition hover:bg-[#005F8F] disabled:cursor-not-allowed disabled:opacity-50";

    const botaoSecundario =
        "rounded-xl border border-[#D1D5DB] px-5 py-3 text-sm font-bold text-[#005F8F] transition hover:border-[#007DB8]";

    // ============================================================
    // INTERFACE
    // ============================================================

    return (
        <div className="min-h-screen bg-[#F5F7FA]">
            <Header />

            <Navigation />

            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
                {/* ================================================== */}
                {/* CABEÇALHO */}
                {/* ================================================== */}

                <div className="mb-7">
                    <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#007DB8]">
                        Saúde Vale+
                    </p>

                    <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#005F8F] sm:text-4xl">
                        Agendamentos
                    </h1>

                    <p className="mt-2 text-sm text-[#111827]/65 sm:text-base">
                        Agende consultas, acompanhe seus atendimentos e
                        consulte seu histórico. Sua UBS é definida
                        automaticamente pelo cadastro.
                    </p>
                </div>

                {/* ================================================== */}
                {/* NOTIFICAÇÕES */}
                {/* ================================================== */}

                {(mensagem || erro) && (
                    <div
                        role={erro ? "alert" : "status"}
                        aria-live={
                            erro ? "assertive" : "polite"
                        }
                        className={`fixed left-1/2 top-4 z-[100] flex w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg ${erro
                            ? "border-red-200 bg-red-50 text-red-700"
                            : "border-green-200 bg-green-50 text-green-800"
                            }`}
                    >
                        <span className="flex-1">
                            {erro || mensagem}
                        </span>

                        <button
                            type="button"
                            aria-label="Fechar notificação"
                            onClick={() => {
                                const sucessoAgendamento =
                                    mensagem.startsWith(
                                        "Agendamento confirmado!"
                                    );

                                setMensagem("");
                                setErro("");

                                if (sucessoAgendamento) {
                                    if (
                                        temporizadorRedirecionamento.current
                                    ) {
                                        clearTimeout(
                                            temporizadorRedirecionamento.current
                                        );
                                    }

                                    router.push("/dashboard");
                                }
                            }}
                            className="-mr-1 -mt-1 rounded-md px-2 py-1 text-lg font-bold leading-none hover:bg-black/5"
                        >
                            ×
                        </button>
                    </div>
                )}

                {/* ================================================== */}
                {/* CARREGAMENTO */}
                {/* ================================================== */}

                {carregando ||
                    etapa === "carregando" ? (
                    <section className="rounded-3xl border border-[#D1D5DB] bg-white p-8">
                        <p className="text-sm text-[#374151]">
                            Carregando seus dados e agendamentos...
                        </p>
                    </section>

                    /* ================================================== */
                    /* PERFIL */
                    /* ================================================== */

                ) : etapa === "perfil" ? (
                    <section className="rounded-3xl border border-[#D1D5DB] bg-white p-6 shadow-sm sm:p-8">
                        <h2 className="text-2xl font-extrabold text-[#005F8F]">
                            Complete seus dados
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-[#111827]/65">
                            Precisamos destas informações para continuar.
                            Depois de salvar, você poderá alterar seus
                            dados pela página Perfil.
                        </p>

                        <div className="mt-7 grid gap-5 sm:grid-cols-2">
                            {(
                                [
                                    ["nome", "Nome completo"],
                                    ["cpf", "CPF"],
                                    ["telefone", "Telefone"],
                                    [
                                        "dataNascimento",
                                        "Data de nascimento",
                                    ],
                                    ["cartaoSus", "Cartão SUS"],
                                    ["cep", "CEP"],
                                    ["rua", "Rua ou avenida"],
                                    ["numero", "Número"],
                                    ["bairro", "Bairro"],
                                    ["cidade", "Cidade"],
                                ] as [keyof Perfil, string][]
                            ).map(([campo, titulo]) => (
                                <div key={campo}>
                                    <label
                                        htmlFor={`perfil-${campo}`}
                                        className={labelClasse}
                                    >
                                        {titulo} *
                                    </label>

                                    <input
                                        id={`perfil-${campo}`}
                                        type={
                                            campo === "dataNascimento"
                                                ? "date"
                                                : "text"
                                        }
                                        className={campoClasse}
                                        value={String(
                                            perfil[campo] ?? ""
                                        )}
                                        onChange={(e) =>
                                            atualizarPerfil(
                                                campo,
                                                e.target.value
                                            )
                                        }
                                        inputMode={
                                            [
                                                "cpf",
                                                "telefone",
                                                "cartaoSus",
                                                "cep",
                                            ].includes(campo)
                                                ? "numeric"
                                                : undefined
                                        }
                                    />
                                </div>
                            ))}

                            <div>
                                <label
                                    htmlFor="perfil-email"
                                    className={labelClasse}
                                >
                                    E-mail
                                </label>

                                <input
                                    id="perfil-email"
                                    className={`${campoClasse} bg-[#F5F7FA]`}
                                    value={
                                        usuario?.email ?? ""
                                    }
                                    readOnly
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="perfil-unidade"
                                    className={labelClasse}
                                >
                                    Unidade de referência
                                </label>

                                <input
                                    id="perfil-unidade"
                                    className={`${campoClasse} bg-[#F5F7FA]`}
                                    value={
                                        perfil.unidadeReferencia ??
                                        ""
                                    }
                                    readOnly
                                    placeholder="A confirmar"
                                />
                            </div>
                        </div>

                        <div className="mt-7 flex flex-wrap gap-3">
                            <button
                                type="button"
                                onClick={salvarPerfil}
                                disabled={salvando}
                                className={botaoPrimario}
                            >
                                {salvando
                                    ? "Salvando..."
                                    : "Salvar e continuar"}
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    setEtapa("inicio")
                                }
                                className={botaoSecundario}
                            >
                                Continuar sem alterar
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    router.push("/perfil")
                                }
                                className={botaoSecundario}
                            >
                                Abrir meu perfil
                            </button>
                        </div>
                    </section>

                    /* ================================================== */
                    /* TELA INICIAL */
                    /* ================================================== */

                ) : etapa === "inicio" ? (
                    <section className="mx-auto max-w-6xl rounded-3xl border border-[#D1D5DB] bg-white p-6 shadow-sm sm:p-8">
                        <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#007DB8]">
                            Bem-vindo ao Saúde Vale+
                        </p>

                        <h2 className="mt-2 text-2xl font-extrabold text-[#005F8F] sm:text-3xl">
                            Como podemos ajudar?
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-[#374151]">
                            Escolha uma das opções abaixo para
                            continuar.
                        </p>

                        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {/* MINHAS CONSULTAS */}

                            <button
                                type="button"
                                onClick={() => {
                                    setErro("");
                                    setMensagem("");
                                    setEtapa("consultas");
                                }}
                                className="rounded-2xl border-2 border-[#007DB8] bg-[#E8F5FC] p-6 text-left transition hover:-translate-y-0.5 hover:bg-[#D9F0FC] hover:shadow-md focus:outline-none focus:ring-4 focus:ring-[#8ED3F5]/60"
                            >
                                <span
                                    className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#007DB8] text-2xl text-white"
                                    aria-hidden="true"
                                >
                                    ▤
                                </span>

                                <span className="mt-4 block text-xl font-extrabold text-[#005F8F]">
                                    Minhas consultas
                                </span>

                                <span className="mt-2 block text-sm leading-5 text-[#374151]">
                                    Consulte seus agendamentos ativos
                                    e cancele quando necessário.
                                </span>

                                <span className="mt-4 inline-flex rounded-full bg-white px-3 py-1 text-xs font-bold text-[#005F8F]">
                                    {agendamentosAtivos.length} ativa(s)
                                    {" · "}Acessar →
                                </span>
                            </button>

                            {/* AGENDAR CONSULTA */}

                            <button
                                type="button"
                                onClick={() => {
                                    setErro("");
                                    setMensagem("");
                                    setEtapa("atendimento");
                                }}
                                className="rounded-2xl border-2 border-[#007DB8] bg-[#007DB8] p-6 text-left transition hover:-translate-y-0.5 hover:bg-[#005F8F] hover:shadow-md focus:outline-none focus:ring-4 focus:ring-[#8ED3F5]/60"
                            >
                                <span
                                    className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-2xl text-[#005F8F]"
                                    aria-hidden="true"
                                >
                                    ＋
                                </span>

                                <span className="mt-4 block text-xl font-extrabold text-white">
                                    Agendar consulta
                                </span>

                                <span className="mt-2 block text-sm leading-5 text-white/90">
                                    Escolha o atendimento, o profissional,
                                    a data e o horário.
                                </span>

                                <span className="mt-4 inline-flex rounded-full bg-white px-3 py-1 text-xs font-bold text-[#005F8F]">
                                    Começar agendamento →
                                </span>
                            </button>

                            {/* HISTÓRICO */}

                            <button
                                type="button"
                                onClick={() => {
                                    setErro("");
                                    setMensagem("");
                                    setEtapa("historico");
                                }}
                                className="rounded-2xl border-2 border-[#D1D5DB] bg-white p-6 text-left transition hover:-translate-y-0.5 hover:border-[#007DB8] hover:shadow-md focus:outline-none focus:ring-4 focus:ring-[#8ED3F5]/60"
                            >
                                <span
                                    className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F5F7FA] text-2xl text-[#005F8F]"
                                    aria-hidden="true"
                                >
                                    ↻
                                </span>

                                <span className="mt-4 block text-xl font-extrabold text-[#005F8F]">
                                    Histórico de consultas
                                </span>

                                <span className="mt-2 block text-sm leading-5 text-[#374151]">
                                    Veja os atendimentos cancelados
                                    ou concluídos anteriormente.
                                </span>

                                <span className="mt-4 inline-flex rounded-full bg-[#F5F7FA] px-3 py-1 text-xs font-bold text-[#005F8F]">
                                    {agendamentosHistorico.length} registro(s)
                                    {" · "}Acessar →
                                </span>
                            </button>
                        </div>
                    </section>

                    /* ================================================== */
                    /* ETAPA 1 - ATENDIMENTO */
                    /* ================================================== */

                ) : etapa === "atendimento" ? (
                    <div className="mx-auto max-w-4xl">
                        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                            <button
                                type="button"
                                onClick={() =>
                                    setEtapa("inicio")
                                }
                                className="text-sm font-bold text-[#007DB8] hover:underline"
                            >
                                ← Voltar às opções
                            </button>

                            <span className="rounded-full bg-[#E8F5FC] px-4 py-2 text-xs font-extrabold text-[#005F8F]">
                                Etapa 1 de 3 · Atendimento
                            </span>
                        </div>

                        <section className="rounded-3xl border border-[#D1D5DB] bg-white p-5 shadow-sm sm:p-8">
                            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#007DB8]">
                                Atendimento
                            </p>

                            <h2 className="mt-2 text-2xl font-extrabold text-[#005F8F]">
                                O que você precisa?
                            </h2>

                            <p className="mt-2 text-sm text-[#374151]">
                                Escolha o período, o tipo de
                                atendimento e o profissional.
                            </p>

                            {/* PERÍODO */}

                            <div className="mt-6">
                                <p className={labelClasse}>
                                    Período
                                </p>

                                <div className="mt-2 grid grid-cols-2 gap-3">
                                    {(
                                        [
                                            "Manhã",
                                            "Tarde",
                                        ] as Periodo[]
                                    ).map((item) => (
                                        <button
                                            key={item}
                                            type="button"
                                            onClick={() =>
                                                selecionarPeriodo(item)
                                            }
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
                                    Gestantes que estiverem passando
                                    mal devem procurar orientação
                                    presencial na unidade de saúde.
                                    Em caso de emergência, procure
                                    atendimento de urgência.
                                </p>
                            )}

                            {/* TIPO DE ATENDIMENTO */}

                            <div className="mt-5">
                                <label
                                    htmlFor="tipo-atendimento"
                                    className={labelClasse}
                                >
                                    Tipo de atendimento
                                </label>

                                <select
                                    id="tipo-atendimento"
                                    className={campoClasse}
                                    value={servico}
                                    onChange={(e) =>
                                        selecionarServico(
                                            e.target.value
                                        )
                                    }
                                >
                                    {servicosDisponiveis.map(
                                        (item) => (
                                            <option
                                                key={item}
                                                value={item}
                                            >
                                                {item}
                                            </option>
                                        )
                                    )}
                                </select>
                            </div>

                            {/* PROFISSIONAIS */}

                            <div className="mt-5">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <p className={labelClasse}>
                                        Profissional
                                    </p>

                                    <span className="text-xs text-[#6B7280]">
                                        {profissionaisDisponiveis.length} encontrados
                                    </span>
                                </div>

                                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                                    {profissionaisDisponiveis.map(
                                        (item) => {
                                            const selecionado =
                                                medico === item;

                                            return (
                                                <button
                                                    key={item}
                                                    type="button"
                                                    onClick={() => {
                                                        setMedico(item);
                                                        setDiaSelecionado("");
                                                        setHorarioSelecionado("");
                                                        setErro("");
                                                    }}
                                                    className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition ${selecionado
                                                        ? "border-[#007DB8] bg-[#E8F5FC] ring-1 ring-[#007DB8]"
                                                        : "border-[#D1D5DB] bg-white hover:border-[#8ED3F5]"
                                                        }`}
                                                >
                                                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#E8F5FC] text-xs font-extrabold text-[#005F8F]">
                                                        {item
                                                            .split(" ")
                                                            .map(
                                                                (parte) =>
                                                                    parte[0]
                                                            )
                                                            .slice(0, 2)
                                                            .join("")}
                                                    </span>

                                                    <span className="min-w-0 flex-1">
                                                        <span className="block text-sm font-bold text-[#111827]">
                                                            {item}
                                                        </span>

                                                        <span className="mt-0.5 block text-xs text-[#6B7280]">
                                                            {profissao}
                                                        </span>
                                                    </span>

                                                    {selecionado && (
                                                        <span className="text-sm font-extrabold text-[#007DB8]">
                                                            ✓
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        }
                                    )}
                                </div>

                                <p className="mt-3 text-xs leading-5 text-[#6B7280]">
                                    Os profissionais são exemplos
                                    demonstrativos. A lista oficial
                                    deverá ser cadastrada pela
                                    unidade de saúde.
                                </p>
                            </div>

                            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setEtapa("inicio")
                                    }
                                    className={botaoSecundario}
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="button"
                                    disabled={
                                        !medico || salvando
                                    }
                                    onClick={() =>
                                        setEtapa("calendario")
                                    }
                                    className={botaoPrimario}
                                >
                                    Continuar para calendário →
                                </button>
                            </div>
                        </section>
                    </div>

                    /* ================================================== */
                    /* ETAPA 2 - CALENDÁRIO */
                    /* ================================================== */

                ) : etapa === "calendario" ? (
                    <div className="mx-auto max-w-4xl">
                        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                            <button
                                type="button"
                                onClick={() =>
                                    setEtapa("atendimento")
                                }
                                className="text-sm font-bold text-[#007DB8] hover:underline"
                            >
                                ← Voltar ao atendimento
                            </button>

                            <span className="rounded-full bg-[#E8F5FC] px-4 py-2 text-xs font-extrabold text-[#005F8F]">
                                Etapa 2 de 3 · Data e horário
                            </span>
                        </div>

                        {/* RESUMO DO ATENDIMENTO */}

                        <section className="mb-5 rounded-2xl bg-[#005F8F] p-5 text-white shadow-sm">
                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/75">
                                Atendimento escolhido
                            </p>

                            <h2 className="mt-1 text-xl font-extrabold">
                                {servico}
                            </h2>

                            <p className="mt-1 text-sm text-white/85">
                                {medico} · {profissao} · {periodo}
                            </p>
                        </section>

                        <section className="rounded-3xl border border-[#D1D5DB] bg-white p-5 shadow-sm sm:p-8">
                            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#007DB8]">
                                Calendário
                            </p>

                            <h2 className="mt-2 text-2xl font-extrabold text-[#005F8F]">
                                Escolha o dia
                            </h2>

                            <p className="mt-2 text-sm text-[#374151]">
                                Selecione uma data e depois
                                escolha um horário.
                            </p>

                            {/* DIAS */}

                            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                                {dias.map((dia) => {
                                    const curto =
                                        formatarDiaCurto(dia);

                                    const disponivel =
                                        diaTemHorario(dia);

                                    const selecionado =
                                        diaSelecionado === dia;

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
                                                    ? "border-[#D1D5DB] bg-white text-[#005F8F] hover:border-[#007DB8]"
                                                    : "cursor-not-allowed border-red-200 bg-red-50 text-red-600"
                                                }`}
                                        >
                                            <span className="block text-xs font-semibold capitalize">
                                                {curto.semana}
                                            </span>

                                            <span className="mt-1 block text-lg font-extrabold">
                                                {curto.data}
                                            </span>

                                            <span
                                                className={`mt-1 block text-[10px] ${selecionado
                                                    ? "text-white/85"
                                                    : ""
                                                    }`}
                                            >
                                                {disponivel
                                                    ? "Consultar horários"
                                                    : "Sem horários"}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* HORÁRIOS */}

                            <div className="mt-7 border-t border-[#E5E7EB] pt-6">
                                <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#007DB8]">
                                    Horários
                                </p>

                                <h3 className="mt-1 text-xl font-extrabold text-[#111827]">
                                    {diaSelecionado
                                        ? formatarData(
                                            diaSelecionado
                                        )
                                        : "Escolha um dia primeiro"}
                                </h3>

                                {!diaSelecionado ? (
                                    <p className="mt-3 rounded-xl bg-[#F5F7FA] p-4 text-sm text-[#6B7280]">
                                        Os horários aparecerão
                                        depois que você selecionar
                                        uma data.
                                    </p>
                                ) : consultandoHorarios ? (
                                    <p className="mt-3 text-sm text-[#374151]">Consultando horários da UBS...</p>
                                ) : falhaDisponibilidade ? (
                                    <p role="alert" className="mt-3 rounded-xl bg-red-50 p-4 text-sm text-red-700">Não foi possível verificar a disponibilidade. Selecione a data novamente para tentar.</p>
                                ) : (
                                    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                                        {horariosDisponiveis.map(
                                            (horario) => {
                                                const ocupado =
                                                    horarioOcupado(
                                                        horario
                                                    );

                                                const selecionado =
                                                    horarioSelecionado ===
                                                    horario;

                                                return (
                                                    <button
                                                        key={horario}
                                                        type="button"
                                                        disabled={ocupado}
                                                        onClick={() =>
                                                            setHorarioSelecionado(
                                                                horario
                                                            )
                                                        }
                                                        className={`rounded-xl border px-3 py-3 text-sm font-extrabold transition ${ocupado
                                                            ? "cursor-not-allowed border-red-200 bg-red-50 text-red-500"
                                                            : selecionado
                                                                ? "border-[#007DB8] bg-[#007DB8] text-white"
                                                                : "border-green-200 bg-green-50 text-green-800 hover:border-green-400"
                                                            }`}
                                                    >
                                                        <span className="block">
                                                            {horario}
                                                        </span>

                                                        <span className="mt-1 block text-[10px] font-medium">
                                                            {ocupado
                                                                ? "Ocupado"
                                                                : selecionado
                                                                    ? "Selecionado"
                                                                    : "Disponível"}
                                                        </span>
                                                    </button>
                                                );
                                            }
                                        )}
                                    </div>
                                )}
                            </div>

                            <p className="mt-4 text-xs leading-5 text-[#6B7280]">
                                Disponibilidade consultada na UBS de referência. A confirmação final ocorre no servidor. Os médicos e horários ainda são demonstrativos.
                            </p>

                            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setEtapa("atendimento")
                                    }
                                    className={botaoSecundario}
                                >
                                    Voltar
                                </button>

                                <button
                                    type="button"
                                    disabled={
                                        !diaSelecionado ||
                                        !horarioSelecionado || consultandoHorarios || falhaDisponibilidade
                                    }
                                    onClick={() =>
                                        setEtapa("resumo")
                                    }
                                    className={botaoPrimario}
                                >
                                    Continuar para confirmação →
                                </button>
                            </div>
                        </section>
                    </div>

                    /* ================================================== */
                    /* ETAPA 3 - RESUMO */
                    /* ================================================== */

                ) : etapa === "resumo" ? (
                    <div className="mx-auto max-w-3xl">
                        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                            <button
                                type="button"
                                onClick={() =>
                                    setEtapa("calendario")
                                }
                                className="text-sm font-bold text-[#007DB8] hover:underline"
                            >
                                ← Voltar à data e horário
                            </button>

                            <span className="rounded-full bg-[#E8F5FC] px-4 py-2 text-xs font-extrabold text-[#005F8F]">
                                Confirmação
                            </span>
                        </div>

                        <section className="rounded-3xl border border-[#D1D5DB] bg-white p-5 shadow-sm sm:p-8">
                            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#007DB8]">
                                Resumo
                            </p>

                            <h2 className="mt-2 text-2xl font-extrabold text-[#005F8F]">
                                Confira os dados da consulta
                            </h2>

                            <p className="mt-2 text-sm leading-6 text-[#374151]">
                                Verifique as informações abaixo
                                antes de confirmar seu agendamento.
                            </p>

                            <div className="mt-6 grid gap-3 sm:grid-cols-2">
                                {[
                                    [
                                        "UBS de referência",
                                        perfil.unidadeReferencia ||
                                        "Não cadastrada",
                                    ],
                                    [
                                        "Atendimento",
                                        servico ||
                                        "Não selecionado",
                                    ],
                                    [
                                        "Período",
                                        periodo,
                                    ],
                                    [
                                        "Profissional",
                                        medico ||
                                        "Não selecionado",
                                    ],
                                    [
                                        "Data",
                                        diaSelecionado
                                            ? formatarData(
                                                diaSelecionado
                                            )
                                            : "Não selecionada",
                                    ],
                                    [
                                        "Horário",
                                        horarioSelecionado ||
                                        "Não selecionado",
                                    ],
                                ].map(([titulo, valor]) => (
                                    <div
                                        key={titulo}
                                        className="rounded-xl bg-[#F5F7FA] p-4"
                                    >
                                        <p className="text-xs font-semibold text-[#6B7280]">
                                            {titulo}
                                        </p>

                                        <p className="mt-1 text-sm font-bold text-[#111827]">
                                            {valor}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setEtapa("calendario")
                                    }
                                    className={botaoSecundario}
                                >
                                    Editar data e horário
                                </button>

                                <button
                                    type="button"
                                    onClick={agendar}
                                    disabled={salvando}
                                    className={botaoPrimario}
                                >
                                    {salvando
                                        ? "Registrando..."
                                        : "Confirmar agendamento"}
                                </button>
                            </div>
                        </section>
                    </div>

                    /* ================================================== */
                    /* MINHAS CONSULTAS */
                    /* ================================================== */

                ) : etapa === "consultas" ? (
                    <section className="rounded-3xl border border-[#D1D5DB] bg-white p-6 shadow-sm sm:p-8">
                        <button
                            type="button"
                            onClick={() =>
                                setEtapa("inicio")
                            }
                            className="mb-5 text-sm font-bold text-[#007DB8] hover:underline"
                        >
                            ← Voltar às opções
                        </button>

                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#007DB8]">
                                    Seus agendamentos
                                </p>

                                <h2 className="mt-2 text-2xl font-extrabold text-[#005F8F]">
                                    Minhas consultas
                                </h2>

                                <p className="mt-2 text-sm text-[#374151]">
                                    Acompanhe seus agendamentos
                                    ativos.
                                </p>
                            </div>

                            <span className="rounded-full bg-[#E8F5FC] px-4 py-2 text-xs font-extrabold text-[#005F8F]">
                                {agendamentosAtivos.length} ativa(s)
                            </span>
                        </div>

                        <div className="mt-6 space-y-4">
                            {agendamentosAtivos.length ===
                                0 ? (
                                <div className="rounded-xl bg-[#F5F7FA] p-5">
                                    <p className="font-bold text-[#005F8F]">
                                        Nenhuma consulta ativa
                                    </p>

                                    <p className="mt-1 text-sm leading-6 text-[#6B7280]">
                                        Você não possui agendamentos
                                        ativos no momento.
                                    </p>
                                </div>
                            ) : (
                                agendamentosAtivos.map(
                                    (item) => (
                                        <article
                                            key={item.id}
                                            className="rounded-2xl border border-[#D1D5DB] bg-white p-5"
                                        >
                                            <div className="flex flex-wrap items-start justify-between gap-3">
                                                <div>
                                                    <h3 className="font-extrabold text-[#005F8F]">
                                                        {item.servico}
                                                    </h3>

                                                    <p className="mt-1 text-sm text-[#111827]/65">
                                                        {item.medico}
                                                        {item.profissao
                                                            ? ` · ${item.profissao}`
                                                            : ""}
                                                    </p>

                                                    <p className="mt-2 text-sm text-[#111827]/65">
                                                        {formatarData(
                                                            item.dia
                                                        )}{" "}
                                                        às {item.horario}
                                                    </p>

                                                    <p className="mt-2 text-xs text-[#111827]/60">
                                                        Período:{" "}
                                                        {item.periodo}
                                                    </p>

                                                    {item.unidadeReferencia && (
                                                        <p className="mt-1 text-xs text-[#111827]/60">
                                                            UBS:{" "}
                                                            {
                                                                item.unidadeReferencia
                                                            }
                                                        </p>
                                                    )}

                                                    <span className="mt-3 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-[#005F8F]">
                                                        {statusParaExibicao(
                                                            item.status
                                                        )}
                                                    </span>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        cancelarAgendamento(
                                                            item.id
                                                        )
                                                    }
                                                    disabled={salvando}
                                                    className="rounded-lg border border-red-200 px-3 py-2 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    {salvando
                                                        ? "Aguarde..."
                                                        : "Cancelar agendamento"}
                                                </button>
                                            </div>
                                        </article>
                                    )
                                )
                            )}
                        </div>

                        <div className="mt-7 flex flex-wrap gap-3">
                            <button
                                type="button"
                                onClick={() =>
                                    setEtapa("atendimento")
                                }
                                className={botaoPrimario}
                            >
                                Agendar consulta
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    setEtapa("historico")
                                }
                                className={botaoSecundario}
                            >
                                Ver histórico
                            </button>
                        </div>
                    </section>

                    /* ================================================== */
                    /* HISTÓRICO DE CONSULTAS */
                    /* ================================================== */

                ) : etapa === "historico" ? (
                    <section className="rounded-3xl border border-[#D1D5DB] bg-white p-6 shadow-sm sm:p-8">
                        <button
                            type="button"
                            onClick={() =>
                                setEtapa("inicio")
                            }
                            className="mb-5 text-sm font-bold text-[#007DB8] hover:underline"
                        >
                            ← Voltar às opções
                        </button>

                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#007DB8]">
                                    Seus registros
                                </p>

                                <h2 className="mt-2 text-2xl font-extrabold text-[#005F8F]">
                                    Histórico de consultas
                                </h2>

                                <p className="mt-2 text-sm leading-6 text-[#374151]">
                                    Consulte os agendamentos
                                    cancelados ou concluídos.
                                </p>
                            </div>

                            <span className="rounded-full bg-[#E8F5FC] px-4 py-2 text-xs font-extrabold text-[#005F8F]">
                                {agendamentosHistorico.length} registro(s)
                            </span>
                        </div>

                        <div className="mt-6 space-y-4">
                            {agendamentosHistorico.length ===
                                0 ? (
                                <div className="rounded-xl bg-[#F5F7FA] p-5">
                                    <p className="font-bold text-[#005F8F]">
                                        Nenhum registro no histórico
                                    </p>

                                    <p className="mt-1 text-sm leading-6 text-[#6B7280]">
                                        Quando uma consulta for
                                        cancelada ou marcada como
                                        concluída, ela aparecerá aqui.
                                    </p>
                                </div>
                            ) : (
                                agendamentosHistorico.map(
                                    (item) => {
                                        const cancelado =
                                            String(
                                                item.status ?? ""
                                            )
                                                .trim()
                                                .toLocaleLowerCase(
                                                    "pt-BR"
                                                ) === "cancelado";

                                        return (
                                            <article
                                                key={item.id}
                                                className="rounded-2xl border border-[#D1D5DB] bg-white p-5"
                                            >
                                                <div className="flex flex-wrap items-start justify-between gap-3">
                                                    <div>
                                                        <h3 className="font-extrabold text-[#005F8F]">
                                                            {item.servico ||
                                                                "Consulta"}
                                                        </h3>

                                                        <p className="mt-1 text-sm text-[#111827]/65">
                                                            {item.medico ||
                                                                "Profissional não informado"}
                                                            {item.profissao
                                                                ? ` · ${item.profissao}`
                                                                : ""}
                                                        </p>

                                                        <p className="mt-2 text-sm text-[#111827]/65">
                                                            {item.dia
                                                                ? formatarData(
                                                                    item.dia
                                                                )
                                                                : "Data não informada"}

                                                            {item.horario
                                                                ? ` às ${item.horario}`
                                                                : ""}
                                                        </p>

                                                        <p className="mt-2 text-xs text-[#111827]/60">
                                                            Período:{" "}
                                                            {item.periodo ||
                                                                "Não informado"}
                                                        </p>

                                                        {item.unidadeReferencia && (
                                                            <p className="mt-1 text-xs text-[#111827]/60">
                                                                UBS:{" "}
                                                                {
                                                                    item.unidadeReferencia
                                                                }
                                                            </p>
                                                        )}
                                                    </div>

                                                    <span
                                                        className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold ${cancelado
                                                            ? "bg-red-50 text-red-700"
                                                            : "bg-green-50 text-green-700"
                                                            }`}
                                                    >
                                                        {statusParaExibicao(
                                                            item.status
                                                        )}
                                                    </span>
                                                </div>
                                            </article>
                                        );
                                    }
                                )
                            )}
                        </div>

                        <div className="mt-7 flex flex-wrap gap-3">
                            <button
                                type="button"
                                onClick={() =>
                                    setEtapa("consultas")
                                }
                                className={botaoSecundario}
                            >
                                Ver consultas ativas
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    setEtapa("atendimento")
                                }
                                className={botaoPrimario}
                            >
                                Agendar consulta
                            </button>
                        </div>
                    </section>
                ) : null}
            </main>

            <Footer />
        </div>
    );
}