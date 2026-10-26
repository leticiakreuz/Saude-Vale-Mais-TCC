import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
    try {
        const authorization = request.headers.get("authorization");
        if (!authorization?.startsWith("Bearer ")) {
            return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
        }
        const usuario = await adminAuth.verifyIdToken(authorization.slice(7).trim(), true);
        const corpo: unknown = await request.json();
        if (!corpo || typeof corpo !== "object" || Array.isArray(corpo)) {
            return NextResponse.json({ erro: "Dados inválidos." }, { status: 400 });
        }
        const { agendamentoId } = corpo as Record<string, unknown>;
        if (typeof agendamentoId !== "string" || !/^[a-zA-Z0-9]{1,100}$/.test(agendamentoId)) {
            return NextResponse.json({ erro: "Identificador inválido." }, { status: 400 });
        }

        const usuarioRef = adminDb.collection("usuarios").doc(usuario.uid);
        const consultaRef = usuarioRef.collection("agendamentos").doc(agendamentoId);
        const controleRef = usuarioRef.collection("controleAgendamento").doc("ativo");

        const resultado = await adminDb.runTransaction(async (tx) => {
            const consultaSnap = await tx.get(consultaRef);
            const controleSnap = await tx.get(controleRef);
            if (!consultaSnap.exists) return "nao-encontrado";
            const consulta = consultaSnap.data()!;
            const status = String(consulta.status ?? "").trim().toLowerCase();
            if (["cancelado", "concluido", "concluído", "finalizado"].includes(status)) return "finalizado";

            const reservaId = consulta.reservaId;
            const reservaRef = typeof reservaId === "string" && /^[a-f0-9]{64}$/.test(reservaId)
                ? adminDb.collection("horariosReservados").doc(reservaId)
                : null;
            const reservaSnap = reservaRef ? await tx.get(reservaRef) : null;
            if (reservaSnap?.exists && (
                reservaSnap.data()?.pacienteId !== usuario.uid ||
                reservaSnap.data()?.agendamentoId !== agendamentoId
            )) {
                throw new Error("Reserva não corresponde ao agendamento.");
            }

            tx.update(consultaRef, { status: "cancelado", canceladoEm: FieldValue.serverTimestamp() });
            if (controleSnap.exists && controleSnap.data()?.agendamentoId === agendamentoId) {
                tx.update(controleRef, { agendamentoId: null, atualizadoEm: FieldValue.serverTimestamp() });
            }
            if (reservaRef && reservaSnap?.exists) {
                tx.update(reservaRef, { status: "cancelado", atualizadoEm: FieldValue.serverTimestamp() });
            }
            return "cancelado";
        });

        if (resultado === "nao-encontrado") return NextResponse.json({ erro: "Agendamento não encontrado." }, { status: 404 });
        if (resultado === "finalizado") return NextResponse.json({ erro: "Agendamento já cancelado ou concluído." }, { status: 409 });
        return NextResponse.json({ mensagem: "Agendamento cancelado." });
    } catch (erro) {
        console.error("Erro ao cancelar agendamento:", erro);
        return NextResponse.json({ erro: "Não foi possível cancelar o agendamento." }, { status: 500 });
    }
}
