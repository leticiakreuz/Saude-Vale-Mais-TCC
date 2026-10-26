import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";

import { adminAuth, adminDb } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

const horariosPorPeriodo = {
    Manhã: ["07:30", "08:30", "10:30", "11:30"],
    Tarde: ["13:30", "14:30", "16:00"],
} as const;

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

const servicosPorPeriodo: Record<string, string[]> = {
    Manhã: [
        "Consulta médica",
        "Pediatria",
        "Odontologia",
        "Consulta de retorno",
        "Renovação de receita",
    ],
    Tarde: ["Odontologia", "Renovação de receita"],
};

function profissaoDoServico(servico: string): string {
    if (servico === "Pediatria") return "Pediatra";
    if (servico === "Odontologia") return "Dentista";

    return "Clínico geral";
}

function dataValida(dia: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dia)) {
        return false;
    }

    const [ano, mes, numeroDia] = dia.split("-").map(Number);

    const data = new Date(Date.UTC(ano, mes - 1, numeroDia));

    if (
        data.getUTCFullYear() !== ano ||
        data.getUTCMonth() !== mes - 1 ||
        data.getUTCDate() !== numeroDia
    ) {
        return false;
    }

    const diaSemana = data.getUTCDay();

    if (diaSemana === 0 || diaSemana === 6) {
        return false;
    }

    const hoje = new Date();

    const inicioHoje = Date.UTC(
        hoje.getFullYear(),
        hoje.getMonth(),
        hoje.getDate()
    );

    const diferencaDias =
        (data.getTime() - inicioHoje) / 86400000;

    return diferencaDias >= 0 && diferencaDias < 21;
}

function respostaErro(mensagem: string, status: number) {
    return NextResponse.json(
        { erro: mensagem },
        { status }
    );
}

export async function POST(request: NextRequest) {
    try {
        // Autenticação
        const authorization = request.headers.get("authorization");

        if (!authorization?.startsWith("Bearer ")) {
            return respostaErro("Usuário não autenticado.", 401);
        }

        const token = authorization.slice(7).trim();

        const usuario = await adminAuth.verifyIdToken(
            token,
            true
        );

        // Dados recebidos
        const corpo: unknown = await request.json();

        if (
            !corpo ||
            typeof corpo !== "object" ||
            Array.isArray(corpo)
        ) {
            return respostaErro("Dados inválidos.", 400);
        }

        const dados = corpo as Record<string, unknown>;

        const servico = dados.servico;
        const periodo = dados.periodo;
        const medico = dados.medico;
        const dia = dados.dia;
        const horario = dados.horario;

        if (
            typeof servico !== "string" ||
            typeof periodo !== "string" ||
            typeof medico !== "string" ||
            typeof dia !== "string" ||
            typeof horario !== "string"
        ) {
            return respostaErro(
                "Preencha todos os dados do agendamento.",
                400
            );
        }

        // Validar serviço e profissional
        if (!servicosPorPeriodo[periodo]?.includes(servico)) {
            return respostaErro(
                "Serviço indisponível neste período.",
                400
            );
        }

        const profissao = profissaoDoServico(servico);

        if (
            !profissionaisPorProfissao[profissao]?.includes(medico)
        ) {
            return respostaErro(
                "Profissional inválido para o atendimento.",
                400
            );
        }

        const horarios =
            horariosPorPeriodo[
            periodo as keyof typeof horariosPorPeriodo
            ];

        if (!horarios || !horarios.some((item) => item === horario)) {
            return respostaErro("Horário inválido.", 400);
        }

        if (!dataValida(dia)) {
            return respostaErro("Data indisponível.", 400);
        }

        // Buscar UBS no perfil do usuário
        const usuarioRef = adminDb
            .collection("usuarios")
            .doc(usuario.uid);

        const perfilSnapshot = await usuarioRef.get();

        if (!perfilSnapshot.exists) {
            return respostaErro(
                "Perfil do paciente não encontrado.",
                404
            );
        }

        const unidadeReferencia =
            perfilSnapshot.data()?.unidadeReferencia;

        if (
            typeof unidadeReferencia !== "string" ||
            !unidadeReferencia.trim()
        ) {
            return respostaErro(
                "UBS de referência não cadastrada.",
                400
            );
        }

        const unidade = unidadeReferencia.trim();

        // Identificador único da combinação
        // UBS + médico + data + horário
        const chaveHorario = JSON.stringify([
            unidade,
            medico,
            dia,
            horario,
        ]);

        const horarioId = createHash("sha256")
            .update(chaveHorario)
            .digest("hex");

        const reservaRef = adminDb
            .collection("horariosReservados")
            .doc(horarioId);

        const agendamentosRef = usuarioRef.collection(
            "agendamentos"
        );

        const novoAgendamentoRef = agendamentosRef.doc();

        const controleRef = usuarioRef
            .collection("controleAgendamento")
            .doc("ativo");

        // Transação: impede duas reservas do mesmo horário
        const resultado = await adminDb.runTransaction(
            async (transacao) => {
                const reservaSnapshot =
                    await transacao.get(reservaRef);

                const controleSnapshot =
                    await transacao.get(controleRef);

                const agendamentoAnteriorId =
                    controleSnapshot.exists
                        ? controleSnapshot.data()?.agendamentoId
                        : null;

                let agendamentoAnteriorAtivo = false;

                if (
                    typeof agendamentoAnteriorId === "string" &&
                    agendamentoAnteriorId
                ) {
                    const anteriorRef = agendamentosRef.doc(
                        agendamentoAnteriorId
                    );

                    const anteriorSnapshot =
                        await transacao.get(anteriorRef);

                    if (anteriorSnapshot.exists) {
                        const status = String(
                            anteriorSnapshot.data()?.status ?? ""
                        ).toLowerCase();

                        agendamentoAnteriorAtivo = ![
                            "cancelado",
                            "concluido",
                            "concluído",
                            "finalizado",
                        ].includes(status);
                    }
                }

                if (agendamentoAnteriorAtivo) {
                    return "consulta-ativa";
                }

                if (
                    reservaSnapshot.exists &&
                    reservaSnapshot.data()?.status === "reservado"
                ) {
                    return "horario-ocupado";
                }

                // Registrar a reserva compartilhada
                transacao.set(reservaRef, {
                    unidadeReferencia: unidade,
                    medico,
                    dia,
                    horario,
                    periodo,
                    pacienteId: usuario.uid,
                    agendamentoId: novoAgendamentoRef.id,
                    status: "reservado",
                    atualizadoEm: FieldValue.serverTimestamp(),
                });

                // Registrar a consulta no histórico do paciente
                transacao.set(novoAgendamentoRef, {
                    userId: usuario.uid,
                    servico,
                    periodo,
                    medico,
                    profissao,
                    dia,
                    horario,
                    unidadeReferencia: unidade,
                    reservaId: horarioId,
                    status: "agendado",
                    criadoEm: FieldValue.serverTimestamp(),
                });

                // Atualizar o controle de consulta ativa
                transacao.set(controleRef, {
                    userId: usuario.uid,
                    agendamentoId: novoAgendamentoRef.id,
                    atualizadoEm: FieldValue.serverTimestamp(),
                });

                return "confirmado";
            }
        );

        if (resultado === "consulta-ativa") {
            return respostaErro(
                "Você já possui uma consulta ativa.",
                409
            );
        }

        if (resultado === "horario-ocupado") {
            return respostaErro(
                "Este horário acabou de ser reservado. Escolha outro.",
                409
            );
        }

        return NextResponse.json(
            {
                mensagem: "Agendamento confirmado!",
                agendamentoId: novoAgendamentoRef.id,
            },
            { status: 201 }
        );
    } catch (erro) {
        console.error("Erro ao reservar horário:", erro);

        return respostaErro(
            "Não foi possível concluir o agendamento.",
            500
        );
    }
}